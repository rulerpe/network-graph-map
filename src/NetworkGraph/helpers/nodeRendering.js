import { Groups, APIDeviceTypes, FilteredGroups } from "../visjs/helpers";
import { defaultNodeSize, collapseExpandButtonNodeSize } from "../visjs/options/nodes";
import { groups, generatePlusIconPillImageWithText, generateMinusIconPillImageWithText, generateGroupSizeImageWithText }
    from "../visjs/options/groups";
import * as Scaling from "./scaling";
import * as Grouping from "./grouping";

function decorateNodes(network, shouldDecorate, createNode) {
    const nodes = [];
    const nodesDataSet = network.body.data.nodes;
    const nodeIndices = network.body.nodeIndices;
    for (const key of nodeIndices) {
        const device = network.body.nodes[key];
        if (!device || device.options.isAddon) {
            continue;
        }
        if (shouldDecorate(device.options)) {
            nodes.push(device);
        }
    }

    const data = [];
    for (const device of nodes) {
        const node = createNode(device.options);
        data.push(node);
    }
    nodesDataSet.add(data);
}

const questionMarkOffset = {
    x: - Math.sqrt(defaultNodeSize ** 2 / 2),
    y: - Math.sqrt(defaultNodeSize ** 2 / 2)
};

const groupSizeOffset = {
    x: + Math.sqrt(defaultNodeSize ** 2 / 2),
    y: - Math.sqrt(defaultNodeSize ** 2 / 2)
};

const collapseButtonOffset = {
    x: Math.sqrt((2 * defaultNodeSize) ** 2 / 2),
    y: - Math.sqrt((2 * defaultNodeSize) ** 2 / 2)
};

const collapseButtonOffsetForHub = {
    x: Math.sqrt(defaultNodeSize ** 2 / 2),
    y: - Math.sqrt(defaultNodeSize ** 2 / 2)
};

function getCollapseButtonOffsetForGroup(group) {
    if (group === Groups.Hub || group === FilteredGroups.Hub) {
        return { ...collapseButtonOffsetForHub };
    } else {
        return { ...collapseButtonOffset };
    }
}

function shouldAddQuestionMark(device) {
    const isInferred = device.attributes.isInferred;
    const hasConfig = device.attributes["configuration-id"];
    if (!isInferred && !hasConfig && !device._decorated) {
        return true;
    }

    return false;
}

function createQuestionMark(device) {
    device._decorated = true;
    const isFiltered = device.group.indexOf("Filtered") > -1;
    const group = !isFiltered ? Groups.Question : `${Groups.Question}Filtered`;

    return {
        attributes: {
            ...device.attributes
        },
        isAddon: true,
        id: device.id + "-shadow",
        level: device.level,
        for: {
            ...device
        },
        offset: {
            ...questionMarkOffset
        },
        group,
        name: "",
    };
}

export function createQuestionMarks(network) {
    decorateNodes(network, shouldAddQuestionMark, createQuestionMark);
}

function shouldAddGroupSize (groupNodeIds, device) {
    return groupNodeIds.indexOf(device.id) > -1;
}

function updateNodeSizeImage(node, size, isFiltered) {
    const image = generateGroupSizeImageWithText("" + size, isFiltered);
    updateNodeImage(node, image);
}

function createGroupSize(isFiltered, ownerNode) {
    ownerNode._groupSize = true;
    const group = Groups.GroupSize;
    const node = {
        attributes: {
            ...ownerNode.attributes
        },
        isAddon: true,
        id: Grouping.createGroupSizeNodeId(ownerNode.id),
        level: ownerNode.level,
        for: {
            ...ownerNode
        },
        offset: {
            ...groupSizeOffset
        },
        group,
        name: "",
    };

    updateNodeSizeImage(node, ownerNode.groupDetail.size, isFiltered);

    return node;
}

function createGroupSizes(network, groupNodeIds, isFiltered) {
    decorateNodes(network, shouldAddGroupSize.bind(null, groupNodeIds), createGroupSize.bind(null, isFiltered));
}

