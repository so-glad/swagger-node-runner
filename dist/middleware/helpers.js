'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _qs = require('qs');

var _qs2 = _interopRequireDefault(_qs);

var _parseurl = require('parseurl');

var _parseurl2 = _interopRequireDefault(_parseurl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// side-effect: stores in query property on req
var queryString = function queryString(req) {
    if (!req.query) {
        var url = (0, _parseurl2.default)(req);
        req.query = url.query ? _qs2.default.parse(url.query) : {};
    }
    return req.query;
};

exports.default = queryString;