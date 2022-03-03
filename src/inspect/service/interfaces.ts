import { CommonOptions } from 'interfaces/common.js';
import { ServiceFirmware } from 'inspect/service/firmware/interfaces.js';
import { ServiceStatistics } from 'inspect/service/statistics/interfaces.js';

export interface ServiceOptions extends CommonOptions {}

export enum ServiceType {
  VOID_TYPE,
  GATE_TYPE,
  COLOR_TYPE,
  ANGLE_TYPE,
  STATE_TYPE,
  DISTANCE_TYPE,
  VOLTAGE_TYPE,
  IMU_TYPE,
  LIGHT_TYPE,
  LOAD_TYPE,
  PIPE_TYPE,
  MOTOR_TYPE,
  SERVO_MOTOR_TYPE,
  INSPECTOR_TYPE,
  LUOS_LAST_TYPE,
}

export enum ServiceAccess {
  READ_WRITE_ACCESS,
  READ_ONLY_ACCESS,
  WRITE_ONLY_ACCESS,
  NO_ACCESS,
}

export type Service = {
  ID: number;
  type: ServiceType;
  access: ServiceAccess;
  alias: string;
  firmware: ServiceFirmware | null;
  statistics: ServiceStatistics | null;
};
