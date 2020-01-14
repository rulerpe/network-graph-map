import FontFaceObserver from "fontfaceobserver";
import { Network, DataSet } from "vis";

// allow creating DataSets from inside the Network's owner
// which can keep the reference of the DataSet for caching
export function createDataSet({ nodes, edges }) {
    return {
        nodes: new DataSet(nodes),
        edges: new DataSet(edges),
    };
}

export const drawNetwork = (
    onComplete = (network) => network,
    onError = (e) => console.log("unhandled error", e),
    containerId,
    data,
    options
) => {
    // must ensure the font has been loaded by the browser
    // https://github.com/almende/vis/issues/1835
    const fontAwesome5Pro = new FontFaceObserver("FontAwesome",{});

    let MAX_RETRY = 10;
    let container;

    function createNetwork() {
        options = {
            ...options,
            edges: { ...options.edges },
            groups: { ...options.groups },
            interaction: { ...options.interaction },
            layout: { ...options.layout },
            nodes: { ...options.nodes },
            physics: { ...options.physics },
        };

        let network;
        try {
            network = new Network(container, data, options);
            // return a handle so we can interact with it
            onComplete(network);
        } catch (error) {
            onError(error);
        }
    }

    const draw = () => {
        fontAwesome5Pro.load(/* default timeout is 3000ms */).then(
            ()=>{console.log('success');createNetwork()}, // on success
            ()=>{console.log('fails');createNetwork()}, // and on error, which normally is only a problem in IE/Edge because fontfaceobserver's Promise polyfill is somehow not working
        );
    };

    const tryToDraw = () => {
        // console.log("Retry remaining " + MAX_RETRY);
        MAX_RETRY--;

        container = document.getElementById(containerId);

        if (container) {
            draw();
        }
        else if (MAX_RETRY > 0) {
            setTimeout(tryToDraw, 0);
        }
    };

    tryToDraw();
};