import {
  logger,
  open /*, close*/,
  writeInspector,
  readInspector,
} from 'utils/index.js';
import { IRTB, RTBMode, RTBNode } from 'inspect/rtb/interfaces.js';
import { Service, ServiceAccess } from 'inspect/service/interfaces.js';

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
const parseService = (rtb: Buffer): Service => {
  const ID = rtb.readUInt16LE(0);
  const type = rtb.readUInt16LE(2);
  const access: ServiceAccess = rtb.readUInt8(4);
  const alias = rtb
    .slice(5, 22)
    .filter((v) => v !== 0x00 && v !== 0xff)
    .toString();

  return {
    ID,
    type,
    access,
    alias,
    firmware: null,
    statistics: null,
  };
};

export const rtb: IRTB = async (_port, { debug }) => {
  const ports = await navigator.serial.getPorts();
  if (ports.length === 0) {
    ports.push(await navigator.serial.requestPort());
  }

  const test = ports.map(async (port) => {
    try {
      const isPortOpen = await open(port, debug);
      if (isPortOpen) {
        const rtbBuffer = Buffer.from([
          0xf0, 0xff, 0x03, 0x00, 0x0e, 0x00, 0x00,
        ]);
        const hasWriteSucceed = await writeInspector(port, rtbBuffer, debug);
        if (hasWriteSucceed) {
          const result = await readInspector(port, debug);

          if (result) {
            const protocol = result.readUInt8(0) & 0b1111;
            const target =
              (result.readUInt8(0) >> 4) | (result.readUInt8(1) << 4);
            const mode = result.readUInt8(2) & 0b1111;
            const source =
              (result.readUInt8(2) >> 4) | (result.readUInt8(3) << 4);
            const command = result.readUInt8(4);
            const size = result.readUInt16LE(5);
            const rtb = result.slice(7);

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
            } while (
              rtb.slice(index).length !== 0 &&
              parseMode(rtb.slice(index)) !== RTBMode.CLEAR
            );

            if (debug) {
              console.group('RTB data:');
              console.log('Protocol', protocol.toString(10));
              console.log('Target', target.toString(10));
              console.log('Mode', mode.toString(10));
              console.log('Source', source.toString(10));
              console.log('Command', command.toString(10));
              console.log('Size', size.toString(10));
              console.table(
                nodes.map((n: RTBNode) => {
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

            return {
              protocol,
              target,
              mode,
              source,
              command,
              size,
              nodes,
            };
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
      // logger.info('Closing the serial port ...');
      // await close(port);
    }
  });

  return Promise.all(test);
};
export default rtb;
