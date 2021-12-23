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
import { logger } from './logger.js';
export var defaultSerialOptions = {
    baudRate: 1000000,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
};
export var cancellablePromiseWithTimeout = function (promise, time) {
    var timer;
    return Promise.race([
        promise,
        new Promise(function (_res, rej) {
            return (timer = setTimeout(function () {
                var err = new Error('Timeout');
                promise.cancel(err);
                rej(err);
            }, time));
        }),
    ]).finally(function () { return clearTimeout(timer); });
};
export var open = function (port, debug) {
    if (debug === void 0) { debug = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var err_1, _a, usbProductId, usbVendorId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, port.open(defaultSerialOptions)];
                case 1:
                    _b.sent();
                    return [2 /*return*/, true];
                case 2:
                    err_1 = _b.sent();
                    if (err_1.code === DOMException.INVALID_STATE_ERR &&
                        debug) {
                        _a = port.getInfo(), usbProductId = _a.usbProductId, usbVendorId = _a.usbVendorId;
                        logger.debug("Port (" + usbProductId + " / " + usbVendorId + ") already open");
                    }
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
};
export var close = function (port, _debug) {
    if (_debug === void 0) { _debug = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, port.close()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    err_2 = _a.sent();
                    // TO DO - Read spec to handle correctly errors on close.
                    // if (
                    //   (err as DOMException).code === DOMException.INVALID_STATE_ERR &&
                    //   debug
                    // ) {
                    //   const { usbProductId, usbVendorId } = port.getInfo();
                    //   logger.debug(`Port (${usbProductId} / ${usbVendorId}) already open`);
                    // }
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
};
export var write = function (port, data, debug) {
    if (debug === void 0) { debug = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var _a, usbProductId, usbVendorId, writer, encoder, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!port.writable) return [3 /*break*/, 7];
                    _a = port.getInfo(), usbProductId = _a.usbProductId, usbVendorId = _a.usbVendorId;
                    writer = port.writable.getWriter();
                    if (typeof data === 'string') {
                        encoder = new TextEncoderStream();
                        writer = encoder.writable.getWriter();
                        encoder.readable.pipeTo(port.writable);
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, writer.ready];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, writer.write(data)];
                case 3:
                    _b.sent();
                    if (debug) {
                        logger.debug("Sending message to '" + usbProductId + " - " + usbVendorId + "' ...");
                        console.debug(data);
                    }
                    return [4 /*yield*/, writer.ready];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, writer.close()];
                case 5:
                    _b.sent();
                    return [2 /*return*/, true];
                case 6:
                    err_3 = _b.sent();
                    logger.error("Error while writing on serial port : '" + usbProductId + " - " + usbVendorId + "'", err_3.message);
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/, false];
            }
        });
    });
};
export var read = function (port, debug) {
    if (debug === void 0) { debug = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var decoder, reader, message, _a, value, done, err_4, _b, message, stack;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!port.readable) return [3 /*break*/, 7];
                    decoder = new TextDecoderStream();
                    reader = decoder.readable.getReader();
                    port.readable.pipeTo(decoder.writable);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, 6, 7]);
                    message = '';
                    _c.label = 2;
                case 2:
                    if (!port.readable) return [3 /*break*/, 4];
                    return [4 /*yield*/, reader.read()];
                case 3:
                    _a = _c.sent(), value = _a.value, done = _a.done;
                    if (done) {
                        return [3 /*break*/, 4];
                    }
                    message += value;
                    if (debug && value) {
                        logger.debug('Chunk decoded', value);
                    }
                    reader.releaseLock();
                    return [2 /*return*/, message];
                case 4:
                    if (debug) {
                        logger.log('Message received', message);
                    }
                    return [3 /*break*/, 7];
                case 5:
                    err_4 = _c.sent();
                    _b = err_4, message = _b.message, stack = _b.stack;
                    logger.error('Error while reading data from :', message, stack ? stack : '');
                    return [3 /*break*/, 7];
                case 6:
                    reader.releaseLock();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/, undefined];
            }
        });
    });
};
