import { logger } from 'utils/logger.js';
import { CustomSerialOptions } from 'interfaces/serialport.js';

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

export const read = async (
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
