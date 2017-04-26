'use strict';

/**
 * @author palmtale
 * @since 2017/4/26.
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug3.default)('swagger');
var debugContent = (0, _debug3.default)('swagger:content');

var Middleware = function Middleware(runner) {
    var _this = this;

    _classCallCheck(this, Middleware);

    this.runner = null;

    this.translate = function (output, mimeType) {

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

    this.event = function (ctx, body, eventEmitter) {
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

    this.hookResponseForValidation = function (context, eventEmitter) {
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

    this.middleware = function () {
        throw new Error('Do not use the abstract middleware directly.');
    };

    this.register = function (app) {
        app.use(_this.middleware);
    };

    this.runner = runner;
};

exports.default = Middleware;