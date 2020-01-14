export const mockDetails = [
    { name: "Device Type", value: "Computer" },
    { name: "IP Address(es)", value: ["123.123.123.123", "123.123.123.123"] },
    { name: "Mac Address(es)", value: "12:34:12:34:12:34" },
    { name: "ComputerComputerComputerComputerComputerCompute", value: "asdfjkl" },
    { name: "Notes", value: "ComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputerComputer" }, // eslint-disable-line
];

export const mockNetwork = (nodes) => {
    return {
        body: {
            nodeIndices: Object.keys(nodes),
            nodes
        }
    };
};