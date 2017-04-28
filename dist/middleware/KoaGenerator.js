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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _class = function (_Abstract) {
    _inherits(_class, _Abstract);

    function _class(runner) {
        _classCallCheck(this, _class);

        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, runner));

        _this.middleware = regeneratorRuntime.mark(function _callee(next) {
            var _this2 = this;

            var req, res, operation;
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            req = this.request;
                            res = this.response;
                            _context.prev = 2;
                            operation = this.checkOperation(req, res);

                            if (operation) {
                                _context.next = 8;
                                break;
                            }

                            _context.next = 7;
                            return next();

                        case 7:
                            return _context.abrupt('return', _context.sent);

                        case 8:
                            this.runner.applyMetadata(req, operation, function () {
                                _this2.afterOperation(req, res, next);
                            });
                            _context.next = 16;
                            break;

                        case 11:
                            _context.prev = 11;
                            _context.t0 = _context['catch'](2);
                            _context.next = 15;
                            return next(_context.t0);

                        case 15:
                            return _context.abrupt('return', _context.sent);

                        case 16:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this, [[2, 11]]);
        });
        return _this;
    }

    return _class;
}(_Abstract3.default);

exports.default = _class;