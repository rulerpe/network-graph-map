import { COLOR } from "../../constants";
import { defaultInferredNodeSize, defaultNodeSize, collapseExpandButtonNodeSize } from "./nodes";

function GroupColor(background, border, hover) {
    return {
        background,
        border,
        hover,
        highlight: hover,
    };
}

function GroupIcon(code, color = "black") {
    return {
        code,
        color,
        face: "'FontAwesome'",
    };
}

function generateImage(svgString) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
}

/* eslint-disable */
function makeQuestionMark(color) {
    return `<path xmlns="http://www.w3.org/2000/svg" fill="${color}" d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z"/>`;
}
const questionMark = makeQuestionMark(COLOR.ORANGE);
const whiteCircle = '<circle cx="50%" cy="50%" r="256" fill="white" />';
const questionSvg =
    '<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">' +
        whiteCircle +
        questionMark +
    '</svg>';

const questionIconDimmed =
    '<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">' +
        whiteCircle +
        makeQuestionMark(COLOR.GRAY_DIMMED) +
    '</svg>';

const question = generateImage(questionSvg);
const questionFiltered = generateImage(questionIconDimmed);

const generateHaloSvg = (borderColor = COLOR.GRAY) => `
    <svg width="10" height="10" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="50%" r="50%" mask="url(#rmvCir)" fill="#ECECEC" stroke="${borderColor}" stroke-dasharray="20 30" stroke-width="1em" />
        <mask id="rmvCir">
            <circle cx="50%" cy="50%" r="50%" fill="white" />
            <circle cx="50%" cy="50%" r="0%" fill="black" />
        </mask>
    </svg>
`;
const haloSVG = generateHaloSvg();
const haloImage = generateImage(haloSVG);

const haloFilteredSVG = generateHaloSvg(COLOR.GRAY_DIMMED);
const haloFilteredImage = generateImage(haloFilteredSVG);

function makePlusSvgForPill(color) {
    return `
        <svg version="1.1" width="20" height="10" viewBox="0 0 512 512">
            <circle cx="0" cy="50%" r="40%" fill="white" />
            <path transform="translate(-256)" xmlns="http://www.w3.org/2000/svg" fill="${color}" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"/>
        </svg>
    `;
}
function makeMinusSvgForPill(color) {
    return `
        <svg version="1.1" width="20" height="10" viewBox="0 0 512 512">
            <circle cx="0" cy="50%" r="40%" fill="white" />
            <path transform="translate(-256)" xmlns="http://www.w3.org/2000/svg" fill="${color}" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zM124 296c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h264c6.6 0 12 5.4 12 12v56c0 6.6-5.4 12-12 12H124z"/>
        </svg>
    `;
}

function makePillSvg(icon, text, isFiltered) {
    return `
        <svg version="1.1" width="20" height="10" viewBox="0 0 20 10" xmlns="http://www.w3.org/2000/svg">
            <rect width="20" height="10" fill="${isFiltered ? "#CCCCCC" : COLOR.GRAY_LIGTHEN2}" ry="5" rx="5"/>
            <circle cx="5" cy="5" r="5" fill="${isFiltered ? COLOR.GRAY_DIMMED : COLOR.GRAY2}" />
            ${icon}
            <style><![CDATA[
                text {
                    font: 5px Roboto;
                }
                ]]>
            </style>
            <text x="14.5" y="5" dominant-baseline="central" alignment-baseline="central" text-anchor="middle" fill="${isFiltered ? COLOR.GRAY2 : COLOR.BLACK}">${""+text}</text>
        </svg>
    `;
}

function makeBluePillSvg(text, isFiltered) {
    const height = 10;
    const defaultWidth = 10;

    const fontSize = 5;
    const extraCharacterCount = text.length - 1;
    const extraWidth = (extraCharacterCount * fontSize / 2);

    const width = defaultWidth + extraWidth;

    const horizontalOffset = width / 2 + extraWidth / 2;

    const textOffsetX = width / 2;
    const textOffsetY = height / 2;

    return `
        <svg version="1.1" width="${width * 2}" height="10" viewBox="0 0 ${width * 2} 10" xmlns="http://www.w3.org/2000/svg">
            <rect x="${horizontalOffset}" y="0" width="${width}" height="${height}" fill="${isFiltered ? COLOR.BLUE_DIMMED : COLOR.BLUE}" ry="5" rx="5"/>
            <style><![CDATA[
                text {
                    font: ${fontSize}px Roboto;
                }
                ]]>
            </style>
            <text x="${horizontalOffset + textOffsetX}" y="${textOffsetY}" dominant-baseline="central" alignment-baseline="central" text-anchor="middle" fill="${COLOR.WHITE}">${"" + text}</text>
        </svg>
    `;
}
const generatePillImageWithText = (icon, text = "", isFiltered) => generateImage(makePillSvg(icon, text, isFiltered));
export const generatePlusIconPillImageWithText = (text, isFiltered) => generatePillImageWithText(makePlusSvgForPill(isFiltered ? COLOR.GRAY_DIMMED : COLOR.GRAY2), text, isFiltered);
export const generateMinusIconPillImageWithText = (text, isFiltered) => generatePillImageWithText(makeMinusSvgForPill(isFiltered ? COLOR.GRAY_DIMMED : COLOR.GRAY2), text, isFiltered);
export const generateGroupSizeImageWithText = (text, isFiltered = false) => generateImage(makeBluePillSvg(text, isFiltered));
/* eslint-enable */


