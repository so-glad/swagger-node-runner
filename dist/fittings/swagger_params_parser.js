'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _typeIs = require('type-is');

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _helpers = require('../lib/helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('swagger:swagger_params_parser');
var debugContent = (0, _debug3.default)('swagger:content');

var parseRequest = function parseRequest(req, fittingDef, cb) {

    if (req.query && req.body && req.files) {
        return cb();
    }

    var shouldParseBody = false;
    var shouldParseForm = false;
    var shouldParseQuery = false;
    var multFields = [];

    req.swagger.operation.parameterObjects.forEach(function (parameter) {
        switch (parameter.in) {
            case 'body':
                shouldParseBody = true;
                break;
            case 'formData':
                shouldParseForm = true;
                if (parameter.type === 'file') {
                    multFields.push({ name: parameter.name });
                }
                break;

            case 'query':
                shouldParseQuery = true;
                break;
        }
    });

    if (!req.query && shouldParseQuery) {
        _helpers2.default.queryString(req);
    }

    if (req.body || !shouldParseBody && !shouldParseForm) {
        return cb();
    }

    var res = null;
    debugContent('parsing req.body for content-type: %s', req.headers['content-type']);
    _async2.default.series([function (cb) {
        if (multFields.length === 0) {
            return cb();
        }
        var mult = (0, _multer2.default)(fittingDef.multerOptions);
        mult.fields(multFields)(req, res, function (err) {
            if (err) {
                /* istanbul ignore next */
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    err.statusCode = 400;
                }
                return cb(err);
            }
            if (req.files) {
                _lodash2.default.forEach(req.files, function (file, name) {
                    req.files[name] = Array.isArray(file) && file.length === 1 ? file[0] : file;
                });
            }
            debugContent('multer parsed req.body:', req.body);
            cb();
        });
    }, function (cb) {
        if (req.body || !shouldParseForm) {
            return cb();
        }
        if (skipParse(fittingDef.urlencodedOptions, req)) {
            return cb();
        } // hack: see skipParse function
        var urlEncodedBodyParser = _bodyParser2.default.urlencoded(fittingDef.urlencodedOptions);
        urlEncodedBodyParser(req, res, cb);
    }, function (cb) {
        if (req.body) {
            debugContent('urlencoded parsed req.body:', req.body);
            return cb();
        }
        if (skipParse(fittingDef.jsonOptions, req)) {
            return cb();
        } // hack: see skipParse function
        _bodyParser2.default.json(fittingDef.jsonOptions)(req, res, cb);
    }, function (cb) {
        if (req.body) {
            debugContent('json parsed req.body:', req.body);
            return cb();
        }
        if (skipParse(fittingDef.textOptions, req)) {
            return cb();
        } // hack: see skipParse function
        _bodyParser2.default.text(fittingDef.textOptions)(req, res, function (err) {
            if (req.body) {
                debugContent('text parsed req.body:', req.body);
            }
            cb(err);
        });
    }], function (err) {
        return cb(err);
    });
};

// hack: avoids body-parser issue: https://github.com/expressjs/body-parser/issues/128

var skipParse = function skipParse(options, req) {
    return typeof options.type !== 'function' && !Boolean((0, _typeIs.is)(req, options.type));
};

var create = function create(fittingDef, bagpipes) {
    debug('config: %j', fittingDef);

    _lodash2.default.defaults(fittingDef, {
        jsonOptions: {
            type: ['json', 'application/*+json']
        },
        urlencodedOptions: {
            extended: false
        },
        multerOptions: {
            inMemory: true
        },
        textOptions: {
            type: '*/*'
        }
    });

    return function (context, next) {
        debug('exec');
        var req = context.request;
        parseRequest(req, fittingDef, function (err) {
            if (err) {
                /* istanbul ignore next */return next(err);
            }
            var params = req.swagger.params = {};
            req.swagger.operation.parameterObjects.forEach(function (parameter) {
                params[parameter.name] = parameter.getValue(req); // note: we do not check for errors here
            });
            next(null, params);
        });
    };
};

module.exports = create;