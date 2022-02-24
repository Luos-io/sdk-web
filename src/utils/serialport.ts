import { logger } from 'utils/logger.js';
import { CustomSerialOptions } from 'interfaces/serialport.js';

const header = Buffer.from([0x7e]);
const footer = Buffer.from([0x81]);

export const defaultSerialOptions: CustomSerialOptions = {
  baudRate: 1000000,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
};

export interface ICancellablePromise<T> extends Promise<T> {
  cancel: (err: Error) => void;
}

export const cancellablePromiseWithTimeout = <T>(
  promise: ICancellablePromise<T>,
  time: number,
) => {
  let timer: NodeJS.Timeout;
  return Promise.race<T>([
    promise,
    new Promise<T>(
      (_res, rej) =>
        (timer = setTimeout(() => {
          const err = new Error('Timeout');
          promise.cancel(err);
          rej(err);
        }, time)),
    ),
  ]).finally(() => clearTimeout(timer));
};

export const init = async () => {
  const ports = await navigator.serial.getPorts();
  if (ports.length === 0) {
    ports.push(await navigator.serial.requestPort());
  }

  return ports;
};

export const connect = async () => await navigator.serial.requestPort();

export const open = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<boolean> => {
  try {
    await port.open(defaultSerialOptions);
    return true;
  } catch (err) {
    if (
      (err as DOMException).code === DOMException.INVALID_STATE_ERR &&
      debug
    ) {
      const { usbProductId, usbVendorId } = port.getInfo();
      logger.debug(`Port (${usbProductId} / ${usbVendorId}) already open`);
      return true;
    }
    return false;
  }
};

export const close = async (
  port: SerialPort,
  _debug: boolean = false,
): Promise<boolean> => {
  try {
    await port.close();
    return true;
  } catch (err) {
    // TO DO - Read spec to handle correctly errors on close.
    // if (
    //   (err as DOMException).code === DOMException.INVALID_STATE_ERR &&
    //   debug
    // ) {
    //   const { usbProductId, usbVendorId } = port.getInfo();
    //   logger.debug(`Port (${usbProductId} / ${usbVendorId}) already open`);
    // }
    return false;
  }
};

export const waitForWritable = async (port: SerialPort) =>
  new Promise((resolve) => {
    const intervalID = setInterval(() => {
      if (port.writable?.locked === false) {
        clearInterval(intervalID);
        resolve(true);
      }
    }, 1000);
  });

export const write = async (
  port: SerialPort,
  data: string | Buffer,
  debug: boolean = false,
): Promise<boolean> => {
  if (port.writable) {
    const { usbProductId, usbVendorId } = port.getInfo();
    let writer: WritableStreamDefaultWriter<Uint8Array | string> =
      port.writable.getWriter();
    if (typeof data === 'string') {
      const encoder = new TextEncoderStream();
      writer = encoder.writable.getWriter();
      encoder.readable.pipeTo(port.writable);
    }

    try {
      await writer.ready;
      if (debug) {
        logger.debug(
          `Sending message to '${usbProductId} - ${usbVendorId}' ...`,
        );
        console.debug(data);
      }
      await writer.write(data);
      await writer.ready;
      await writer.close();

      return true;
    } catch (err) {
      logger.error(
        `Error while writing on serial port : '${usbProductId} - ${usbVendorId}'`,
        (err as Error).message,
      );
      return false;
    }
  }

  return false;
};

export const writeInspector = (
  port: SerialPort,
  command: Buffer,
  debug: boolean = false,
) => {
  // Command's size must be encoded on 2 Bytes, so we check if it fits the requirement
  if (command.length > 0xffff) {
    return Promise.reject("Command buffer's size too big!");
  }

  const commandSize = Buffer.from(new Uint16Array([command.length]).buffer);

  return write(
    port,
    Buffer.concat([header, commandSize, command, footer]),
    debug,
  );
};

export const waitForReadable2 = async (port: SerialPort) =>
  cancellablePromiseWithTimeout(
    {
      ...new Promise((resolve) => {
        const intervalID = setInterval(() => {
          if (port.readable?.locked === false) {
            console.log('Checking if readable2', port.readable?.locked);
            clearInterval(intervalID);
            resolve(true);
          }
        }, 1000);
      }),
      cancel: (err: Error) => logger.warn(err.message),
    },
    10000,
  );

export const waitForReadable = async (port: SerialPort) =>
  new Promise((resolve) => {
    const intervalID = setInterval(() => {
      console.log('Checking if readable', port.readable?.locked);
      if (port.readable?.locked === false) {
        clearInterval(intervalID);
        resolve(true);
      }
    }, 1000);
  });

export const readGate = async (
  port: SerialPort,
  debug: boolean = false,
): Promise<any | undefined> => {
  if (port.readable) {
    const decoder = new TextDecoderStream();
    const reader = decoder.readable.getReader();
    port.readable.pipeTo(decoder.writable);

    try {
      let message = '';
      while (port.readable) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        message += value;
        if (debug && value) {
          logger.debug('Chunk decoded', value);
        }
        reader.releaseLock();
        return message;
      }
      if (debug) {
        logger.log('Message received', message);
      }
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
  return undefined;
};

export const readInspector = async (
  port: SerialPort,
  _debug: boolean = false,
): Promise<Buffer | undefined> => {
  if (port.readable) {
    const reader = port.readable.getReader();
    try {
      let remainingBytes = 0;
      let result = Buffer.from([]);

      do {
        const { value, done } = await reader.read();
        if (done || !value) {
          break;
        }

        const buffer = Buffer.from(value);
        const gotHeader = buffer.indexOf(Buffer.from([0x7e]), 0);
        const gotFooter = buffer.indexOf(Buffer.from([0x81]), 0);

        if (gotHeader !== -1) {
          const size = buffer.readUInt16LE(1);
          const payload = buffer.slice(3);

          remainingBytes = size - payload.length;
          result = Buffer.concat([result, payload]);
        }

        if (gotFooter !== -1) {
          if (remainingBytes >= 0) {
            remainingBytes -= gotFooter;
            result = Buffer.concat([result, buffer.slice(0, gotFooter)]);
          } else {
            remainingBytes = 0;
            result = result.slice(0, result.length - 1);
          }
        }

        if (gotHeader === -1 && gotFooter === -1 && remainingBytes > 0) {
          remainingBytes -= buffer.length;
          result = Buffer.concat([result, buffer]);
        }

        if (remainingBytes === 0) {
          break;
        }
      } while (port.readable);

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
  return undefined;
};
