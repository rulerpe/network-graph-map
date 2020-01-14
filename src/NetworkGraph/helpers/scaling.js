import { defaultWidth } from "../visjs/options/edges";
import { defaultNodeSize, defaultFontSize, defaultInferredNodeSize, collapseExpandButtonNodeSize } from "../visjs/options/nodes";

export function getOptionsByScale(scale) {
    return {
        edges: {
            width: defaultWidth / scale
        },
        nodes: {
            size: defaultNodeSize / scale,
            font: {
                size: defaultFontSize / scale
            }
        },
        groups: {
            hub: {
                size: defaultInferredNodeSize / scale,
            },
            hubFiltered: {
                size: defaultInferredNodeSize / scale,
            },
            groupSize: {
                shape: "image",
                zIndex: 2,
                size: collapseExpandButtonNodeSize / scale,
            },
            question: {
                size: 12 / scale,
            },
            questionFiltered: {
                size: 12 / scale,
            },
            halo: {
                size: defaultNodeSize * 2 / scale,
            },
            haloFiltered: {
                size: defaultNodeSize * 2 / scale,
            },
            haloForHub: {
                size: defaultNodeSize / scale,
            },
            haloForHubFiltered: {
                size: defaultNodeSize / scale,
            },
            plus: {
                size: collapseExpandButtonNodeSize / scale,
            },
            plusFiltered: {
                size: collapseExpandButtonNodeSize / scale,
            },
            minus: {
                size: collapseExpandButtonNodeSize / scale,
            },
            minusFiltered: {
                size: collapseExpandButtonNodeSize / scale,
            },
        }
    };
}

export function resizeNodesAndEdgesByScale(network, scale) {
    network.setOptions(getOptionsByScale(scale));
    // it seems scaling will kick off physics simulation again, so let's stop it here
    network.stopSimulation();
}