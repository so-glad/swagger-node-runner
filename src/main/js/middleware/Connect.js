'use strict';


import _ from 'lodash';
import _debug from 'debug';
import util from 'util';
import {EventEmitter} from 'events';


import Middleware from './Abstract';

const debug = _debug('swagger');
const debugContent = _debug('swagger:content');


class Connect extends Middleware {

    middleware = (req, res, next) => { // flow back to connect pipe

        const operation = this.runner.getOperation(req);

        if (!operation) {
            const path = this.runner.getPath(req);
            if (!path) {
                return next();
            }
            if (!path['x-swagger-pipe'] && req.method !== 'OPTIONS') {
                const msg = util.format('Path [%s] defined in Swagger, but %s operation is not.', path.path, req.method);
                const err = new Error(msg);
                err.statusCode = 405;
                err.status = err.statusCode; // for Sails, see: https://github.com/theganyo/swagger-node-runner/pull/31
                const allowedMethods = _.map(path.operationObjects, operation => operation.method.toUpperCase());
                err.allowedMethods = allowedMethods;
                res.setHeader('Allow', allowedMethods.sort().join(', '));
                return next(err);
            }
        }

        this.runner.applyMetadata(req, operation, (err) => {
            if (err) { /* istanbul ignore next */
                return next(err);
            }

            const pipe = this.runner.getPipe(req);
            if (!pipe) {
                const err = new Error('No implementation found for this path.');
                err.statusCode = 405;
                return next(err);
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
            //function finishConnect
            context._finish = () => { // must have arity of 2
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
                        const body = this.translate(context.output, response.getHeader('content-type'));

                        debugContent('sending response body: %s', body);
                        response.end(body);
                    }

                    next();
                } catch (err) {
                    /* istanbul ignore next */
                    next(err);
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

    }
}

export default Connect;