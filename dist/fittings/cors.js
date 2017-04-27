'use strict';

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('swagger:cors');

// config options: https://www.npmjs.com/package/cors

var create = function create(fittingDef, bagpipes) {
    debug('config: %j', fittingDef);
    var middleware = (0, _cors2.default)(fittingDef);
    return function (context, cb) {
        debug('exec');
        middleware(context.request, context.response, cb);
    };
};

module.exports = create;