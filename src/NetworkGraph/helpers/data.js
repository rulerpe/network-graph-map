export function createResourceIdMap(nodes) {
    return nodes.reduce((prev, curr) => {
        prev[curr.id] = curr.resourceId;

        return prev;
    }, {});
}

export function createNodeIdMap(resourceIdByNodeId) {
    return Object.keys(resourceIdByNodeId).reduce((map, nodeId) => {
        if (resourceIdByNodeId[nodeId]) {
            map[resourceIdByNodeId[nodeId]] = nodeId;
        }

        return map;
    }, {});
}