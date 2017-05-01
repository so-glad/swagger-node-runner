
'use strict';

/**
 * @author palmtale
 * @since 2017/4/24.
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Abstract2 = require('./Abstract');

var _Abstract3 = _interopRequireDefault(_Abstract2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Abstract) {
    _inherits(_class, _Abstract);

    function _class(runner) {
        var _this2 = this;

        _classCallCheck(this, _class);

        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, runner));

        _this.middleware = function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ctx, next) {
                var req, res, pipe, context;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                req = ctx.request;
                                res = ctx.res;
                                _context.prev = 2;
                                pipe = _this.pipe(req, res);

                                if (pipe) {
                                    _context.next = 7;
                                    break;
                                }

                                _context.next = 7;
                                return next();

                            case 7:
                                context = _this.pipeContext(req, res, next);

                                _this.runner.bagpipes.play(pipe, context);

                                if (!context.promise) {
                                    _context.next = 12;
                                    break;
                                }

                                _context.next = 12;
                                return context.promise;

                            case 12:
                                _context.next = 18;
                                break;

                            case 14:
                                _context.prev = 14;
                                _context.t0 = _context['catch'](2);
                                _context.next = 18;
                                return next(_context.t0);

                            case 18:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, _this2, [[2, 14]]);
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