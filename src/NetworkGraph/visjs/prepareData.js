import { Node, Groups, FilteredGroups, getDeviceType, APIDeviceTypes } from "./helpers";
import { indexBy, sortBy } from "underscore";
import { calculateClustersForNodes } from "../helpers/clustering";

export function getDeviceGroup(deviceType, isFiltered) {
    switch (deviceType) {
        case APIDeviceTypes.SERVER:
            return isFiltered ? FilteredGroups.Server : Groups.Server;
        case APIDeviceTypes.WORKSTATION:
            return isFiltered ? FilteredGroups.Computer : Groups.Computer;
        case APIDeviceTypes.HUB:
            return isFiltered ? FilteredGroups.Hub : Groups.Hub;
        case APIDeviceTypes.PRINTER:
            return isFiltered ? FilteredGroups.Printer : Groups.Printer;
        case APIDeviceTypes.ROUTER:
            return isFiltered ? FilteredGroups.Router : Groups.Router;
        case APIDeviceTypes.SWITCH:
            return isFiltered ? FilteredGroups.Switch : Groups.Switch;
        case APIDeviceTypes.UNKNOWN:
        case APIDeviceTypes.NETWORK_DEVICE:
        default:
            return isFiltered ? FilteredGroups.Unknown : Groups.Unknown;
    }
}

function NodeFactory(device, isFiltered) {
    const id = device.id;
    const name = device.attributes["name"];
    const deviceType = getDeviceType(device);
    const group = getDeviceGroup(deviceType, isFiltered);

    return Node(id, device.attributes, name, group);
}

export function createNodes(devices = [], filteredNodes) {
    let map;
    if (filteredNodes) {
        map = indexBy(filteredNodes, "id");
    }

    return devices.reduce((nodes, device) => {
        nodes.push(NodeFactory(device, map && !map[device.id]));

        return nodes;
    }, []);
}

function EdgeFactory(connection) {
    const { attributes } = connection;

    return {
        to: attributes["to-network-device-id"],
        from: attributes["from-network-device-id"],
    };
}

export function createEdges(connections) {
    return connections.reduce((edges, connection) => {
        edges.push(EdgeFactory(connection));

        return edges;
    }, []);
}

function getSize(node, getChildren, visiting) {
    if (visiting[node.id]) {
        return 0;
    } else {
        visiting[node.id] = true;
    }
    if (node.subTreeSize) {
        return node.subTreeSize;
    }

    let size = 1;

    const children = getChildren[node.id];
    if (children) {
        node.mass = children.length || 1;
        for (const child of children) {
            size += getSize(child, getChildren, visiting);
            visiting[child.id] = false;
        }
    }

    node.subTreeSize = size;

    return size;
}

export function assignNodeIds(nodes, edges) {

    // find node without parent
    // find its children
    // assign id to node and children
    // repeat per child
    // if child already been visited, skip to avoid infinit loop
    // if node has no child, return

    const nodesById = nodes.reduce((prev, curr) => { prev[curr.id] = curr;

        return prev; }, {});
    const visited = new Set();
    const childrenByPID = {};
    const nodesWithParent = {};
    for (const edge of edges) {
        const cid = edge.to;
        const pid = edge.from;
        nodesWithParent[cid] = pid;
        childrenByPID[pid] = childrenByPID[pid] || [];
        childrenByPID[pid].push(nodesById[cid]);
        nodesById[cid].parents = (nodesById[cid].parents || []);
        nodesById[cid].parents.push(pid);
    }

    let roots = [];
    for (const node of nodes) {
        if (!nodesWithParent[node.id]) {
            roots.push(nodesById[node.id]);
        }
    }
    if (!roots.length) {
        console.log("every node has a parent ==> there is probably a loop between the nodes");

        // find the loop and assign an id within the loop to pid
        const visitedIds = {};
        let cid = edges[0].to;
        let pid = edges[0].from;

        // the while loop is guaranteed to end in either case:
        // 1. pid is undefined ==> no loop
        // 2. we found the pid that has been visited ==> loop found
        while (pid && !visitedIds[pid]) {
            visitedIds[cid] = true;
            cid = pid;
            pid = nodesWithParent[cid];
        }

        // put all the nodes in the loop into roots
        let node = nodesById[pid];
        let visitedNodes = {};
        while (node && !visitedNodes[node.id]) {
            roots.push(node);
            visitedNodes[node.id] = true;
            node = nodesById[nodesWithParent[node.id]];
        }

        // let's break the parent/child relation between
        // the first 2 nodes within the loop
        // and use the first node as the root
        if (roots.length > 1) {
            const rootNode = roots[0];
            const rootParent = roots[1];
            delete nodesWithParent[rootNode.id]; // actually not necessary at this point but let's be consistent
            const children = childrenByPID[rootParent.id];
            const index = children.indexOf(nodesById[rootNode.id]);
            children.splice(index, 1); //break the relation here
            roots = [rootNode]; // [1...] are all decendants of the rootNode because rootNode is the parent of node at [-1]
        }
    }

    // after searching for the loop
    // this could only happen if an edge has a "from" value
    // that does not belong in the graph data
    if (!roots.length) {
        console.log("something is wrong ===> there is no loop but every node has a parent, using first node as root: ", nodes[0]);
        roots.push(nodes[0]);
    }

    // calculate the size of each node
    // for sorting while traversing the tree later
    for (const node of nodes) {
        getSize(node, childrenByPID, {});
    }

    let id = 1;
    const resourceIdToId = {};

    function depthFirstTraverse(node, visitedNodes, getChildren, level) {
        node.level = Math.max(node.level || 0, level);
        if (visitedNodes.has(node)) {
            return;
        } else {
            visitedNodes.add(node);
        }
        node.resourceId = node.id;
        node.id = id++;
        resourceIdToId[node.resourceId] = node.id;

        let children = getChildren[node.resourceId];
        if (!children) {
            return;
        }

        children = sortBy(children, c => c.subTreeSize);

        for (const child of children) {
            if (node.parents?.indexOf(+child.resourceId) > -1) {
                continue; // skip loops
            }

            const nextLevel = node.level + child.parents.length;
            depthFirstTraverse(child, visitedNodes, getChildren, nextLevel);
        }
    }

    roots = sortBy(roots, c => c.subTreeSize);
    for (const root of roots) {
        depthFirstTraverse(root, visited, childrenByPID, 1);
    }

    nodes = sortBy(nodes, node => node.id);

    calculateClustersForNodes(nodes, edges);

    // use the new node ids
    for (const edge of edges) {
        edge.from = resourceIdToId[edge.from];
        edge.to = resourceIdToId[edge.to];
    }

    return { nodes, edges };
}

export function prepareData({ nodes, edges, filteredNodes }) {
    nodes = createNodes(nodes, filteredNodes);
    edges = createEdges(edges);

    return assignNodeIds(nodes, edges);
}
