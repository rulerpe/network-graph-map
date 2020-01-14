import { reduce } from "underscore";
import { APIDeviceTypes, getDeviceType } from "../visjs/helpers";
import { getDeviceGroup } from "../visjs/prepareData";
import * as Clustering from "./clustering";
import * as Rendering from "./nodeRendering";

export function createGroupSizeNodeId(nodeId) {
    return `${nodeId}-group-size`;
}

function createGroupNodeId(parentIds, type) {
    return `group-by-${type}-for-${parentIds}`;
}

export function isGroupId(nodeId) {
    return nodeId.indexOf("group-by-") > -1 && nodeId.indexOf("-group-size") < 0;
}

function ungroup(network, groupNodeId) {
    network.openCluster(groupNodeId, {
        releaseFunction: function (__unused__, containedNodesPositions) {
            return containedNodesPositions;
        }
    });
}

export function ungroupByType(network) {
    const groupNodeIds = network.body.nodeIndices
        .filter(id => isGroupId("" + id));

    groupNodeIds.forEach(nodeId => {
        ungroup(network, nodeId);

        Rendering.hideNode(network, createGroupSizeNodeId(nodeId));
    });
}

/**
 * Helper function that will loop thru all nodes in the network
 * and collect nodes and a set of node types per parent set.
 * For example, [1], [2], [1, 2] are 3 different sets of parent ids,
 * and we will create 3 groups for collecting nodes whose parent ids matches strictly with each.
 * @param {object} network the visjs network instance
 * @returns {Group[]} a list of Group objects for creating the group clusters
 */
export function _findGroupsByTypePerParentSet(network) {
    const groups = {};

    network.body.nodeIndices.forEach((nodeId) => {
        const node = network.body.nodes[nodeId];

        const deviceType = getDeviceType(node.options);

        if (deviceType === APIDeviceTypes.HUB) {
            return;
        }

        if (Clustering.canCluster(node.options) && node.options.parents?.length >= 1) {

            // use parent node ids (comma-separated) to identify unique groups
            const groupId = node.options.parents.sort().toString();

            if (!groups[groupId]) {
                groups[groupId] = {
                    id: groupId,
                    children: {},
                    childrenTypesSet: new Set()
                };
            }

            groups[groupId].children[node.id] = node;
            groups[groupId].childrenTypesSet.add(deviceType);
        }
    });

    return reduce(groups, (list, group) => {
        list.push(group);

        return list;
    }, []);
}

export function groupAllLeavesByType(network, hasFilter) {
    const groups = _findGroupsByTypePerParentSet(network);

    const groupNodeIds = [];

    groups.forEach((group) => {
        const { id, children, childrenTypesSet } = group;

        for (let type of childrenTypesSet) {
            const clusterNodeId = createGroupCluster(network, id, children, type, hasFilter);
            groupNodeIds.push(clusterNodeId);
        }
    });

    Rendering.createOrShowGroupSizes(network, groupNodeIds, hasFilter);
}

function createGroupCluster(network, groupId, children, type, hasFilter) {
    const baseNode = findClusterBase(children, type);

    const resourcesByNodeId = network.body.data.nodes._data;
    const nodesInGroup = {};
    const shouldGroup = {};
    let groupSize = 0;

    for (let nodeId of network.body.nodeIndices) {
        const node = network.body.data.nodes._data[nodeId];

        if (!node) {
            continue;
        }

        let child = node;

        // for add-on nodes, we want to verify its owner node
        if (child.isAddon) {
            child = child.for;
        }

        child = children[child.id];

        if (!child || getDeviceType(child.options) !== type) {
            continue;
        } else {
            shouldGroup[node.id] = true;
            nodesInGroup[child.id] = child;

            // do not count add-on nodes towards the group size
            if (!node.isAddon) {
                groupSize++;
            }
        }
    }

    const clusterId = createGroupNodeId(groupId, type);

    const clusterOptions = {
        joinCondition: (childOptions) => {
            let child = resourcesByNodeId[childOptions.id];
            if (!child) {
                return false;
            }

            return !!shouldGroup[child.id];
        },
        clusterNodeProperties: {
            allowSingleNodeCluster: true,
            ...baseNode.options,
            group: getDeviceGroup(type, hasFilter),
            id: clusterId,
            label: "",
            color: baseNode.options.color,
            zIndex: baseNode.options.zIndex,
            groupDetail: {
                type,
                size: groupSize,
                nodes: nodesInGroup
            }
        }
    };

    network.cluster(clusterOptions);

    // we need to display the size of each group by adding a hepler node,
    // since creating extra node individually has a performance impact on tree view,
    // we can collect the group ids and create the helper nodes in a batch later
    return clusterId;
}

/**
 * Since the group should look exactly like an individual child node of its type,
 * we choose a node of the specified type from the group to be used for configuring the cluster,
 * mostly for receiving the position (e.g. { x, y }) as well as other properties for rendering.
 * @param {object} children a collection of nodes to be grouped together by each type
 * @param {string} type the type of nodes to be grouped
 * @returns {object} the base node for this group cluster's clusterNodeProperties
 */
function findClusterBase(children, type) {
    let base;

    const childIds = Object.keys(children);

    for (let childId of childIds) {
        const child = children[childId];

        if (getDeviceType(child.options) === type) {
            if ((!base || child.options.level >= base.options.level)) {
                base = child;
            } else {
                continue;
            }
        }
    }

    return base;
}

export function getGroupDetail(network, groupId) {
    return network.body.nodes[groupId].options.groupDetail;
}