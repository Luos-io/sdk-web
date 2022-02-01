import { CommonOptions } from 'interfaces/common.js';
import { ServiceFirmware } from 'inspect/service/firmware/interfaces.js';
import { ServiceStatistics } from 'inspect/service/statistics/interfaces.js';

export interface ServiceOptions extends CommonOptions {}

export enum ServiceAccess {
  READ_WRITE_ACCESS,
  READ_ONLY_ACCESS,
  WRITE_ONLY_ACCESS,
  NO_ACCESS,
}

export type Service = {
  ID: number;
  type: number;
  access: ServiceAccess;
  alias: string;
  firmware: ServiceFirmware | null;
  statistics: ServiceStatistics | null;
};
