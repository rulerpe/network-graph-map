import { indexBy } from "underscore";
import Cache from "../../js-common-deps/Cache";

const CACHE_VERSION = 1;

export function getCacheKey(id, isHierarchy) {
    return `${CACHE_VERSION}-snapshot-${id}-isHierarchy-${isHierarchy}`;
}

export async function getCache(id, isHierarchy) {
    if (!id) {
        return null;
    }

    const key = getCacheKey(id, isHierarchy);

    return await Cache.get(key);
}

/**
 * @param {number|string} id the network snapshot id
 * @param {boolean} isHierarchy whether the graph is using hierarchical layout
 * @param {{nodes: DataSet, edges: DataSet}} dataSet the object containing the visjs DataSets
 * @returns {undefined}
 */
export function setCache(id, isHierarchy, dataSet) {
    if (!id) {
        return;
    }

    const key = getCacheKey(id, isHierarchy);
    const data = extractDataFromVisDataSets(dataSet);

    if (data) {
        Cache.set(key, JSON.stringify({ nodes: indexBy(data.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })), "id") }));
    }
}


/**
 * @param {DataSet} nodesDataSet a DataSet of the nodes, created with new DataSet(nodes)
 * @param {DataSet} edgesDataSet a DataSet of the edges
 * @returns {{nodes: object, edges: object}} a dictionary containing the nodes[] and the edges[]
 */
function extractDataFromVisDataSets({ nodes: nodesDataSet, edges: edgesDataSet }) {
    if (!nodesDataSet || !edgesDataSet) {
        return;
    }

    let nodes = [];
    for (const key in nodesDataSet._data) {
        nodes.push(nodesDataSet._data[key]);
    }

    let edges = [];
    for (const key in edgesDataSet._data) {
        edges.push(edgesDataSet._data[key]);
    }

    return { nodes, edges };
}