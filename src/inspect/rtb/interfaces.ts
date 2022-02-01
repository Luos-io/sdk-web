import { CommonOptions } from 'interfaces/common.js';
import { Service } from 'inspect/service/interfaces.js';

export interface RTBOptions extends CommonOptions {}

export enum RTBMode {
  CLEAR,
  SERVICE,
  NODE,
}

export type RTBServiceAlias = string[];
export interface RTBNode {
  ID: number;
  certificate: boolean;
  portTable: number[];
  services: Service[];
}
export interface RTBData {
  protocol: number;
  target: number;
  mode: number;
  source: number;
  command: number;
  size: number;
  nodes: RTBNode[];
}

export interface IRTB {
  (port: SerialPort, options: RTBOptions): Promise<RTBData[]>;
}
export default IRTB;
