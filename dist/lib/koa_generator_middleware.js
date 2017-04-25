'use strict';

/**
 * @author palmtale
 * @since 2017/4/24.
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
            try {
                var headers = res._headers || res.headers || {};
                var body = data || written;
                debugContent('response body type: %s value: %s', typeof body === 'undefined' ? 'undefined' : _typeof(body), body);
                var validateResult = context.request.swagger.operation.validateResponse({
                    statusCode: res.statusCode,
                    headers: headers,
                    body: body
                });
                debug('validation result:', validateResult);
                if (validateResult.errors.length || validateResult.warnings.length) {
                    debug('emitting responseValidationError');
                    eventEmitter.emit('responseValidationError', validateResult, context.request, res);
                }
            } catch (err) {
                /* istanbul ignore next
                 console.error(err.stack);
                 */
            }
        }
        end.apply(res, [data, encoding]);
    };
};

var _class = function _class(runner) {
    var _this = this;

    _classCallCheck(this, _class);

    this.runner = null;

    this.middleware = function () {
        var _runner = _this.runner;
        return regeneratorRuntime.mark(function _callee3(next) {
            var _this2 = this;

            var req, res, operation, path, msg, err, allowedMethods;
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            req = this.req;
                            res = this.res;
                            operation = _runner.getOperation(req);

                            if (operation) {
                                _context3.next = 19;
                                break;
                            }

                            path = _runner.getPath(req);

                            if (path) {
                                _context3.next = 9;
                                break;
                            }

                            _context3.next = 8;
                            return next();

                        case 8:
                            return _context3.abrupt('return', _context3.sent);

                        case 9:
                            if (!(!path['x-swagger-pipe'] && req.method !== 'OPTIONS')) {
                                _context3.next = 19;
                                break;
                            }

                            msg = _util2.default.format('Path [%s] defined in Swagger, but %s operation is not.', path.path, req.method);
                            err = new Error(msg);

                            err.statusCode = 405;

                            allowedMethods = _lodash2.default.map(path.operationObjects, function (operation) {
                                return operation.method.toUpperCase();
                            });

                            err.allowedMethods = allowedMethods;

                            res.setHeader('Allow', allowedMethods.sort().join(', '));
                            _context3.next = 18;
                            return next(err);

                        case 18:
                            return _context3.abrupt('return', _context3.sent);

                        case 19:

                            _runner.applyMetadata(req, operation, function () {
                                var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(err) {
                                    var pipe, _err, context, listenerCount;

                                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                                        while (1) {
                                            switch (_context2.prev = _context2.next) {
                                                case 0:
                                                    if (!err) {
                                                        _context2.next = 4;
                                                        break;
                                                    }

                                                    _context2.next = 3;
                                                    return next(err);

                                                case 3:
                                                    return _context2.abrupt('return', _context2.sent);

                                                case 4:
                                                    pipe = _runner.getPipe(req);

                                                    if (pipe) {
                                                        _context2.next = 11;
                                                        break;
                                                    }

                                                    _err = new Error('No implementation found for this path.');

                                                    _err.statusCode = 405;
                                                    _context2.next = 10;
                                                    return next(_err);

                                                case 10:
                                                    return _context2.abrupt('return', _context2.sent);

                                                case 11:
                                                    context = {
                                                        // system values
                                                        _errorHandler: _runner.defaultErrorHandler(),
                                                        request: req,
                                                        response: res,

                                                        // user-modifiable values
                                                        input: undefined,
                                                        statusCode: undefined,
                                                        headers: {},
                                                        output: undefined
                                                    };


                                                    context._finish = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                                                        var response, body;
                                                        return regeneratorRuntime.wrap(function _callee$(_context) {
                                                            while (1) {
                                                                switch (_context.prev = _context.next) {
                                                                    case 0:
                                                                        // must have arity of 2
                                                                        debugContent('exec', context.error);

                                                                        if (!context.error) {
                                                                            _context.next = 5;
                                                                            break;
                                                                        }

                                                                        _context.next = 4;
                                                                        return next(context.error);

                                                                    case 4:
                                                                        return _context.abrupt('return', _context.sent);

                                                                    case 5:
                                                                        _context.prev = 5;
                                                                        response = context.response;


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
                                                                            body = translate(context.output, response.getHeader('content-type'));


                                                                            debugContent('sending response body: %s', body);
                                                                            response.end(body);
                                                                        }

                                                                        _context.next = 12;
                                                                        return next();

                                                                    case 12:
                                                                        _context.next = 18;
                                                                        break;

                                                                    case 14:
                                                                        _context.prev = 14;
                                                                        _context.t0 = _context['catch'](5);
                                                                        _context.next = 18;
                                                                        return next(_context.t0);

                                                                    case 18:
                                                                    case 'end':
                                                                        return _context.stop();
                                                                }
                                                            }
                                                        }, _callee, _this2, [[5, 14]]);
                                                    }));

                                                    /* istanbul ignore next */
                                                    listenerCount = _runner.listenerCount ? _runner.listenerCount('responseValidationError') : // Node >= 4.0
                                                    _events.EventEmitter.listenerCount(_runner, 'responseValidationError'); // Node < 4.0

                                                    if (listenerCount) {
                                                        hookResponseForValidation(context, _runner);
                                                    }

                                                    _runner.bagpipes.play(pipe, context);

                                                case 16:
                                                case 'end':
                                                    return _context2.stop();
                                            }
                                        }
                                    }, _callee2, _this2);
                                }));

                                return function (_x) {
                                    return _ref.apply(this, arguments);
                                };
                            }());

                        case 20:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, this);
        });
    };

    this.register = function (koa) {
        koa.use(_this.middleware());
    };

    this.runner = runner;
};

exports.default = _class;