import { APIDeviceTypes, getDeviceType } from "../visjs/helpers";
import { createNodeIdMap, createResourceIdMap } from "./data";
import { indexBy } from "underscore";
import { scaleAndFixPositions, getOwnerIdFromExpandButtonId, toggleCollapseExpandButton,
    getOwnerIdFromCollapseButtonId } from "./nodeRendering";
import { isGroupId } from "./grouping";


export function createClusterNodeId(nodeId) {
    return `clusterFor_${nodeId}`;
}

export function getNodeIdFromClusterNodeId(nodeId) {
    return nodeId.split("_")[1];
}

//do not cluster this child if any other parent is a switch or router
export function canCluster(node) {
    const deviceType = getDeviceType(node);

    return deviceType !== APIDeviceTypes.SWITCH && deviceType !== APIDeviceTypes.ROUTER;
}

/**
 * @function canClusterParents
 * @desc recursively checks all parents in the input and their ancestors, if there is any,
 * returns false if any of them cannot be clustered, e.g. by calling canCluster(node),
 * otherwise returns true
 * e.g. in this example, we will return true for parents [ClickedNode, Hub2]
 *      ClickedNode => Hub1 => Hub2 => Child
 *      ClickedNode => Child
 * but not this, because Hub2 has a Switch as parent which cannot be clustered
 *      ClickedNode => Switch => Hub2 => Child
 *      ClickedNode => Child
 * @param {string | number} clusterResourceId the resource id of the node we try to cluster
 * @param {string[] | number[]} parentResourceIds the resource ids of the parents of the cluster node
 * @param { { [nodeId] : [resource] } } _resources a key-value map for each nodeId and node resource object pair
 * @param { { [resourceId] : [nodeId] } } _nodeIds a key-value map for each resourceId and nodeId pair
 * @returns {boolean} whether all the parents in question can be clustered
 */

export function canClusterParents(clusterResourceId, parentResourceIds, _resources, _nodeIds) {
    if (!parentResourceIds || !parentResourceIds.length) {
        return true;
    }

    let result = true;

    for (let parentResourceId of parentResourceIds) {
        // no need to continue if some node cannot be clustered already
        if (!result) {
            return false;
        }

        //skip the node we clicked
        if (parentResourceId != clusterResourceId) { // eslint-disable-line eqeqeq
            const parent = _resources[_nodeIds[parentResourceId]];

            if (!canCluster(parent)) {
                return false;
            }

            const grandParentResourceIds = _resources[_nodeIds[parentResourceId]].parents;
            result = canClusterParents(clusterResourceId, grandParentResourceIds, _resources, _nodeIds);
        }
    }

    return result;
}

function calculateShouldCluster(nodeId, _resources, _nodeIds, _resourceIds, _childrenByParentId) {
    const selfResourceId = _resourceIds[nodeId];

    let childCount = 0;

    const childrenByResourceId = _childrenByParentId[selfResourceId] || {};
    let childResourceIds = Object.keys(childrenByResourceId);

    // store node ids not resource ids since that's what visjs will provide
    const shouldCluster = {
        [nodeId]: true
    };
    const visited = {
        [selfResourceId]: true
    };

    const childrenWithMultiParents = [];

    while (childResourceIds.length) {
        const grandChildrenResourceIds = [];

        for (let childResourceId of childResourceIds) {
            if (!visited[childResourceId]) {
                visited[childResourceId] = true;

                const node = _resources[_nodeIds[childResourceId]];

                if (canCluster(node)) {
                    // include all the decendents by recursively adding each node's children to the queue
                    if (_childrenByParentId[childResourceId]) {
                        grandChildrenResourceIds.push(...Object.keys(_childrenByParentId[childResourceId]));
                    }

                    const parents = node.parents;

                    if (canClusterParents(selfResourceId, parents, _resources, _nodeIds)) {
                        shouldCluster[_nodeIds[childResourceId]] = true;

                        // do not count Hubs
                        if (!node.attributes.isInferred) {
                            childCount++;
                        }
                    } else {
                        childrenWithMultiParents.push(node.id);
                    }
                }
            }
        }

        childResourceIds = grandChildrenResourceIds;
    }
    shouldCluster.childCount = childCount;
    shouldCluster.childrenWithMultiParents = childrenWithMultiParents;

    return shouldCluster;
}

export function calculateClustersForNodes(nodes, edges) {
    const _resources = indexBy(nodes, "id");

    const _childrenByParentId = edges.reduce((prev, curr) => {
        const parentId = curr.from;
        const childId = curr.to;
        prev[parentId] = prev[parentId] || {};
        prev[parentId][childId] = true;

        return prev;
    }, {});

    const _resourceIds = createResourceIdMap(nodes);

    const _nodeIds = createNodeIdMap(_resourceIds);

    nodes = nodes.filter(node => {
        const deviceType = node.attributes["device-type"];

        return deviceType === APIDeviceTypes.SWITCH ||
            deviceType === APIDeviceTypes.ROUTER ||
            deviceType === APIDeviceTypes.HUB;
    });

    for (const node of nodes) {
        node.shouldCluster = calculateShouldCluster(node.id, _resources, _nodeIds, _resourceIds, _childrenByParentId);
    }
}

export function hideEdges(network, nodeId, hideCondition) {
    const node = network.body.nodes[nodeId];

    if (!node) { return; }

    const edges = node.edges;

    for (let edge of edges) {
        if (hideCondition(edge)) {
            edge.options.hidden = true;
        }
    }
}