export const groups = {
    computer: {
        color: GroupColor(COLOR.BACKGROUND, COLOR.BLUE, { background: COLOR.BLUE }),
        icon: GroupIcon("\uf108"),
    },
    computerFiltered: {
        color: GroupColor(COLOR.BACKGROUND_DIMMED, COLOR.BLUE_DIMMED, { background: COLOR.BLUE_DIMMED }),
        icon: GroupIcon("\uf108", COLOR.BLACK_DIMMED),
    },
    hub: {
        color: GroupColor(COLOR.GRAY_LIGTHEN, COLOR.GRAY_LIGTHEN, { background: COLOR.GRAY_LIGTHEN, border: COLOR.GRAY_LIGTHEN }),
        size: defaultInferredNodeSize,
        zIndex: 1,
    },
    hubFiltered: {
        color: GroupColor(COLOR.GRAY_DIMMED, COLOR.GRAY_DIMMED, { background: COLOR.GRAY_DIMMED, border: COLOR.GRAY_DIMMED }),
        size: defaultInferredNodeSize,
        zIndex: 1,
    },
    printer: {
        color: GroupColor(COLOR.BACKGROUND, COLOR.BLUE, { background: COLOR.BLUE }),
        icon: GroupIcon("\uf02f"),
    },
    printerFiltered: {
        color: GroupColor(COLOR.BACKGROUND_DIMMED, COLOR.BLUE_DIMMED, { background: COLOR.BLUE_DIMMED }),
        icon: GroupIcon("\uf02f", COLOR.BLACK_DIMMED),
    },
    router: {
        color: GroupColor(COLOR.BACKGROUND, COLOR.YELLOW, { background: COLOR.YELLOW }),
        icon: GroupIcon("\uf0a0"),
        zIndex: 1,
    },
    routerFiltered: {
        color: GroupColor(COLOR.BACKGROUND_DIMMED, COLOR.YELLOW_DIMMED, { background: COLOR.YELLOW_DIMMED }),
        icon: GroupIcon("\uf0a0", COLOR.BLACK_DIMMED),
        zIndex: 1,
    },
    switch: {
        color: GroupColor(COLOR.BACKGROUND, COLOR.YELLOW, { background: COLOR.YELLOW }),
        icon: GroupIcon("\uf362"),
        zIndex: 1,
    },
    switchFiltered: {
        color: GroupColor(COLOR.BACKGROUND_DIMMED, COLOR.YELLOW_DIMMED, { background: COLOR.YELLOW_DIMMED }),
        icon: GroupIcon("\uf362", COLOR.BLACK_DIMMED),
        zIndex: 1,
    },
    server: {
        color: GroupColor(COLOR.BACKGROUND, COLOR.BLUE, { background: COLOR.BLUE }),
        icon: GroupIcon("\uf233"),
    },
    serverFiltered: {
        color: GroupColor(COLOR.BACKGROUND_DIMMED, COLOR.BLUE_DIMMED, { background: COLOR.BLUE_DIMMED }),
        icon: GroupIcon("\uf233", COLOR.BLACK_DIMMED),
    },
    unknown: {
        color: GroupColor(COLOR.BACKGROUND, COLOR.BLUE, { background: COLOR.BLUE }),
        icon: GroupIcon("\uf796"),
    },
    unknownFiltered: {
        color: GroupColor(COLOR.BACKGROUND_DIMMED, COLOR.BLUE_DIMMED, { background: COLOR.BLUE_DIMMED }),
        icon: GroupIcon("\uf796", COLOR.BLACK_DIMMED),
    },
    groupSize: {
        shape: "image",
        size: collapseExpandButtonNodeSize,
        zIndex: 2,
    },
    question: {
        image: {
            selected: question,
            unselected: question
        },
        shape: "image",
        size: 12,
        zIndex: 2,
    },
    questionFiltered: {
        image: {
            selected: questionFiltered,
            unselected: questionFiltered,
        },
        shape: "image",
        size: 12,
        zIndex: 2,
    },
    halo: {
        image: {
            selected: haloImage,
            unselected: haloImage,
        },
        shape: "image",
        size: defaultNodeSize * 2,
        zIndex: -10,
    },
    haloFiltered: {
        image: {
            selected: haloFilteredImage,
            unselected: haloFilteredImage,
        },
        shape: "image",
        size: defaultNodeSize * 2,
        zIndex: -10,
    },
    haloForHub: {
        image: {
            selected: haloImage,
            unselected: haloImage,
        },
        shape: "image",
        size: defaultNodeSize,
        zIndex: -10,
    },
    haloForHubFiltered: {
        image: {
            selected: haloFilteredImage,
            unselected: haloFilteredImage,
        },
        shape: "image",
        size: defaultNodeSize,
        zIndex: -10,
    },
    plus: {
        shape: "image",
        size: collapseExpandButtonNodeSize,
        zIndex: 2,
    },
    plusFiltered: {
        shape: "image",
        size: collapseExpandButtonNodeSize,
        zIndex: 2,
    },
    minus: {
        shape: "image",
        size: collapseExpandButtonNodeSize,
        zIndex: 2,
    },
    minusFiltered: {
        shape: "image",
        size: collapseExpandButtonNodeSize,
        zIndex: 2,
    },
};
