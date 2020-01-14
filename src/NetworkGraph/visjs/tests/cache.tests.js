import { getCache, getCacheKey, setCache } from "../cache";
import { indexBy } from "underscore";
import { Cache } from "../../../js-common-deps/Cache";

describe("NetworkGraph Cache", () => {
    const mockId = 1;

    beforeEach(() => {
        Cache.set = jest.fn();
        Cache.get = jest.fn();
        jest.resetAllMocks();
    });

    describe("getCache", () => {
        it("calls getItem", () => {
            getCache(mockId, false);
            expect(Cache.get).toBeCalledWith(getCacheKey(mockId, false));
        });

        it("does not call getItem if id is falsy", () => {
            getCache(null, false);
            expect(Cache.get).not.toBeCalled();
        });
    });

    describe("setCache", () => {
        it("calls setItem", () => {
            const node1 = { id: 1 };
            const node2 = { id: 2 };
            const dataSet = {
                nodes: {
                    _data: {
                        1: node1,
                        2: node2
                    }
                },
                edges: {}
            };

            setCache(mockId, false, dataSet);

            const extractedData = { nodes: indexBy([node1, node2], "id") };

            expect(Cache.set).toBeCalledWith(getCacheKey(mockId, false), JSON.stringify(extractedData));
        });

        it("does not call getItem if id is falsy", () => {
            setCache(null, false, {});
            expect(Cache.set).not.toBeCalled();
        });
    });
});