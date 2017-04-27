'use strict';

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

var _Abstract = require('./Abstract');

var _Abstract2 = _interopRequireDefault(_Abstract);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug3.default)('swagger');
var debugContent = (0, _debug3.default)('swagger:content');

var Connect = function (_Middleware) {
    _inherits(Connect, _Middleware);

    function Connect() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, Connect);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Connect.__proto__ || Object.getPrototypeOf(Connect)).call.apply(_ref, [this].concat(args))), _this), _this.middleware = function (req, res, next) {
            // flow back to connect pipe

            var operation = _this.runner.getOperation(req);
            if (!operation) {
                var path = _this.runner.getPath(req);
                if (!path) {
                    return next();
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
                    return next(err);
                }
            }

            _this.runner.applyMetadata(req, operation, function (err) {
                if (err) {
                    /* istanbul ignore next */
                    return next(err);
                }

                var pipe = _this.runner.getPipe(req);
                if (!pipe) {
                    var _err = new Error('No implementation found for this path.');
                    _err.statusCode = 405;
                    return next(_err);
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
                console.error(context);
                //function finishConnect
                context._finish = function () {
                    // must have arity of 2
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
                            var body = _this.translate(context.output, response.getHeader('content-type'));

                            debugContent('sending response body: %s', body);
                            response.end(body);
                        }

                        next();
                    } catch (err) {
                        /* istanbul ignore next */
                        next(err);
                    }
                };

                /* istanbul ignore next */
                var listenerCount = _this.runner.listenerCount ? _this.runner.listenerCount('responseValidationError') : // Node >= 4.0
                _events.EventEmitter.listenerCount(_this.runner, 'responseValidationError'); // Node < 4.0
                if (listenerCount) {
                    _this.hookResponseForValidation(context, _this.runner);
                }

                _this.runner.bagpipes.play(pipe, context);
            });
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    return Connect;
}(_Abstract2.default);

exports.default = Connect;