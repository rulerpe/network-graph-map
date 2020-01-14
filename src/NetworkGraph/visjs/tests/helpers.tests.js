import { getDeviceType, APIDeviceTypes } from "../helpers";

describe("Gets device type", () => {
    it("If device type is unknown, take device type from itg", () => {
        const device = {
            attributes: {
                "device-type": "NETWORK DEVICE",
                name: "NG name",
                "configuration-type-name": "Switch"
            }
        };
        expect(getDeviceType(device)).toBe(APIDeviceTypes.SWITCH);

        device.attributes["configuration-type-name"] = "Server";
        expect(getDeviceType(device)).toBe(APIDeviceTypes.SERVER);

        device.attributes["configuration-type-name"] = "Router";
        expect(getDeviceType(device)).toBe(APIDeviceTypes.ROUTER);

        device.attributes["configuration-type-name"] = "Computer";
        expect(getDeviceType(device)).toBe(APIDeviceTypes.WORKSTATION);

        device.attributes["configuration-type-name"] = "Printer";
        expect(getDeviceType(device)).toBe(APIDeviceTypes.PRINTER);
    });
});