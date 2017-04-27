'use strict';

import _debug from 'debug';

const debug = _debug('swagger:swagger_validator');

const create = (fittingDef, bagpipes) => {
    debug('config: %j', fittingDef);
    return (context, cb) => {
        debug('exec');

    // todo: add support for validating accept header against produces declarations
    // see: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
    //var accept = req.headers['accept'];
    //var produces = _.union(operation.api.definition.produces, operation.definition.produces);
        let error = null;
        if (context.request.swagger.operation) {
            const validateResult = context.request.swagger.operation.validateRequest(context.request);
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
