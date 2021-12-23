/**
 * ModuleType
 * @description Type of module
 * @link Gate - https://docs.luos.io/pages/embedded/tools/gate.html
 * @enum {string}
 */
export enum ModuleType {
  ALL = 'ALL',
  GATE = 'GATE',
  SNIFFER = 'SNIFFER',
}

export const moduleTypeEnum = Object.keys(ModuleType);
export default moduleTypeEnum;
