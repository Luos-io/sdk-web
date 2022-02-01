import {
  IServiceStatistics,
  ServiceStatistics,
  ServiceStatisticsData,
} from 'inspect/service/statistics/interfaces.js';

import {
  logger,
  open,
  waitForWritable,
  write,
  waitForReadable2,
} from 'utils/index.js';

const parseStatistics = (buffer: Buffer): ServiceStatistics => {
  const rx_msg_stack_ratio = buffer.readUInt8(0);
  const luos_stack_ratio = buffer.readUInt8(1);
  const tx_msg_stack_ratio = buffer.readUInt8(2);
  const buffer_occupation_ratio = buffer.readUInt8(3);
  const msg_drop_number = buffer.readUInt8(4);
  const max_loop_time_ms = buffer.readUInt8(5);
  const max_retry = buffer.readUInt8(6);

  return {
    rx_msg_stack_ratio,
    luos_stack_ratio,
    tx_msg_stack_ratio,
    buffer_occupation_ratio,
    msg_drop_number,
    max_loop_time_ms,
    max_retry,
  };
};

export const statistics: IServiceStatistics = async (id, port, options) => {
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
        0x15,
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
        const reader = port.readable?.getReader();
        try {
          let remainingBytes = 0;
          let statisticsBuffer = Buffer.from([]);
          let result: ServiceStatisticsData = {
            protocol: 0,
            target: 0,
            mode: 0,
            source: 0,
            command: 0,
            size: 0,
            statistics: null,
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
                statisticsBuffer = Buffer.concat([statisticsBuffer, payload]);

                const statistics = parseStatistics(statisticsBuffer);
                result = {
                  ...result,
                  size,
                  statistics,
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
          return Promise.reject(err);
        } finally {
          reader.releaseLock();
        }
      }
    }

    return Promise.reject('Port is not open');
  } catch (err) {
    logger.warn(
      id.toString(),
      'Can not init communication with the serial port.',
      (err as Error).message,
    );
    return Promise.reject(err);
  }
};
export default statistics;
