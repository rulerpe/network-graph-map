import { COLOR } from "../../constants";

export const defaultWidth = 0.25;

export const edges = {
    color: {
        color: COLOR.GRAY,
    },
    smooth: {
        enabled: true,
        type: "cubicBezier",
        forceDirection: "vertical",
        roundness: 0.5
    },
    shadow: {
        enabled: true,
        color: "rgba(0, 0, 0, 0.3)",
        size: 5,
        x: 5,
        y: 2,
    },
    width: defaultWidth,
    hoverWidth: function (width) { return width * 1.5; },
};
