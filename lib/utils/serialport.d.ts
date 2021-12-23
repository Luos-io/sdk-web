import { CustomSerialOptions } from '../interfaces/serialport.js';
export declare const defaultSerialOptions: CustomSerialOptions;
export interface ICancellablePromise<T> extends Promise<T> {
    cancel: (err: Error) => void;
}
export declare const cancellablePromiseWithTimeout: <T>(promise: ICancellablePromise<T>, time: number) => Promise<T>;
export declare const open: (port: SerialPort, debug?: boolean) => Promise<boolean>;
export declare const close: (port: SerialPort, _debug?: boolean) => Promise<boolean>;
export declare const write: (port: SerialPort, data: string | Buffer, debug?: boolean) => Promise<boolean>;
export declare const read: (port: SerialPort, debug?: boolean) => Promise<any | undefined>;
//# sourceMappingURL=serialport.d.ts.map