'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Abstract2 = require('./Abstract');

var _Abstract3 = _interopRequireDefault(_Abstract2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ALL_METHODS = ['del', 'get', 'head', 'opts', 'post', 'put', 'patch'];

var _class = function (_Abstract) {
    _inherits(_class, _Abstract);

    function _class(runner) {
        _classCallCheck(this, _class);

        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, runner));

        _this.middleware = function (req, res, callback) {
            try {
                var pipe = _this.pipe(req, res);
                if (!pipe) {
                    return callback();
                }
                var context = _this.pipeContext(req, res, callback);
                _this.runner.bagpipes.play(pipe, context);
            } catch (e) {
                return callback(e);
            }
        };

        return _this;
    }

    _createClass(_class, [{
        key: 'register',
        value: function register(app) {
            var _this2 = this;

            // this bit of oddness forces Restify to route all requests through the middleware
            ALL_METHODS.forEach(function (method) {
                app[method]('.*', function (req, res, next) {
                    req.query = undefined; // oddly, req.query is a function in Restify, kill it
                    _this2.middleware(req, res, function (err) {
                        if (err) {
                            return next(err);
                        }
                        if (!res.finished) {
                            res.statusCode = 404;
                            res.end('Not found');
                        }
                        next();
                    });
                });
            });

            _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), 'register', this).call(this, app);
        }
    }]);

    return _class;
}(_Abstract3.default);

exports.default = _class;