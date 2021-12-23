/// <reference types="w3c-web-serial" />
export interface CustomSerialOptions extends SerialOptions {
    baudRate: 1000000 | 115200 | 921600 | 57600 | 38400 | 19200 | 9600 | 4800 | 2400 | 1200 | 300;
    dataBits: 8 | 7 | 6 | 5 | undefined;
    stopBits: 1 | 2 | undefined;
}
//# sourceMappingURL=serialport.d.ts.map