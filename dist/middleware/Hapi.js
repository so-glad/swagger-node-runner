'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _package = require('../../package');

var _Abstract2 = require('./Abstract');

var _Abstract3 = _interopRequireDefault(_Abstract2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = require('debug')('swagger:hapi_middleware');

var Response = function Response(reply) {
    var _this = this;

    _classCallCheck(this, Response);

    this.reply = null;
    this.headers = {};
    this.statusCode = null;
    this.res = null;

    this.getHeader = function (name) {
        return _this.headers[name.toLowerCase()];
    };

    this.setHeader = function (name, value) {
        _this.headers[name.toLowerCase()] = value;
    };

    this.end = function (string) {
        _this.res = _this.reply(string);
        _this.res.statusCode = _this.statusCode;
        if (_this.headers) {
            for (var header in _this.headers) {
                _this.res.header(header, _this.headers[header]);
            }
        }
    };

    this.finish = function () {
        if (!_this.res) {
            _this.reply.continue();
        }
    };

    this.reply = reply;
};

var _class = function (_Abstract) {
    _inherits(_class, _Abstract);

    // register.attributes = { name: '', version: version }
    function _class(runner) {
        _classCallCheck(this, _class);

        var _this2 = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, runner));

        _this2.name = 'swagger-node-runner';
        _this2.version = _package.version;

        _this2.register = function (server, options, next) {
            server.ext('onRequest', function (request, reply) {

                var req = request.raw.req;
                var res = new Response(reply);

                try {
                    var operation = _this2.checkOperation(req, res);
                    if (!operation) {
                        return next();
                    }
                    _this2.runner.applyMetadata(req, operation, function () {
                        _this2.afterOperation(req, res, next);
                        res.finish();
                    });
                } catch (e) {
                    return next(e);
                }
                /* istanbul ignore next */
                server.on('request-error', function (request, err) {
                    debug('Request: %s error: %s', request.id, err.stack);
                });

                next();
            });
        };

        return _this2;
    }

    return _class;
}(_Abstract3.default);

exports.default = _class;