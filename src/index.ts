import { init, connect } from 'utils/serialport.js';
import { rtb, IRTB } from 'inspect/index.js';
import {
  service,
  IServiceFirmware,
  IServiceStatistics,
} from 'inspect/service/index.js';

export * from 'inspect/index.js';
// export * from 'list/index.js';

enum STATE {
  INIT,
  READY,
  ERROR,
}

export class SDK {
  private _state: STATE = STATE.INIT;
  private _ports: SerialPort[] = [];

  constructor() {}

  public init = async () => {
    this._ports.push(...(await init()));

    if (this._ports.length === 0) {
      this._state = STATE.ERROR;
    }

    this._state = STATE.READY;
  };
  public connect = async () => {
    const newPort = await connect();
    this._ports.push(newPort);
    return newPort;
  };

  public getPorts = () => this._ports;
  public getRoutingTable: IRTB = (serialport, options) => {
    if (this._state !== STATE.READY) {
      throw new Error('SDK not ready');
    }
    return rtb(serialport, options);
  };
  public getServiceFirmware: IServiceFirmware = async (
    serviceId,
    serialport,
    options,
  ) => {
    if (this._state !== STATE.READY) {
      throw new Error('SDK not ready');
    }
    return await service.firmware(serviceId, serialport, options);
  };
  public getServiceStatistics: IServiceStatistics = async (
    serviceId,
    serialport,
    options,
  ) => {
    if (this._state !== STATE.READY) {
      throw new Error('SDK not ready');
    }
    try {
      const test = await service.statistics(serviceId, serialport, options);
      console.log('TEST', test);
      return test;
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
    }
  };
}
export default SDK;
