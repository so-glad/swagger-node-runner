'use strict';

/**
 * @author palmtale
 * @since 2017/4/24.
 */

import _ from 'lodash';
import _debug from 'debug';
import util from 'util';
import {EventEmitter}  from 'events';

import Abstract from './Abstract';

const debug = _debug('swagger');
const debugContent = _debug('swagger:content');

export default class extends Abstract {

    constructor(runner) {
        super(runner);
    }

    middleware = async (ctx, next) => {
        const req = ctx.request;
        const res = ctx.res;

        const operation = this.runner.getOperation(req);
        if (!operation) {
            const path = this.runner.getPath(req);
            if (!path) {
                return await next();
            }

            if (!path['x-swagger-pipe'] && req.method !== 'OPTIONS') {
                const msg = util.format('Path [%s] defined in Swagger, but %s operation is not.', path.path, req.method);
                const err = new Error(msg);
                err.statusCode = 405;

                const allowedMethods = _.map(path.operationObjects, (operation) => operation.method.toUpperCase());
                err.allowedMethods = allowedMethods;

                res.setHeader('Allow', allowedMethods.sort().join(', '));
                return await next(err);
            }
        }

        this.runner.applyMetadata(req, operation, async (err) => {
            if (err) { /* istanbul ignore next */
                return await next(err);
            }

            const pipe = this.runner.getPipe(req);
            if (!pipe) {
                const err = new Error('No implementation found for this path.');
                err.statusCode = 405;
                return await next(err);
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

            context._finish = async () => { // must have arity of 2
                debugContent('exec', context.error);
                if (context.error) {
                    return await next(context.error);
                }

                try {
                    const response = context.response;

                    if (context.statusCode) {
                        debug('setting response statusCode: %d', context.statusCode);
                        response.statusCode = context.statusCode;
                    }

                    if (context.headers) {
                        debugContent('setting response headers: %j', context.headers);
                        _.each(context.headers, (value, name) => {
                            response.setHeader(name, value);
                        });
                    }

                    if (context.output) {
                        const body = this.translate(context.output, response.getHeader('content-type'));

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
            const listenerCount = (this.runner.listenerCount) ?
                this.runner.listenerCount('responseValidationError') : // Node >= 4.0
                EventEmitter.listenerCount(this.runner, 'responseValidationError'); // Node < 4.0
            if (listenerCount) {
                this.hookResponseForValidation(context, this.runner);
            }

            this.runner.bagpipes.play(pipe, context);
        });
    };
}
