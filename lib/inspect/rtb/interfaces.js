export var RTBMode;
(function (RTBMode) {
    RTBMode[RTBMode["CLEAR"] = 0] = "CLEAR";
    RTBMode[RTBMode["SERVICE"] = 1] = "SERVICE";
    RTBMode[RTBMode["NODE"] = 2] = "NODE";
})(RTBMode || (RTBMode = {}));
export var RTBServiceAccess;
(function (RTBServiceAccess) {
    RTBServiceAccess[RTBServiceAccess["READ_WRITE_ACCESS"] = 0] = "READ_WRITE_ACCESS";
    RTBServiceAccess[RTBServiceAccess["READ_ONLY_ACCESS"] = 1] = "READ_ONLY_ACCESS";
    RTBServiceAccess[RTBServiceAccess["WRITE_ONLY_ACCESS"] = 2] = "WRITE_ONLY_ACCESS";
    RTBServiceAccess[RTBServiceAccess["NO_ACCESS"] = 3] = "NO_ACCESS";
})(RTBServiceAccess || (RTBServiceAccess = {}));
