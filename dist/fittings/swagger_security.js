'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _helpers = require('../middleware/helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('swagger:swagger_security');
var getScopeOrAPIKey = function getScopeOrAPIKey(req, securityDefinition, name, securityRequirement) {

    var scopeOrKey = null;

    if (securityDefinition.type === 'oauth2') {
        scopeOrKey = securityRequirement[name];
    } else if (securityDefinition.type === 'apiKey') {
        if (securityDefinition.in === 'query') {
            scopeOrKey = _helpers2.default.queryString(req)[securityDefinition.name];
        } else if (securityDefinition.in === 'header') {
            scopeOrKey = req.headers[securityDefinition.name.toLowerCase()];
        }
    }

    return scopeOrKey;
};

var sendSecurityError = function sendSecurityError(err, res, next) {

    if (!err.code) {
        err.code = 'server_error';
    }
    if (!err.statusCode) {
        err.statusCode = 403;
    }

    if (err.headers) {
        _lodash2.default.each(err.headers, function (header, name) {
            res.setHeader(name, header);
        });
    }

    res.statusCode = err.statusCode;

    next(err);
};

var create = function create(fittingDef, bagpipes) {
    debug('config: %j', fittingDef);
    var runner = bagpipes.config.swaggerNodeRunner;
    if (fittingDef.securityHandlersModule && !runner.config.securityHandlers) {
        var appRoot = runner.config.swagger.appRoot;
        var handlersPath = _path2.default.resolve(appRoot, fittingDef.securityHandlersModule);
        runner.securityHandlers = require(handlersPath);
        debug('loaded handlers: %s from: %s', Object.keys(runner.securityHandlers), handlersPath);
    }
    // function swagger_security
    return function (context, cb) {
        debug('exec');
        var handlers = runner.securityHandlers || {};
        var req = context.request;
        var operation = req.swagger.operation;
        if (!operation) {
            return cb();
        }
        var security = operation.getSecurity();
        if (!security || security.length === 0) {
            return cb();
        }
        _async2.default.map(security, // logical OR - any one can allow function orCheck
        function (securityRequirement, cb) {
            var secName = void 0;
            _async2.default.map(Object.keys(securityRequirement), // logical AND - all must allow function andCheck
            function (name, cb) {
                var secDef = operation.securityDefinitions[name];
                var handler = handlers[name];
                secName = name;
                if (!handler) {
                    return cb(new Error('Unknown security handler: ' + name));
                }

                if (handler.length === 4) {
                    // swagger-tools style handler
                    return handler(req, secDef, getScopeOrAPIKey(req, secDef, name, securityRequirement), cb);
                } else {
                    // connect-style handler
                    return handler(req, context.response, cb);
                }
            }, //function andCheckDone
            function (err) {
                debug('Security check (%s): %s', secName, _lodash2.default.isNull(err) ? 'allowed' : 'denied');
                // swap normal err and result to short-circuit the logical OR
                if (err) {
                    return cb(undefined, err);
                }
                return cb(new Error('OK'));
            });
        }, //function orCheckDone
        function (ok, errors) {
            // note swapped results
            var allowed = !_lodash2.default.isNull(ok) && ok.message === 'OK';
            debug('Request allowed: %s', allowed);

            allowed ? cb() : sendSecurityError(errors[0], context.response, cb);
        });
    };
};

module.exports = create;