export function createOrShowGroupSizes(network, groupNodeIds, isFiltered) {
    const nodesRequireAddOns = [];

    for (let nodeId of groupNodeIds) {
        const addOnNodeId = Grouping.createGroupSizeNodeId(nodeId);
        const node = network.body.nodes[addOnNodeId];

        if (node) {
            showNode(network, addOnNodeId);
        } else {
            nodesRequireAddOns.push(nodeId);
        }
    }

    if (nodesRequireAddOns.length) {
        createGroupSizes(network, nodesRequireAddOns, isFiltered);
    }
}

function isCollapsible(device) {
    return device.shouldCluster?.childCount > 0; // shouldCluster is pre calculated on first load
}

function shouldAddHalo(device) {
    const deviceType = device.attributes["device-type"];
    if (!device._hasHalo && isCollapsible(device) && (deviceType === APIDeviceTypes.SWITCH || deviceType === APIDeviceTypes.ROUTER)) {
        return true;
    }

    return false;
}

function shouldAddHaloForHub(device) {
    const deviceType = device.attributes["device-type"];
    if (!device._hasHalo && isCollapsible(device) && deviceType === APIDeviceTypes.HUB) {
        return true;
    }

    return false;
}

function createHalo(group, device) {
    device._hasHalo = true;

    return {
        attributes: {
            ...device.attributes
        },
        isAddon: true,
        id: device.id + "-halo",
        level: device.level,
        for: {
            ...device
        },
        x: device.x,
        y: device.y,
        group,
        name: "",
    };
}
const createHaloForSwitch = createHalo.bind(null, Groups.Halo);
const createHaloForHub = createHalo.bind(null, Groups.HaloForHub);

function shouldAddCollapseButton(device) {
    const deviceType = device.attributes["device-type"];
    if (!device._hasCollapse && isCollapsible(device) &&
        (deviceType === APIDeviceTypes.SWITCH ||
            deviceType === APIDeviceTypes.HUB ||
            deviceType === APIDeviceTypes.ROUTER)) {
        return true;
    }

    return false;
}
function updateNodeImage(node, image) {
    node.image = {
        selected: image,
        unselected: image,
    };
}
function updateCollapseButtonImage(node, text, isFiltered) {
    const image = generateMinusIconPillImageWithText("" + text, isFiltered);
    updateNodeImage(node, image);
}

function updateExpandButtonImage(node, text, isFiltered) {
    const image = generatePlusIconPillImageWithText("" + text, isFiltered);
    updateNodeImage(node, image);
}

function createCollapseButton(device) {
    device._hasCollapse = true;
    const isFiltered = device.group.indexOf("Filtered") > -1;
    const group = !isFiltered ? Groups.Minus : `${Groups.Minus}Filtered`;
    const offset = getCollapseButtonOffsetForGroup(device.group);
    offset.x = offset.x + collapseExpandButtonNodeSize;

    const node = {
        attributes: {
            ...device.attributes
        },
        isAddon: true,
        id: device.id + "-collapse-button",
        level: device.level,
        for: {
            ...device
        },
        offset,
        ...groups[group],
        group,
        name: "",
    };

    updateCollapseButtonImage(node, device.shouldCluster?.childCount, isFiltered);

    return node;
}

function createExpandButton(device) {
    device._hasExpand = true;
    const isFiltered = device.group.indexOf("Filtered") > -1;
    const group = !isFiltered ? Groups.Plus : `${Groups.Plus}Filtered`;
    const offset = getCollapseButtonOffsetForGroup(device.group);
    offset.x = offset.x + collapseExpandButtonNodeSize;

    const node = {
        attributes: {
            ...device.attributes
        },
        isAddon: true,
        id: device.id + "-expand-button",
        level: device.level,
        for: {
            ...device
        },
        offset,
        ...groups[group],
        group,
        name: "",
    };

    updateExpandButtonImage(node, device.shouldCluster?.childCount, isFiltered);

    return node;
}

export function getVisibleToggleButtons(network, isCollapse) {
    return Object.keys(network.body.nodes)
        .filter(id => isCollapse ? isCollapseButton(id) : isExpandButton(id))
        .filter(id => !network.body.nodes[id].options.hidden);
}

