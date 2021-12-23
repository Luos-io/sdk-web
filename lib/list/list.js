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
import { logger, open, write, read } from '../utils/index';
import { moduleTypeEnum } from '../interfaces/module';
var checkPortCompatibility = function (port, moduleType, debug) {
    if (debug === void 0) { debug = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var isPortOpen, hasWriteSucceed, message, json_1, response, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, open(port, debug)];
                case 1:
                    isPortOpen = _a.sent();
                    if (!isPortOpen) return [3 /*break*/, 4];
                    return [4 /*yield*/, write(port, '{"discover": {}}\r', debug)];
                case 2:
                    hasWriteSucceed = _a.sent();
                    if (!hasWriteSucceed) return [3 /*break*/, 4];
                    return [4 /*yield*/, read(port, debug)];
                case 3:
                    message = _a.sent();
                    json_1 = JSON.parse(message);
                    response = moduleTypeEnum.find(function (moduleType) { return json_1[moduleType.toLowerCase()] !== undefined; });
                    if (response && response === moduleType) {
                        return [2 /*return*/, true];
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    logger.warn('Can not init communication with the serial port.', err_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, false];
            }
        });
    });
};
export var list = function (moduleType, debug) { return __awaiter(void 0, void 0, void 0, function () {
    var luosPorts, allowedPorts, port, isLuosCompatible, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                luosPorts = [];
                return [4 /*yield*/, navigator.serial.getPorts()];
            case 1:
                allowedPorts = _a.sent();
                if (!(allowedPorts.length > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, Promise.all(allowedPorts.map(function (port) { return __awaiter(void 0, void 0, void 0, function () {
                        var isLuosCompatible;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, checkPortCompatibility(port, moduleType, debug)];
                                case 1:
                                    isLuosCompatible = _a.sent();
                                    if (isLuosCompatible) {
                                        luosPorts.push(port);
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 2:
                _a.sent();
                return [3 /*break*/, 7];
            case 3:
                _a.trys.push([3, 6, , 7]);
                return [4 /*yield*/, navigator.serial.requestPort()];
            case 4:
                port = _a.sent();
                return [4 /*yield*/, checkPortCompatibility(port, moduleType, debug)];
            case 5:
                isLuosCompatible = _a.sent();
                if (isLuosCompatible) {
                    luosPorts.push(port);
                }
                return [3 /*break*/, 7];
            case 6:
                err_2 = _a.sent();
                logger.warn('Can not get the user serial port.', err_2.message);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/, luosPorts];
        }
    });
}); };
export default list;
