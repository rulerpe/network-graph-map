export const physics = {
    barnesHut: {
        gravitationalConstant: -100000,
        centralGravity: 5,
        springLength: 150,
        springConstant: 0.5,
        damping: 1,
    },
    hierarchicalRepulsion: {
        centralGravity: 0.1,
        springLength: 100,
        springConstant: 0,
        nodeDistance: 0,
        damping: 1
    },
    stabilization: {
        enabled: true,
        iterations: 2000,
        updateInterval: 10,
        onlyDynamicEdges: false,
        fit: true
    },
};