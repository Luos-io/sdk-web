var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { logger, open, close, write } from '../../utils/index.js';
import { RTBMode, } from '../rtb/interfaces.js';
/**
 * @description Parse the RTB response and detect the first mode
 * @param rtb : RTB response
 * @returns RTBMode
 */
var parseMode = function (rtb) { return rtb.readUInt8(0); };
/**
 * @description Parse a node from the RTB response
 * @param rtb : Slice of the RTB response containing the node details
 * @returns RTBNode
 */
var parseNode = function (rtb) {
    var ID = rtb.readUInt16LE(0) & 0xfff;
    var certificate = rtb.readUInt16LE(0) >> 12 === 1;
    var portTableBuffer = rtb.slice(2, 18 + 3); // TEMP 3 unknown bytes
    // TO TEST with multiple ports cards
    var portTable = portTableBuffer.reduce(function (acc, v, i) {
        if (v !== 0) {
            if (i % 2 === 0) {
                acc.push(v);
            }
            else {
                acc[acc.length - 1] = acc[acc.length - 1] | (v << 8);
            }
        }
        return acc;
    }, []);
    return {
        ID: ID,
        certificate: certificate,
        portTable: portTable,
        services: [],
    };
};
/**
 * @description Parse a service from the RTB response
 * @param rtb : Slice of the RTB response containing the service details
 * @returns RTBService
 */
var parseService = function (rtb) {
    var ID = rtb.readUInt16LE(0);
    var type = rtb.readUInt16LE(2);
    var access = rtb.readUInt8(4);
    var alias = rtb
        .slice(5, 22)
        .filter(function (v) { return v !== 0x00 && v !== 0xff; })
        .toString();
    return {
        ID: ID,
        type: type,
        access: access,
        alias: alias,
    };
};
export var rtb = function (_a) {
    var debug = _a.debug;
    return __awaiter(void 0, void 0, void 0, function () {
        var ports, _b, _c, test;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, navigator.serial.getPorts()];
                case 1:
                    ports = _d.sent();
                    if (!(ports.length === 0)) return [3 /*break*/, 3];
                    _c = (_b = ports).push;
                    return [4 /*yield*/, navigator.serial.requestPort()];
                case 2:
                    _c.apply(_b, [_d.sent()]);
                    _d.label = 3;
                case 3:
                    test = ports.map(function (port) { return __awaiter(void 0, void 0, void 0, function () {
                        var isPortOpen, hasWriteSucceed, reader, remainingBytes, rtb_1, result, _a, value, done, buffer, gotHeader, protocol, target, mode, source, command, size, payload, index, nodes, mode, err_1, _b, message, stack, err_2;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 11, 12, 14]);
                                    return [4 /*yield*/, open(port, debug)];
                                case 1:
                                    isPortOpen = _c.sent();
                                    if (!isPortOpen) return [3 /*break*/, 10];
                                    return [4 /*yield*/, write(port, Buffer.from([0xf0, 0xff, 0x03, 0x00, 0x3d, 0x00, 0x00, 0x7e]), debug)];
                                case 2:
                                    hasWriteSucceed = _c.sent();
                                    if (!(hasWriteSucceed && port.readable)) return [3 /*break*/, 10];
                                    reader = port.readable.getReader();
                                    _c.label = 3;
                                case 3:
                                    _c.trys.push([3, 8, 9, 10]);
                                    remainingBytes = 0;
                                    rtb_1 = Buffer.from([]);
                                    result = {
                                        protocol: 0,
                                        target: 0,
                                        mode: 0,
                                        source: 0,
                                        command: 0,
                                        size: 0,
                                        nodes: [],
                                    };
                                    _c.label = 4;
                                case 4: return [4 /*yield*/, reader.read()];
                                case 5:
                                    _a = _c.sent(), value = _a.value, done = _a.done;
                                    if (done || !value) {
                                        return [3 /*break*/, 7];
                                    }
                                    buffer = Buffer.from(value);
                                    gotHeader = buffer.indexOf(Buffer.from([0x7e, 0x7e, 0x7e, 0x7e]), 0);
                                    if (gotHeader !== -1) {
                                        protocol = buffer.readUInt8(4) & 15;
                                        target = (buffer.readUInt8(4) >> 4) | (buffer.readUInt8(5) << 4);
                                        mode = buffer.readUInt8(6) & 15;
                                        source = (buffer.readUInt8(6) >> 4) | (buffer.readUInt8(7) << 4);
                                        command = buffer.readUInt8(8);
                                        size = buffer.readUInt16LE(9);
                                        payload = buffer.slice(11);
                                        remainingBytes = size - payload.length;
                                        rtb_1 = Buffer.concat([rtb_1, payload]);
                                        result = __assign(__assign({}, result), { protocol: protocol, target: target, mode: mode, source: source, command: command, size: size });
                                    }
                                    else if (buffer.length > 0 && remainingBytes > 0) {
                                        remainingBytes -= buffer.length;
                                        rtb_1 = Buffer.concat([rtb_1, buffer]);
                                        if (remainingBytes === 0) {
                                            index = 0;
                                            nodes = [];
                                            do {
                                                mode = rtb_1.readUInt8(index);
                                                if (mode === RTBMode.NODE) {
                                                    nodes.push(parseNode(rtb_1.slice(index + 1, index + 22)));
                                                }
                                                else if (mode === RTBMode.SERVICE) {
                                                    nodes[nodes.length - 1].services.push(parseService(rtb_1.slice(index + 1, index + 22)));
                                                }
                                                index += 22;
                                            } while (parseMode(rtb_1.slice(index)) !== RTBMode.CLEAR);
                                            result = __assign(__assign({}, result), { nodes: nodes });
                                            return [3 /*break*/, 7];
                                        }
                                    }
                                    _c.label = 6;
                                case 6:
                                    if (port.readable) return [3 /*break*/, 4];
                                    _c.label = 7;
                                case 7:
                                    if (debug) {
                                        console.group('RTB data:');
                                        console.log('Protocol', result.protocol.toString(10));
                                        console.log('Target', result.target.toString(10));
                                        console.log('Mode', result.mode.toString(10));
                                        console.log('Source', result.source.toString(10));
                                        console.log('Command', result.command.toString(10));
                                        console.log('Size', result.size.toString(10));
                                        console.table(result.nodes.map(function (n) {
                                            var node = __assign(__assign({}, n), { Cert: n.certificate ? '✅' : '❌', 'Port Table': n.portTable, Services: n.services.map(function (s) { return s.alias; }).join(', ') });
                                            return node;
                                        }), ['ID', 'Cert', 'Port Table', 'Services']);
                                        console.groupEnd();
                                    }
                                    return [2 /*return*/, result];
                                case 8:
                                    err_1 = _c.sent();
                                    _b = err_1, message = _b.message, stack = _b.stack;
                                    logger.error('Error while reading data from :', message, stack ? stack : '');
                                    return [3 /*break*/, 10];
                                case 9:
                                    reader.releaseLock();
                                    return [7 /*endfinally*/];
                                case 10: return [2 /*return*/, Promise.reject()];
                                case 11:
                                    err_2 = _c.sent();
                                    logger.warn('Can not init communication with the serial port.', err_2.message);
                                    return [2 /*return*/, Promise.reject()];
                                case 12:
                                    logger.info('Closing the serial port ...');
                                    return [4 /*yield*/, close(port)];
                                case 13:
                                    _c.sent();
                                    return [7 /*endfinally*/];
                                case 14: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/, Promise.all(test)];
            }
        });
    });
};
export default rtb;
