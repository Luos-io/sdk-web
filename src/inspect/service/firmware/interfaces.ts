import { SemVer } from 'semver';

import { Service, ServiceOptions } from 'inspect/service/interfaces.js';

export type ServiceFirmware = SemVer;

export interface ServiceFirmwareData {
  protocol: number;
  target: number;
  mode: number;
  source: number;
  command: number;
  size: number;
  firmware: ServiceFirmware | null;
}

export interface IServiceFirmware {
  (
    id: Service['ID'],
    port: SerialPort,
    options?: ServiceOptions,
  ): Promise<ServiceFirmwareData>;
}
