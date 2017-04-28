'use strict';


/**
 * @author palmtale
 * @since 2017/4/26.
 */


import _ from 'lodash';
import _debug from 'debug';
import util from 'util';
import {EventEmitter} from 'events';

const debug = _debug('swagger');
const debugContent = _debug('swagger:content');

const translate = (output, mimeType) => {

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

const event = (ctx, body, eventEmitter) => {
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

const hookResponseForValidation = (context, eventEmitter) => {
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

const defineContextFinish = (context, next) => (() => {
    debugContent('exec', context.error);
    if (context.error) {
        return next(context.error);
    }

    try {
        const response = context.response;

        if (context.statusCode) {
            debug('setting response statusCode: %d', context.statusCode);
            response.statusCode = context.statusCode;
        }

        if (context.headers) {
            debugContent('setting response headers: %j', context.headers);
            _.each(context.headers, function (value, name) {
                response.setHeader(name, value);
            });
        }

        if (context.output) {
            const body = translate(context.output, response.getHeader('content-type'));

            debugContent('sending response body: %s', body);
            response.end(body);
        }
        next();
    } catch (err) {
        /* istanbul ignore next */
        next(err);
    }
});

class Middleware {

    runner = null;

    constructor(runner) {
        this.runner = runner;
    }

    middleware = () => {
        throw new Error('Do not use the abstract middleware directly.');
    };

    register = (app) => {
        app.use(this.middleware);
    };

    checkOperation = (req, res) => {
        const operation = this.runner.getOperation(req);
        if (!operation) {
            const path = this.runner.getPath(req);
            if (!path) {
                return false;
            }
            if (!path['x-swagger-pipe'] && req.method !== 'OPTIONS') {
                const msg = util.format('Path [%s] defined in Swagger, but %s operation is not.', path.path, req.method);
                const err = new Error(msg);
                err.statusCode = 405;
                err.status = err.statusCode; // for Sails, see: https://github.com/theganyo/swagger-node-runner/pull/31
                const allowedMethods = _.map(path.operationObjects, operation => operation.method.toUpperCase());
                err.allowedMethods = allowedMethods;
                res.setHeader('Allow', allowedMethods.sort().join(', '));
                throw err;
            }
        }
        return operation;
    };

    afterOperation = (req, res, next) => {
        const pipe = this.runner.getPipe(req);
        if (!pipe) {
            const err = new Error('No implementation found for this path.');
            err.statusCode = 405;
            throw err;
        }
        const context = {
            // system values
            _errorHandler: this.runner.defaultErrorHandler(),
            request: req,
            response: res,
            // user-modifiable values
            input: undefined,
            statusCode: undefined,
            headers: {},
            output: undefined
        };
        context._finish = defineContextFinish(context, next);
        /* istanbul ignore next */
        const listenerCount = (this.runner.listenerCount) ?
            this.runner.listenerCount('responseValidationError') : // Node >= 4.0
            EventEmitter.listenerCount(this.runner, 'responseValidationError'); // Node < 4.0
        if (listenerCount) {
            hookResponseForValidation(context, this.runner);
        }

        this.runner.bagpipes.play(pipe, context);
    };
}

export default Middleware;