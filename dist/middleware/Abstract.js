'use strict';

/**
 * @author palmtale
 * @since 2017/4/26.
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug3.default)('swagger');
var debugContent = (0, _debug3.default)('swagger:content');

var translate = function translate(output, mimeType) {

    if ((typeof output === 'undefined' ? 'undefined' : _typeof(output)) !== 'object') {
        return output;
    }

    switch (true) {
        case /json/.test(mimeType):
            return JSON.stringify(output);
        default:
            return _util2.default.inspect(output);
    }
};

var event = function event(ctx, body, eventEmitter) {
    try {
        var headers = ctx.res._headers || ctx.res.headers || {};
        debugContent('response body type: %s value: %s', typeof body === 'undefined' ? 'undefined' : _typeof(body), body);
        var validateResult = ctx.request.swagger.operation.validateResponse({
            statusCode: ctx.res.statusCode,
            headers: headers,
            body: body
        });
        debug('validation result:', validateResult);
        if (validateResult.errors.length || validateResult.warnings.length) {
            debug('emitting responseValidationError');
            eventEmitter.emit('responseValidationError', validateResult, ctx.request, ctx.res);
        }
    } catch (err) {
        /* istanbul ignore next*/
        console.error(err.stack);
    }
};

var hookResponseForValidation = function hookResponseForValidation(context, eventEmitter) {
    debug('add response validation hook');
    var res = context.response;
    var end = res.end;
    var write = res.write;
    var written = null;

    res.write = function (chunk, encoding) {
        if (written) {
            written = '';
            res.write = write;
            res.end = end;
            debug('multiple writes, will not validate response');
        } else {
            written = chunk;
        }
        write.apply(res, [chunk, encoding]);
    };

    res.end = function (data, encoding) {
        res.write = write;
        res.end = end;
        if (written && data) {
            debug('multiple writes, will not validate response');
        } else if (!context.request.swagger.operation) {
            debug('not a swagger operation, will not validate response');
        } else {
            debug('validating response');
            event(context, data || written, eventEmitter);
        }
        end.apply(res, [data, encoding]);
    };
};

var defineContextFinish = function defineContextFinish(context, next) {
    return function () {
        debugContent('exec', context.error);
        if (context.error) {
            return next(context.error);
        }

        try {
            var response = context.response;

            if (context.statusCode) {
                debug('setting response statusCode: %d', context.statusCode);
                response.statusCode = context.statusCode;
            }

            if (context.headers) {
                debugContent('setting response headers: %j', context.headers);
                _lodash2.default.each(context.headers, function (value, name) {
                    response.setHeader(name, value);
                });
            }

            if (context.output) {
                var body = translate(context.output, response.getHeader('content-type'));

                debugContent('sending response body: %s', body);
                response.end(body);
            }
            next();
        } catch (err) {
            /* istanbul ignore next */
            next(err);
        }
    };
};

var Middleware = function Middleware(runner) {
    var _this = this;

    _classCallCheck(this, Middleware);

    this.runner = null;

    this.middleware = function () {
        throw new Error('Do not use the abstract middleware directly.');
    };

    this.register = function (app) {
        app.use(_this.middleware);
    };

    this.checkOperation = function (req, res) {
        var operation = _this.runner.getOperation(req);
        if (!operation) {
            var path = _this.runner.getPath(req);
            if (!path) {
                return false;
            }
            if (!path['x-swagger-pipe'] && req.method !== 'OPTIONS') {
                var msg = _util2.default.format('Path [%s] defined in Swagger, but %s operation is not.', path.path, req.method);
                var err = new Error(msg);
                err.statusCode = 405;
                err.status = err.statusCode; // for Sails, see: https://github.com/theganyo/swagger-node-runner/pull/31
                var allowedMethods = _lodash2.default.map(path.operationObjects, function (operation) {
                    return operation.method.toUpperCase();
                });
                err.allowedMethods = allowedMethods;
                res.setHeader('Allow', allowedMethods.sort().join(', '));
                throw err;
            }
        }
        return operation;
    };

    this.afterOperation = function (req, res, next) {
        var pipe = _this.runner.getPipe(req);
        if (!pipe) {
            var err = new Error('No implementation found for this path.');
            err.statusCode = 405;
            throw err;
        }
        var context = {
            // system values
            _errorHandler: _this.runner.defaultErrorHandler(),
            request: req,
            response: res,
            // user-modifiable values
            input: undefined,
            statusCode: undefined,
            headers: {},
            output: undefined
        };
        context._finish = defineContextFinish(context, next);
        /* istanbul ignore next */
        var listenerCount = _this.runner.listenerCount ? _this.runner.listenerCount('responseValidationError') : // Node >= 4.0
        _events.EventEmitter.listenerCount(_this.runner, 'responseValidationError'); // Node < 4.0
        if (listenerCount) {
            hookResponseForValidation(context, _this.runner);
        }

        _this.runner.bagpipes.play(pipe, context);
    };

    this.runner = runner;
};

exports.default = Middleware;