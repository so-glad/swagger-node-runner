'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Abstract2 = require('./Abstract');

var _Abstract3 = _interopRequireDefault(_Abstract2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// var debug = require('debug')('swagger:sails_middleware');

var _class = function (_Abstract) {
    _inherits(_class, _Abstract);

    function _class(runner) {
        _classCallCheck(this, _class);

        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, runner));

        _this.middleware = function (req, res, next) {
            // flow back to connect pipe
            try {
                var pipe = _this.pipe(req, res);
                if (!pipe) {
                    next();
                }
                var context = _this.pipeContext(req, res, next);
                _this.runner.bagpipes.play(pipe, context);
            } catch (e) {
                return next(e);
            }
        };

        return _this;
    }

    return _class;
}(_Abstract3.default);

exports.default = _class;