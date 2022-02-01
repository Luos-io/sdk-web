import semver from 'semver';

import {
  IServiceFirmware,
  ServiceFirmwareData,
} from 'inspect/service/firmware/interfaces.js';
import {
  logger,
  open,
  waitForWritable,
  write,
  waitForReadable2,
} from 'utils/index.js';

export const firmware: IServiceFirmware = async (id, port, options) => {
  try {
    const isPortOpen = await open(port, options?.debug ?? false);
    if (isPortOpen) {
      if (port.writable?.locked === true) {
        if (options?.debug) {
          logger.debug(id.toString(), 'Waiting for port to be writable ...');
        }
        await waitForWritable(port);
      }
      const data = Buffer.from([
        0x00,
        0x03,
        0x00,
        0x00,
        0x13,
        0x00,
        0x02,
        id,
        0x00,
        0x7e,
      ]);
      console.log(id.toString(), 'Sending firmware request...');
      const hasWriteSucceed = await write(port, data, options?.debug ?? false);
      if (hasWriteSucceed && port.readable) {
        if (port.readable?.locked === true) {
          if (options?.debug) {
            logger.debug(id.toString(), 'Waiting for port to be readable ...');
          }
          await waitForReadable2(port);
        }
        console.log(id.toString(), 'TEST', port.readable?.locked);
        const reader = port.readable?.getReader();
        try {
          let remainingBytes = 0;
          let firmware = Buffer.from([]);
          let result: ServiceFirmwareData = {
            protocol: 0,
            target: 0,
            mode: 0,
            source: 0,
            command: 0,
            size: 0,
            firmware: null,
          };

          do {
            const { value, done } = await reader.read();
            if (done || !value) {
              break;
            }

            const buffer = Buffer.from(value);
            const gotHeader = buffer.indexOf(
              Buffer.from([0x7e, 0x7e, 0x7e, 0x7e]),
              0,
            );
            if (gotHeader !== -1) {
              const protocol = buffer.readUInt8(4) & 0b1111;
              const target =
                (buffer.readUInt8(4) >> 4) | (buffer.readUInt8(5) << 4);
              const mode = buffer.readUInt8(6) & 0b1111;
              const source =
                (buffer.readUInt8(6) >> 4) | (buffer.readUInt8(7) << 4);
              const command = buffer.readUInt8(8);

              result = {
                ...result,
                protocol,
                target,
                mode,
                source,
                command,
              };

              if (buffer.length > 10) {
                const size = buffer.readUInt16LE(9);
                const payload = buffer.slice(11);
                firmware = Buffer.concat([firmware, payload]);
                console.log(id.toString(), 'Regular buffer size', firmware);
                result = {
                  ...result,
                  size,
                  firmware: semver.coerce(payload.join('.')),
                };
                break;
              } else {
                console.log(
                  id.toString(),
                  'strange buffer size',
                  buffer.length,
                  buffer,
                );
              }
            } else if (buffer.length > 0 && remainingBytes > 0) {
              console.log(
                id.toString(),
                'Not regulare buffer size',
                remainingBytes,
              );
              remainingBytes -= buffer.length;
            }
          } while (port.readable);

          reader.releaseLock();
          return result;
        } catch (err) {
          const { message, stack } = err as Error;
          logger.error(
            id.toString(),
            'Error while reading data from :',
            message,
            stack ? stack : '',
          );
        } finally {
          reader.releaseLock();
        }
      }
    }

    return Promise.reject();
  } catch (err) {
    logger.warn(
      id.toString(),
      'Can not init communication with the serial port.',
      (err as Error).message,
    );
    return Promise.reject();
  }
};
export default firmware;
