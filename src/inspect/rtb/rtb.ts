import { logger, open, close, write } from 'utils/index.js';
import {
  IRTB,
  RTBData,
  RTBMode,
  RTBNode,
  RTBService,
  RTBServiceAccess,
} from 'inspect/rtb/interfaces.js';

/**
 * @description Parse the RTB response and detect the first mode
 * @param rtb : RTB response
 * @returns RTBMode
 */
const parseMode = (rtb: Buffer): RTBMode => rtb.readUInt8(0);

/**
 * @description Parse a node from the RTB response
 * @param rtb : Slice of the RTB response containing the node details
 * @returns RTBNode
 */
const parseNode = (rtb: Buffer): RTBNode => {
  const ID = rtb.readUInt16LE(0) & 0xfff;
  const certificate = rtb.readUInt16LE(0) >> 12 === 1;
  const portTableBuffer = rtb.slice(2, 18 + 3); // TEMP 3 unknown bytes

  // TO TEST with multiple ports cards
  const portTable = portTableBuffer.reduce((acc, v, i) => {
    if (v !== 0) {
      if (i % 2 === 0) {
        acc.push(v);
      } else {
        acc[acc.length - 1] = acc[acc.length - 1] | (v << 8);
      }
    }
    return acc;
  }, [] as number[]);

  return {
    ID,
    certificate,
    portTable,
    services: [],
  };
};

/**
 * @description Parse a service from the RTB response
 * @param rtb : Slice of the RTB response containing the service details
 * @returns RTBService
 */
const parseService = (rtb: Buffer): RTBService => {
  const ID = rtb.readUInt16LE(0);
  const type = rtb.readUInt16LE(2);
  const access: RTBServiceAccess = rtb.readUInt8(4);
  const alias = rtb
    .slice(5, 22)
    .filter((v) => v !== 0x00 && v !== 0xff)
    .toString();

  return {
    ID,
    type,
    access,
    alias,
  };
};

export const rtb: IRTB = async ({ debug }) => {
  const ports = await navigator.serial.getPorts();
  if (ports.length === 0) {
    ports.push(await navigator.serial.requestPort());
  }

  const test = ports.map(async (port) => {
    try {
      const isPortOpen = await open(port, debug);
      if (isPortOpen) {
        const hasWriteSucceed = await write(
          port,
          Buffer.from([0xf0, 0xff, 0x03, 0x00, 0x3d, 0x00, 0x00, 0x7e]),
          debug,
        );
        if (hasWriteSucceed && port.readable) {
          const reader = port.readable.getReader();
          try {
            let remainingBytes = 0;
            let rtb = Buffer.from([]);
            let result: RTBData = {
              protocol: 0,
              target: 0,
              mode: 0,
              source: 0,
              command: 0,
              size: 0,
              nodes: [],
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
                const size = buffer.readUInt16LE(9);
                const payload = buffer.slice(11);

                remainingBytes = size - payload.length;
                rtb = Buffer.concat([rtb, payload]);

                result = {
                  ...result,
                  protocol,
                  target,
                  mode,
                  source,
                  command,
                  size,
                };
              } else if (buffer.length > 0 && remainingBytes > 0) {
                remainingBytes -= buffer.length;
                rtb = Buffer.concat([rtb, buffer]);

                if (remainingBytes === 0) {
                  let index = 0;
                  const nodes: RTBNode[] = [];
                  do {
                    const mode = rtb.readUInt8(index) as RTBMode;
                    if (mode === RTBMode.NODE) {
                      nodes.push(parseNode(rtb.slice(index + 1, index + 22)));
                    } else if (mode === RTBMode.SERVICE) {
                      nodes[nodes.length - 1].services.push(
                        parseService(rtb.slice(index + 1, index + 22)),
                      );
                    }
                    index += 22;
                  } while (parseMode(rtb.slice(index)) !== RTBMode.CLEAR);
                  result = {
                    ...result,
                    nodes,
                  };
                  break;
                }
              }
            } while (port.readable);

            if (debug) {
              console.group('RTB data:');
              console.log('Protocol', result.protocol.toString(10));
              console.log('Target', result.target.toString(10));
              console.log('Mode', result.mode.toString(10));
              console.log('Source', result.source.toString(10));
              console.log('Command', result.command.toString(10));
              console.log('Size', result.size.toString(10));
              console.table(
                result.nodes.map((n: RTBNode) => {
                  const node = {
                    ...n,
                    Cert: n.certificate ? '✅' : '❌',
                    'Port Table': n.portTable,
                    Services: n.services.map((s: any) => s.alias).join(', '),
                  };
                  return node;
                }),
                ['ID', 'Cert', 'Port Table', 'Services'],
              );
              console.groupEnd();
            }

            return result;
          } catch (err) {
            const { message, stack } = err as Error;
            logger.error(
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
        'Can not init communication with the serial port.',
        (err as Error).message,
      );
      return Promise.reject();
    } finally {
      logger.info('Closing the serial port ...');
      await close(port);
    }
  });

  return Promise.all(test);
};
export default rtb;
