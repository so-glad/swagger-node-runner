'use strict';

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('swagger:swagger_validator');

var create = function create(fittingDef, bagpipes) {
    debug('config: %j', fittingDef);
    return function (context, cb) {
        debug('exec');

        // todo: add support for validating accept header against produces declarations
        // see: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
        //var accept = req.headers['accept'];
        //var produces = _.union(operation.api.definition.produces, operation.definition.produces);
        var error = null;
        if (context.request.swagger.operation) {
            var validateResult = context.request.swagger.operation.validateRequest(context.request);
            if (validateResult.errors.length) {
                error = new Error('Validation errors');
                error.statusCode = 400;
                error.errors = validateResult.errors;
            }
        } else {
            debug('not a swagger operation, will not validate response');
        }
        cb(error);
    };
};

module.exports = create;