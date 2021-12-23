export var isPortInfoArray = function (object) {
    return Array.isArray(object) && object.every(function (o) { return 'path' in o; });
};
