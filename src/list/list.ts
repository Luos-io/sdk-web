import { logger, open, write, read } from 'utils/index';
import { ModuleType, moduleTypeEnum } from 'interfaces/module';

import { IList } from 'list/interfaces.js';

const checkPortCompatibility = async (
  port: SerialPort,
  moduleType: ModuleType,
  debug: boolean = false,
): Promise<boolean> => {
  try {
    const isPortOpen = await open(port, debug);
    if (isPortOpen) {
      const hasWriteSucceed = await write(port, '{"discover": {}}\r', debug);
      if (hasWriteSucceed) {
        const message = await read(port, debug);
        const json = JSON.parse(message);
        const response = moduleTypeEnum.find(
          (moduleType) => json[moduleType.toLowerCase()] !== undefined,
        ) as ModuleType;

        if (response && response === moduleType) {
          return true;
        }
      }
    }
  } catch (err) {
    logger.warn(
      'Can not init communication with the serial port.',
      (err as Error).message,
    );
  }

  return false;
};

export const list: IList<SerialPort[]> = async (moduleType, debug) => {
  const luosPorts: SerialPort[] = [];
  const allowedPorts = await navigator.serial.getPorts();
  if (allowedPorts.length > 0) {
    await Promise.all(
      allowedPorts.map(async (port) => {
        const isLuosCompatible = await checkPortCompatibility(
          port,
          moduleType,
          debug,
        );
        if (isLuosCompatible) {
          luosPorts.push(port);
        }
      }),
    );
  } else {
    try {
      const port = await navigator.serial.requestPort();
      const isLuosCompatible = await checkPortCompatibility(
        port,
        moduleType,
        debug,
      );
      if (isLuosCompatible) {
        luosPorts.push(port);
      }
    } catch (err) {
      logger.warn('Can not get the user serial port.', (err as Error).message);
    }
  }

  return luosPorts;
};
export default list;
