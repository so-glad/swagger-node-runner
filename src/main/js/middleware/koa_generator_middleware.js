'use strict';

/**
 * @author palmtale
 * @since 2017/4/24.
 */


import _debug from 'debug';
import lodash from 'lodash';
import util from 'util';
import {EventEmitter}  from 'events';

const debug = _debug('swagger');
const debugContent = _debug('swagger:content');


const translate = (output, mimeType) => {

    if (typeof output !== 'object') {
        return output;
    }

    switch(true) {
        case /json/.test(mimeType):
            return JSON.stringify(output);
        default:
            return util.inspect(output);
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
            try {
                const headers = res._headers || res.headers || {};
                const body = data || written;
                debugContent('response body type: %s value: %s', typeof body, body);
                const validateResult = context.request.swagger.operation.validateResponse({
                    statusCode: res.statusCode,
                    headers: headers,
                    body: body
                });
                debug('validation result:', validateResult);
                if (validateResult.errors.length || validateResult.warnings.length) {
                    debug('emitting responseValidationError');
                    eventEmitter.emit('responseValidationError', validateResult, context.request, res);
                }
            } catch (err) {
                /* istanbul ignore next
                 console.error(err.stack);
                 */
            }
        }
        end.apply(res, [data, encoding]);
    };
};

export default class {

    constructor(runner) {
        this.runner = runner;
    }

    runner = null;

    middleware = () => {
        const _runner = this.runner;
        return function *(next) {
            const req = this.req;
            const res = this.res;
            const operation = _runner.getOperation(req);

            if (!operation) {
                const path = _runner.getPath(req);
                if (!path) { return yield next(); }

                if (!path['x-swagger-pipe'] && req.method !== 'OPTIONS') {
                    const msg = util.format('Path [%s] defined in Swagger, but %s operation is not.', path.path, req.method);
                    const err = new Error(msg);
                    err.statusCode = 405;

                    const allowedMethods = lodash.map(path.operationObjects, (operation) => operation.method.toUpperCase());
                    err.allowedMethods = allowedMethods;

                    res.setHeader('Allow', allowedMethods.sort().join(', '));
                    return yield next(err);
                }
            }

            _runner.applyMetadata(req, operation, async (err) => {
                if (err) { /* istanbul ignore next */ return await next(err); }

                const pipe = _runner.getPipe(req);
                if (!pipe) {
                    const err = new Error('No implementation found for this path.');
                    err.statusCode = 405;
                    return await next(err);
                }

                const context = {
                    // system values
                    _errorHandler: _runner.defaultErrorHandler(),
                    request: req,
                    response: res,

                    // user-modifiable values
                    input: undefined,
                    statusCode: undefined,
                    headers: {},
                    output: undefined
                };

                context._finish = async () => { // must have arity of 2
                    debugContent('exec', context.error);
                    if (context.error) { return await next(context.error); }

                    try {
                        const response = context.response;

                        if (context.statusCode) {
                            debug('setting response statusCode: %d', context.statusCode);
                            response.statusCode = context.statusCode;
                        }

                        if (context.headers) {
                            debugContent('setting response headers: %j', context.headers);
                            lodash.each(context.headers, (value, name) => {
                                response.setHeader(name, value);
                            });
                        }

                        if (context.output) {
                            const body = translate(context.output, response.getHeader('content-type'));

                            debugContent('sending response body: %s', body);
                            response.end(body);
                        }

                        await next();
                    }
                    catch (err) {
                        /* istanbul ignore next */
                        await next(err);
                    }
                };

                /* istanbul ignore next */
                const listenerCount = (_runner.listenerCount) ?
                    _runner.listenerCount('responseValidationError') : // Node >= 4.0
                    EventEmitter.listenerCount(_runner, 'responseValidationError'); // Node < 4.0
                if (listenerCount) {
                    hookResponseForValidation(context, _runner);
                }

                _runner.bagpipes.play(pipe, context);
            });
        };
    };

    register = (koa) => {
        koa.use(this.middleware());
    };
}