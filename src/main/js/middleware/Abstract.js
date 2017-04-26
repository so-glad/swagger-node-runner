'use strict';


/**
 * @author palmtale
 * @since 2017/4/26.
 */


import _debug from 'debug';
import util from 'util';

const debug = _debug('swagger');
const debugContent = _debug('swagger:content');


class Middleware {

    runner = null;

    constructor(runner) {
        this.runner = runner;
    }

    translate = (output, mimeType) => {

        if (typeof output !== 'object') {
            return output;
        }

        switch (true) {
            case /json/.test(mimeType):
                return JSON.stringify(output);
            default:
                return util.inspect(output);
        }
    };

    event = (ctx, body, eventEmitter) => {
        try {
            const headers = ctx.res._headers || ctx.res.headers || {};
            debugContent('response body type: %s value: %s', (typeof body), body);
            const validateResult = ctx.request.swagger.operation.validateResponse({
                statusCode: ctx.res.statusCode,
                headers: headers,
                body: body
            });
            debug('validation result:', validateResult);
            if (validateResult.errors.length || validateResult.warnings.length) {
                debug('emitting responseValidationError');
                eventEmitter.emit('responseValidationError', validateResult, ctx.request, ctx.res);
            }
        } catch (err) {
            /* istanbul ignore next*/
            console.error(err.stack);
        }
    };

    hookResponseForValidation = (context, eventEmitter) => {
        debug('add response validation hook');
        const res = context.response;
        const end = res.end;
        const write = res.write;
        let written = null;

        res.write = (chunk, encoding) => {
            if (written) {
                written = '';
                res.write = write;
                res.end = end;
                debug('multiple writes, will not validate response');
            } else {
                written = chunk;
            }
            write.apply(res, [chunk, encoding]);
        };

        res.end = (data, encoding) => {
            res.write = write;
            res.end = end;
            if (written && data) {
                debug('multiple writes, will not validate response');
            } else if (!context.request.swagger.operation) {
                debug('not a swagger operation, will not validate response');
            } else {
                debug('validating response');
                event(context, (data || written), eventEmitter);
            }
            end.apply(res, [data, encoding]);
        };
    };

    middleware = () => {
        throw new Error('Do not use the abstract middleware directly.');
    };

    register = (app) => {
        app.use(this.middleware);
    };
}

export default Middleware;