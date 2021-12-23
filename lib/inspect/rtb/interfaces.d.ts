export interface RTBOptions {
    debug: boolean;
}
export declare enum RTBMode {
    CLEAR = 0,
    SERVICE = 1,
    NODE = 2
}
export declare enum RTBServiceAccess {
    READ_WRITE_ACCESS = 0,
    READ_ONLY_ACCESS = 1,
    WRITE_ONLY_ACCESS = 2,
    NO_ACCESS = 3
}
export declare type RTBServiceAlias = string[];
export interface RTBService {
    ID: number;
    type: number;
    access: RTBServiceAccess;
    alias: string;
}
export interface RTBNode {
    ID: number;
    certificate: boolean;
    portTable: number[];
    services: RTBService[];
}
export interface RTBData {
    protocol: number;
    target: number;
    mode: number;
    source: number;
    command: number;
    size: number;
    nodes: RTBNode[];
}
export interface IRTB {
    (options: RTBOptions): Promise<RTBData[]>;
}
export default IRTB;
//# sourceMappingURL=interfaces.d.ts.map