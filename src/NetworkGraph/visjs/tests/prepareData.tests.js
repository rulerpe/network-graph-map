import { assignNodeIds, createNodes, createEdges } from "../prepareData";
import { mockDevicesResp, mockConnectionsResp } from "apps/network/tests/mock";

function makeNodes(n) {
    const nodes = [];

    for (let id = 1; id <= n; id++) {
        nodes.push({ id, attributes: {} });
    }

    return nodes;
}

function makeEdges(edges) {
    const res = [];

    for (const edge of edges) {
        res.push({ from: edge[0], to: edge[1] });
    }

    return res;
}

// TODO: add more detailed specs to verify the view models
describe("prepareData", () => {
    describe("createNodes", () => {
        it("works", () => {
            const data = mockDevicesResp.body.data;
            const nodes = createNodes(data);
            expect(nodes.length).toEqual(data.length);
        });
    });

    describe("createEdges", () => {
        it("works too", () => {
            const data = mockConnectionsResp.body.data;
            const nodes = createEdges(data);
            expect(nodes.length).toEqual(data.length);
        });
    });

    describe("assignNodeIds", () => {
        describe(`with a tree with 5 nodes:
                1
               / \\
              2   3
              |   |
              4   5

            ==>
                1
               / \\
              2   4
              |   |
              3   5
        `,
        () => {
            const inputEdges = [[1, 2], [1, 3], [2, 4], [3, 5]];
            const { nodes, edges } = assignNodeIds(makeNodes(5), makeEdges(inputEdges));

            it("should traverse in depth-first order and assign ids", () => {
                expect(nodes[0].resourceId).toBe(1); expect(nodes[0].id).toBe(1);
                expect(nodes[1].resourceId).toBe(2); expect(nodes[1].id).toBe(2);

                // take notes in the next 2 lines
                expect(nodes[2].resourceId).toBe(4); expect(nodes[2].id).toBe(3);
                expect(nodes[3].resourceId).toBe(3); expect(nodes[3].id).toBe(4);

                expect(nodes[4].resourceId).toBe(5); expect(nodes[4].id).toBe(5);
            });

            it("should update the id references in edges", () => {
                expect(edges[1].to).toBe(4);
                expect(edges[2].to).toBe(3);
                expect(edges[3].from).toBe(4);
            });
        });

        describe(`with a tree with 6 nodes:
                1
               / \\
              2   3
             /   / \\
            6   4   5
            => note the last level in visjs this would be renders as
            => 4, 5, 6
            => with the edge [2,6] crossing over [3,4] and [3,5]
            => so we want to re assign new ids to them
            ==>
                1
               / \\
              2   4
             /   / \\
            3   5   6
        `,
        () => {
            const inputEdges = [[1, 2], [1, 3], [2, 6], [3, 4], [3, 5]];
            const { nodes, edges } = assignNodeIds(makeNodes(6), makeEdges(inputEdges));

            it("should traverse in depth-first order and assign ids", () => {
                expect(nodes[0].resourceId).toBe(1); expect(nodes[0].id).toBe(1);
                expect(nodes[1].resourceId).toBe(2); expect(nodes[1].id).toBe(2);

                // take notes of the new ids here
                expect(nodes[2].resourceId).toBe(6); expect(nodes[2].id).toBe(3);
                expect(nodes[3].resourceId).toBe(3); expect(nodes[3].id).toBe(4);
                expect(nodes[4].resourceId).toBe(4); expect(nodes[4].id).toBe(5);
                expect(nodes[5].resourceId).toBe(5); expect(nodes[4].id).toBe(5);
            });

            it("should update the id references in edges", () => {
                expect(edges[1].to).toBe(4);
                expect(edges[2].to).toBe(3);
                expect(edges[3].from).toBe(4);
                expect(edges[3].to).toBe(5);
                expect(edges[4].from).toBe(4);
                expect(edges[4].to).toBe(6);
            });

            it("should assign correct levels", () => {
                expect(nodes[0].level).toBe(1);
                expect(nodes[1].level).toBe(2);
                expect(nodes[2].level).toBe(3);
                expect(nodes[3].level).toBe(2);
                expect(nodes[4].level).toBe(3);
                expect(nodes[5].level).toBe(3);
            });
        });
    });

    describe("creates icon and name from matched itg data", () => {
        it("Matching configuration is of type switch", () => {
            const data = mockDevicesResp.body.data;
            const nodes = createNodes(data);
            expect(nodes[11].label).toEqual(data[11].attributes["name"]);
            expect(nodes[11].group).toEqual("switch");
        });
        it("Matching configuration is of type computer", () => {
            const data = mockDevicesResp.body.data;
            const nodes = createNodes(data);
            expect(nodes[12].label).toEqual(data[12].attributes["name"]);
            expect(nodes[12].group).toEqual("computer");
        });
        it("Matching configuration is of type router", () => {
            const data = mockDevicesResp.body.data;
            const nodes = createNodes(data);
            expect(nodes[13].label).toEqual(data[13].attributes["name"]);
            expect(nodes[13].group).toEqual("router");
        });
    });

});