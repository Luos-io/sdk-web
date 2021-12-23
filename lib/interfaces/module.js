/**
 * ModuleType
 * @description Type of module
 * @link Gate - https://docs.luos.io/pages/embedded/tools/gate.html
 * @enum {string}
 */
export var ModuleType;
(function (ModuleType) {
    ModuleType["ALL"] = "ALL";
    ModuleType["GATE"] = "GATE";
    ModuleType["SNIFFER"] = "SNIFFER";
})(ModuleType || (ModuleType = {}));
export var moduleTypeEnum = Object.keys(ModuleType);
export default moduleTypeEnum;
