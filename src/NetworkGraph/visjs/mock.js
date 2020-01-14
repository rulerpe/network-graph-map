import { Computer, Hub, Printer, Router, Switch, Unknown } from "./helpers";

export const mockNodes = [
    { id: 0, label: "Internet", group: "cloud" },
    Router(1),
    Router(2),
    Router(3),
    Router(4),

    Switch(5),
    Switch(6),
    Hub(7),
    Switch(8),

    Printer(9),
    Computer(10),

    Unknown(11),
    Unknown(12),
    Unknown(13),
    Unknown(14),
    Unknown(15),

    Unknown(16),
    Unknown(17),
    Computer(18),

    Printer(19),
    Computer(20),
    Computer(21),
];

export const mockEdges = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 0, to: 3 },
    { from: 0, to: 4 },

    { from: 1, to: 5 },
    { from: 2, to: 6 },
    { from: 3, to: 7 },
    { from: 4, to: 8 },

    { from: 5, to: 9 },
    { from: 5, to: 10 },

    { from: 6, to: 11 },
    { from: 6, to: 12 },
    { from: 6, to: 13 },
    { from: 6, to: 14 },
    { from: 6, to: 15 },

    { from: 7, to: 16 },
    { from: 7, to: 17 },
    { from: 3, to: 18 },

    { from: 8, to: 19 },
    { from: 8, to: 20 },
    { from: 8, to: 21 },
];