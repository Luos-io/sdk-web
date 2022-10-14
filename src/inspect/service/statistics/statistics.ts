import {
  IServiceStatistics,
  ServiceStatistics,
} from 'inspect/service/statistics/interfaces.js';

import {
  logger,
  open,
  waitForWritable,
  writeInspector,
  waitForReadable2,
  readInspector,
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
  // ID must be encoded on 2 Bytes, so we check if it fits the requirement
  if (id > 0xffff) {
    return Promise.reject(`This ID (${id}) is not supported`);
  }

  try {
    const isPortOpen = await open(port, options?.debug ?? false);
    if (isPortOpen) {
      if (port.writable?.locked === true) {
        if (options?.debug) {
          logger.debug(id.toString(), 'Waiting for port to be writable ...');
        }
        await waitForWritable(port);
      }

      const commandBuffer = Buffer.concat([
        Buffer.from([0x00, 0x03, 0x00, 0x00, 0x14, 0x00, 0x02]),
        Buffer.from(new Uint16Array([id]).buffer),
      ]);
      const hasWriteSucceed = await writeInspector(
        port,
        commandBuffer,
        options?.debug ?? false,
      );
      if (hasWriteSucceed && port.readable) {
        if (port.readable?.locked === true) {
          if (options?.debug) {
            logger.debug(
              `Waiting for port to be readable for service '${id.toString()}' ...`,
            );
          }
          await waitForReadable2(port);
        }

        const result = await readInspector(port, options?.debug);

        if (result) {
          const protocol = result.readUInt8(0) & 0b1111;
          const target =
            (result.readUInt8(0) >> 4) | (result.readUInt8(1) << 4);
          const mode = result.readUInt8(2) & 0b1111;
          const source =
            (result.readUInt8(2) >> 4) | (result.readUInt8(3) << 4);
          const command = result.readUInt8(4);
          const size = result.readUInt16LE(5);

          const statistics = parseStatistics(result.slice(7));

          if (options?.debug) {
            console.group('Statistics command data:');
            console.log('Protocol', protocol.toString(10));
            console.log('Target', target.toString(10));
            console.log('Mode', mode.toString(10));
            console.log('Source', source.toString(10));
            console.log('Command', command.toString(10));
            console.log('Size', size.toString(10));
            console.group('Statistics:');
            console.log('RX_MAX_STACK_RATIO', statistics.rx_msg_stack_ratio);
            console.log('LUOS_STACK_RATIO', statistics.luos_stack_ratio);
            console.log('TX_MSG_STACK_RATIO', statistics.tx_msg_stack_ratio);
            console.log(
              'BUFFER_OCCUPATION_RATIO',
              statistics.buffer_occupation_ratio,
            );
            console.log('MSG_DROP_NUMBER', statistics.msg_drop_number);
            console.log('MAX_LOOP_TIME_MS', statistics.max_loop_time_ms);
            console.log('MAX_RETRY', statistics.max_retry);
            console.groupEnd();
            console.groupEnd();
          }

          return {
            protocol,
            target,
            mode,
            source,
            command,
            size,
            statistics,
          };
        }
      }
    }

    return Promise.reject('Port is not open');
  } catch (err) {
    logger.warn(
      'Can not init communication with the serial port.',
      (err as Error).message,
    );
    return Promise.reject(err);
  }
};
export default statistics;
