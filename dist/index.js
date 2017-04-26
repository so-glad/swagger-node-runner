'use strict';

/**
 * @author palmtale
 * @since 2017/4/26.
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Runner = require('./Runner');

var _Runner2 = _interopRequireDefault(_Runner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function _class() {
    _classCallCheck(this, _class);
};

_class.create = function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(config, callback) {
        var runner;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!(callback && !_lodash2.default.isFunction(callback))) {
                            _context.next = 2;
                            break;
                        }

                        throw new Error('callback is required');

                    case 2:
                        if (!(!config || !config.appRoot)) {
                            _context.next = 4;
                            break;
                        }

                        return _context.abrupt('return', callback(new Error('config.appRoot is required')));

                    case 4:
                        runner = new _Runner2.default(config);
                        _context.prev = 5;
                        _context.next = 8;
                        return runner.setupSway();

                    case 8:
                        return _context.abrupt('return', callback ? callback(null, runner) : runner);

                    case 11:
                        _context.prev = 11;
                        _context.t0 = _context['catch'](5);

                        if (!callback) {
                            _context.next = 17;
                            break;
                        }

                        callback(_context.t0);
                        _context.next = 18;
                        break;

                    case 17:
                        throw _context.t0;

                    case 18:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, undefined, [[5, 11]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

exports.default = _class;