/**
 * @description A helper function that checks whether a node should be included in the cluster,
 *              by verifying there is no more visible edges once this cluster is formed.
 *              Works in conjunction with shouldCluster.
 * @param {Network} network the visjs network
 * @param {object} shouldCluster the map of node ids that should be included in the cluster, see calculateShouldCluster
 * @param {number} clusterNodeId the node id that will be used to create the cluster
 * @param {number} childId the node id we are checking if it should be included in the cluster
 * @returns {boolean} returns false if the node:
 *                      1. is a cluster itself
 *                      2. has at least one visible edge after the cluster is formed
 *                      3. cannot be found (for any reason) as a fallback
 */
function shouldInclude(network, shouldCluster, clusterNodeId, childId) {
    if (network.isCluster(createClusterNodeId(childId))) {
        return false;
    }

    return hasVisibleEdges(network, shouldCluster, clusterNodeId, childId);
}

function hasVisibleEdges(network, shouldCluster, clusterNodeId, childId) {
    const clusterNode = network.body.nodes[clusterNodeId];
    const childNode = network.body.nodes[childId];

    if (clusterNode && childNode) {
        const visibleEdges = childNode.edges.filter(e => {
            return !shouldCluster[e.fromId] && !e.options.hidden && (e.options.physics === undefined || !!e.options.physics);
        });

        return visibleEdges.length === 0;
    }

    return false;
}

export function cluster(network, nodeId) {
    const resourcesByNodeId = network.body.data.nodes._data;
    const shouldCluster = resourcesByNodeId[nodeId]?.shouldCluster || {};

    const clusterId = createClusterNodeId(nodeId);

    const clusterOptions = {
        joinCondition: (childOptions) => {
            if (network.isCluster(childOptions.id)) {
                if (isGroupId(childOptions.id)) {
                    return hasVisibleEdges(network, shouldCluster, nodeId, childOptions.id);
                }
                const childId = getNodeIdFromClusterNodeId(childOptions.id);

                const node = resourcesByNodeId[childId];

                if (node.attributes.isInferred && shouldCluster[childId]) {
                    return true;
                }
            } else {
                const node = resourcesByNodeId[childOptions.id];
                if (node.isAddon) {
                    return (shouldCluster[node.for.id] || shouldInclude(network, shouldCluster, nodeId, node.for.id)) && node.for.id != nodeId; //eslint-disable-line
                }

                return shouldCluster[childOptions.id] || shouldInclude(network, shouldCluster, nodeId, childOptions.id);
            }
        },
        clusterNodeProperties: {
            ...network.body.data.nodes.get(nodeId),
            id: clusterId,
            label: `${resourcesByNodeId[nodeId].label}`,
            color: network.body.nodes[nodeId].options.color,
            zIndex: network.body.nodes[nodeId].options.zIndex,
        }
    };
    network.cluster(clusterOptions);
    hideEdges(network, clusterId, (edge) => edge.fromId === clusterId && (!edge.to || canCluster(edge.to.options)));
    // network.stabilize(1);
}

export function openCluster(network, clusterNodeId, isHierarchy) {
    network.openCluster(clusterNodeId, {
        releaseFunction: function (clusterPosition, containedNodesPositions) {
            return containedNodesPositions;
        }
    });

    releaseChildrenFromOtherClusters(network, clusterNodeId, isHierarchy);
}


function releaseChildrenFromOtherClusters(network, clusterNodeId, isHierarchy) {
    const nodeId = getNodeIdFromClusterNodeId(clusterNodeId);
    const childrenWithMultiParents = network.body.nodes[nodeId].options.shouldCluster.childrenWithMultiParents;

    if (childrenWithMultiParents.length) {
        const clusters = new Set();

        for (let childId of childrenWithMultiParents) {
            const containers = network.clustering.findNode(childId);
            const clusterId = containers[0];

            if (network.isCluster(clusterId) && !isGroupId(clusterId)) {
                clusters.add(clusterId);
            }
        }

        for (let cid of clusters) {
            openCluster(network, cid, isHierarchy); // it might look like an infinite loop but the opened cluster id won't be added to the Set again
            cluster(network, getNodeIdFromClusterNodeId(cid));
        }

        // it is possible that visjs is creating new edges from other clusters to these nodes
        // in which case we need to hide them too
        for (let childId of childrenWithMultiParents) {
            hideEdges(network, childId, (edge) => network.isCluster(edge.fromId));
        }

        scaleAndFixPositions(network, isHierarchy);
    }
}

export function clusterAll(network, collapseButtonIds) {
    collapseButtonIds
        .sort((a, b) => {
            a = +getOwnerIdFromCollapseButtonId(a);
            b = +getOwnerIdFromCollapseButtonId(b);

            return b - a; //cluster from the node with the a larger id first since we want to cluster all sub trees first
        })
        .forEach(nodeId => {
            const forId = getOwnerIdFromCollapseButtonId(nodeId);
            if (!network.isCluster(network.findNode(forId)[0])) {
                toggleCollapseExpandButton(network, nodeId, forId);
                cluster(network, forId);
            }
        });
}

export function openAllClusters(network, isHierarchy, expandButtonIds) {
    expandButtonIds
        .sort((a, b) => {
            a = +getOwnerIdFromExpandButtonId(a);
            b = +getOwnerIdFromExpandButtonId(b);

            return a - b; //open clusters with a smaller id first
        })
        .forEach(nodeId => {
            const forId = getOwnerIdFromExpandButtonId(nodeId);
            const container = network.findNode(forId)[0];
            if (network.isCluster(container)) {
                toggleCollapseExpandButton(network, nodeId, forId);
                openCluster(network, container, isHierarchy);
            }
        });
}