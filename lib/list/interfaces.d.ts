/// <reference types="w3c-web-serial" />
import { ModuleType } from '../interfaces/module';
export interface ISerialActionHandler<T> {
    (port: SerialPort, debug: boolean): Promise<T>;
}
export interface ISerialActionWriteHandler extends ISerialActionHandler<boolean> {
}
export declare const isPortInfoArray: (object: any) => boolean;
export interface IList<T> {
    (moduleType: ModuleType, debug: boolean): Promise<T>;
}
//# sourceMappingURL=interfaces.d.ts.map