export function hideNode(network, nodeId) {
    const nodes = network.body.nodes;
    nodes[nodeId].options.hidden = true;
}
function showNode(network, nodeId) {
    const nodes = network.body.nodes;
    nodes[nodeId].options.hidden = false;
}

function hideExpandButtons(network) {
    Object.keys(network.body.nodes)
        .filter(id => isExpandButton(id))
        .forEach(id => hideNode(network, id));
}

export function createCollapseButtons(network) {
    decorateNodes(network, shouldAddHalo, createHaloForSwitch);
    decorateNodes(network, shouldAddHaloForHub, createHaloForHub);

    decorateNodes(network, shouldAddCollapseButton, createExpandButton);
    hideExpandButtons(network);
    decorateNodes(network, shouldAddCollapseButton, createCollapseButton);
}

function scaleOffset(offset, scale) {
    return {
        x: offset.x / scale,
        y: offset.y / scale,
    };
}

export function repositionNodesWithOffset(network, scale) {
    const nodes = [];

    for (const index of network.body.nodeIndices) {
        const node = network.body.nodes[index];
        if (node.options.offset) {
            nodes.push(node);
        }
    }

    for (const node of nodes) {
        const origin = node.options.for;

        if (!origin) {
            continue;
        }

        let offset = node.options.offset;

        if (offset) {
            if (scale) {
                offset = scaleOffset(offset, scale);
            }

            node.x = origin.x + offset.x;
            node.y = origin.y + offset.y;
        }
    }
}

export function isCollapseButton(nodeId) {
    return nodeId && ("" + nodeId).indexOf("-collapse-button") > 0;
}

export function getOwnerIdFromCollapseButtonId(nodeId) {
    return nodeId.substring(0, nodeId.indexOf("-collapse-button"));
}

export function isExpandButton(nodeId) {
    return nodeId && ("" + nodeId).indexOf("-expand-button") > 0;
}

export function getOwnerIdFromExpandButtonId(nodeId) {
    return nodeId.substring(0, nodeId.indexOf("-expand-button"));
}

export function adjustNodePositions(network) {
    const ids = Object.keys(network.body.nodes);

    for (const nodeId of ids) {
        const node = network.body.nodes[nodeId];
        node.x = node.options.x === 0 ? node.options.x : node.options.x || node.x;
        node.y = node.options.y === 0 ? node.options.y : node.options.y || node.y;
    }
}

export function toggleCollapseExpandButton(network, nodeId, forId) {
    if (isCollapseButton(nodeId)) {
        hideNode(network, `${forId}-collapse-button`);
        showNode(network, `${forId}-expand-button`);
    } else {
        hideNode(network, `${forId}-expand-button`);
        showNode(network, `${forId}-collapse-button`);
    }
}

export function fillBackgroundColor(ctx, color = "#ECECEC") {
    // save current translate/zoom
    ctx.save();
    // reset transform to identity
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // fill background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // restore old transform
    ctx.restore();
}

export function fixTreeViewPositioningAfterClustering(network, isHierarchy, scale) {
    if (isHierarchy) {
        adjustNodePositions(network);

        Scaling.resizeNodesAndEdgesByScale(network, scale < 1 ? 1 : scale);

        network.redraw();
    }
}

export function scaleAndFixPositions(network, isHierarchy) {
    const scale = network.getScale();

    Scaling.resizeNodesAndEdgesByScale(network, scale < 1 ? 1 : scale);

    repositionNodesWithOffset(network, scale > 1 ? scale : undefined);

    fixTreeViewPositioningAfterClustering(network, isHierarchy, scale);
}

export function handleZoom(network, scale) {
    if (scale < 1) {
        if (scale < 0.05) {
            network.moveTo({
                scale: 0.05
            });
        }

        return;
    }

    Scaling.resizeNodesAndEdgesByScale(network, scale);

    repositionNodesWithOffset(network, scale);
}

export function zoomIn(network, zoomValue) {
    const scale = network.getScale();

    const newScale = Math.max(0.1, scale + zoomValue); //there is a bug when the scale reaches 0

    if (scale !== newScale) {
        const config = {
            scale: newScale
        };

        network.moveTo(config);

        handleZoom(network, newScale);
    }
}