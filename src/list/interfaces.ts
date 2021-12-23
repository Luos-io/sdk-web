import { ModuleType } from 'interfaces/module';

export interface ISerialActionHandler<T> {
  (port: SerialPort, debug: boolean): Promise<T>;
}

export interface ISerialActionWriteHandler
  extends ISerialActionHandler<boolean> {}

export const isPortInfoArray = (object: any) =>
  Array.isArray(object) && object.every((o) => 'path' in o);
export interface IList<T> {
  (moduleType: ModuleType, debug: boolean): Promise<T>;
}
