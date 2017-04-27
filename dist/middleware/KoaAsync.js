'use strict';

/**
 * @author palmtale
 * @since 2017/4/24.
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _events = require('events');

var _Abstract2 = require('./Abstract');

var _Abstract3 = _interopRequireDefault(_Abstract2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug3.default)('swagger');
var debugContent = (0, _debug3.default)('swagger:content');

var _class = function (_Abstract) {
    _inherits(_class, _Abstract);

    function _class(runner) {
        var _this2 = this;

        _classCallCheck(this, _class);

        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, runner));

        _this.middleware = function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(ctx, next) {
                var req, res, operation, path, msg, err, allowedMethods;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                req = ctx.request;
                                res = ctx.res;
                                operation = _this.runner.getOperation(req);

                                if (operation) {
                                    _context3.next = 19;
                                    break;
                                }

                                path = _this.runner.getPath(req);

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

                                _this.runner.applyMetadata(req, operation, function () {
                                    var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(err) {
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
                                                        pipe = _this.runner.getPipe(req);

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
                                                            _errorHandler: _this.runner.defaultErrorHandler(),
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
                                                                                body = _this.translate(context.output, response.getHeader('content-type'));


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
                                                        listenerCount = _this.runner.listenerCount ? _this.runner.listenerCount('responseValidationError') : // Node >= 4.0
                                                        _events.EventEmitter.listenerCount(_this.runner, 'responseValidationError'); // Node < 4.0

                                                        if (listenerCount) {
                                                            _this.hookResponseForValidation(context, _this.runner);
                                                        }

                                                        _this.runner.bagpipes.play(pipe, context);

                                                    case 16:
                                                    case 'end':
                                                        return _context2.stop();
                                                }
                                            }
                                        }, _callee2, _this2);
                                    }));

                                    return function (_x3) {
                                        return _ref2.apply(this, arguments);
                                    };
                                }());

                            case 20:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, _this2);
            }));

            return function (_x, _x2) {
                return _ref.apply(this, arguments);
            };
        }();

        return _this;
    }

    return _class;
}(_Abstract3.default);

exports.default = _class;