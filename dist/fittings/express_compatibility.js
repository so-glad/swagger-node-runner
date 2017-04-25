'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('swagger:cors');

var expressCompatibility = function expressCompatibility(req, res, next) {
    if (!req.query || !req.path) {
        var url = _url2.default.parse(req.url, !req.query);
        req.path = url.path;
        req.query = url.query;
    }

    if (!res.json) {
        res.json = function (obj) {
            res.statusCode = res.statusCode || 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
        };
    }

    if (!req.get) {
        req.get = function (name) {
            return undefined.headers[name];
        };
    }

    if (!res.set) {
        res.set = res.setHeader;
    }

    if (!res.get) {
        res.get = res.getHeader;
    }

    if (!res.status) {
        res.status = function (status) {
            res.statusCode = status;
        };
    }
    next();
};

var create = function create(fittingDef, bagpipes) {
    debug('config: %j', fittingDef);
    return function (context, cb) {
        debug('exec');
        expressCompatibility(context.request, context.response, cb);
    };
};

exports.default = create;