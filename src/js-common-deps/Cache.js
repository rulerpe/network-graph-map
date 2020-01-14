/** @module Cache */

const Crypto = require("crypto-js");
const LocalForage = require("localforage");
const _ = require("underscore");
const { compress, decompress } = process.env.PRODUCT !== "mobile" ? require("lzutf8") : { compress: (v) => v, decompress: (v) => v };

async function _retrieve(key) {
    let value = await LocalForage.getItem(key);

    if (value === undefined || value === null) {
        value = global.localStorage.getItem(key);
    }

    return value;
}

function _set(key, value) {
    global.localStorage.removeItem(key);

    return LocalForage.setItem(key, value);
}

function _tryToParse(str, defaultValue) {
    try {
        return JSON.parse(str) || defaultValue;
    } catch (e) {
        return defaultValue || str; //eslint-disable-line
    }
}

exports.version = 3;

/*
 * Maintain a meta data structure that describes the entries in the LocalForage store.  Will help purge
 * stale data on quote exceed errors.
 */
exports._setMeta = async function (key, data) {
    let meta = _tryToParse(await LocalForage.getItem(key + "-meta")) || {};

    data = _.defaults({
        accessedAt: Date.now(),
        accessedCount: (meta.accessedCount || 0) + 1,
        version: exports.version,
    }, data, meta);

    return LocalForage.setItem(key + "-meta", JSON.stringify(data));
};

/*
 * Retrieve the meta data for the item with the given key
 */
exports.getMeta = async function (key) {
    return _tryToParse(await LocalForage.getItem(key + "-meta"), {}) || {};
};

/**
 *
 * @function get
 * @param {string} key - The key of item to fetch
 * @param {object}   [options] - options
 * @param {function} [options.onDecryptError] - A callback to handle decrypt errors
 * @param {string}   [options.encryptionKey] - an optional decryption key
 * @returns {object} - The cached object
 *
 */
exports.get = async function (key, options = {}) {
    let raw = await _retrieve(key);

    if (raw === undefined || raw === null) {
        return;
    }

    const meta = await exports.getMeta(key);

    if (meta.expiry && Date.now() >= meta.expiry) {
        exports.remove(key);

        return;
    }

    if (options.encryptionKey) {
        try {
            raw = Crypto.AES.decrypt(raw, options.encryptionKey).toString(Crypto.enc.Utf8);

            if (!raw) {
                throw "";
            }
        } catch (e) {
            if (options.onDecryptError) {
                options.onDecryptError();
            }

            return;
        }
    }

    if (options.compress || options.encryptionKey) {
        try {
            raw = decompress(raw, { inputEncoding: "BinaryString" });
        } catch (e) {
            return;
        }
    }

    raw = _tryToParse(raw);

    //update the last accessed timestamp
    exports._setMeta(key);

    return raw;
};

/**
 *
 * @function get
 * @param {string} key - The key of item to set
 * @param {object} value - The value to set
 * @param {object} [options] - options
 * @param {string} [options.encryptionKey] - an optional decryption key
 * @param {number} [options.expireAfterMs] - a ttl for the cache
 * @param {bool}   [options.compress] - a flag that determines whether to compress the string
 *
 */
exports.set = async function (key, value, options = {}) {
    value = typeof (value) !== "string" ? JSON.stringify(value) : value;

    if (options.compress || options.encryptionKey) {
        value = compress(value, { outputEncoding: "BinaryString" });
    }

    if (options.encryptionKey) {
        value = Crypto.AES.encrypt(value, options.encryptionKey).toString();
    }

    try {
        await _set(key, value);

        exports._setMeta(key, {
            size: value.length,
            expiry: options.expireAfterMs && (Date.now() + options.expireAfterMs)
        });
    } catch (e) {
        if (e === "QuotaExceededError") {
            throw { error: e, requiredBytes: value.length };
        } else {
            throw e;
        }
    }
};

/*
 * Remove a single item from the cache
 */
exports.remove = async function (key) {
    await LocalForage.removeItem(key);
    await LocalForage.removeItem(key + "-meta");
};

/**
 * @function purge
 * @param {function} filter - criteria for which keys to remove
 * @returns {Promise} a promise when all the purging is done
 */
exports.purge = async function (filter) {
    //delete all matching keys from localstorage
    Object.keys(global.localStorage).filter(filter).forEach((k) => global.localStorage.removeItem(k));

    const keys = await LocalForage.keys();
    const metaArray = await Promise.all(keys.map((k) => exports.getMeta(k)));
    const meta = _.object(keys, metaArray);

    return Promise.all(keys.filter((k) => filter(k, meta[k])).map(exports.remove));
};
