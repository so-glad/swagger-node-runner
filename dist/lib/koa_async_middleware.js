'use strict';

/**
 * @author palmtale
 * @since 2017/4/24.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

import _debug from 'debug';
import lodash from 'lodash';
import util from 'util';
import { EventEmitter } from 'events';

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
        var _this = this;

        this.runner = null;

        this.middleware = () => {
            return (() => {
                var _ref = _asyncToGenerator(function* (ctx, next) {
                    const req = ctx.req;
                    const res = ctx.res;
                    const operation = _this.runner.getOperation(req);

                    if (!operation) {
                        const path = _this.runner.getPath(req);
                        if (!path) {
                            return yield next();
                        }

                        if (!path['x-swagger-pipe'] && req.method !== 'OPTIONS') {
                            const msg = util.format('Path [%s] defined in Swagger, but %s operation is not.', path.path, req.method);
                            const err = new Error(msg);
                            err.statusCode = 405;

                            const allowedMethods = lodash.map(path.operationObjects, function (operation) {
                                return operation.method.toUpperCase();
                            });
                            err.allowedMethods = allowedMethods;

                            res.setHeader('Allow', allowedMethods.sort().join(', '));
                            return yield next(err);
                        }
                    }

                    _this.runner.applyMetadata(req, operation, (() => {
                        var _ref2 = _asyncToGenerator(function* (err) {
                            if (err) {
                                /* istanbul ignore next */return yield next(err);
                            }

                            const pipe = _this.runner.getPipe(req);
                            if (!pipe) {
                                const err = new Error('No implementation found for this path.');
                                err.statusCode = 405;
                                return yield next(err);
                            }

                            const context = {
                                // system values
                                _errorHandler: _this.runner.defaultErrorHandler(),
                                request: req,
                                response: res,

                                // user-modifiable values
                                input: undefined,
                                statusCode: undefined,
                                headers: {},
                                output: undefined
                            };

                            context._finish = (() => {
                                var _ref3 = _asyncToGenerator(function* (ignore1, ignore2) {
                                    // must have arity of 2
                                    debugContent('exec', context.error);
                                    if (context.error) {
                                        return yield next(context.error);
                                    }

                                    try {
                                        const response = context.response;

                                        if (context.statusCode) {
                                            debug('setting response statusCode: %d', context.statusCode);
                                            response.statusCode = context.statusCode;
                                        }

                                        if (context.headers) {
                                            debugContent('setting response headers: %j', context.headers);
                                            lodash.each(context.headers, function (value, name) {
                                                response.setHeader(name, value);
                                            });
                                        }

                                        if (context.output) {
                                            const body = translate(context.output, response.getHeader('content-type'));

                                            debugContent('sending response body: %s', body);
                                            response.end(body);
                                        }

                                        yield next();
                                    } catch (err) {
                                        /* istanbul ignore next */
                                        yield next(err);
                                    }
                                });

                                return function (_x4, _x5) {
                                    return _ref3.apply(this, arguments);
                                };
                            })();

                            /* istanbul ignore next */
                            const listenerCount = _this.runner.listenerCount ? _this.runner.listenerCount('responseValidationError') : // Node >= 4.0
                            EventEmitter.listenerCount(_this.runner, 'responseValidationError'); // Node < 4.0
                            if (listenerCount) {
                                hookResponseForValidation(context, _this.runner);
                            }

                            _this.runner.bagpipes.play(pipe, context);
                        });

                        return function (_x3) {
                            return _ref2.apply(this, arguments);
                        };
                    })());
                });

                return function (_x, _x2) {
                    return _ref.apply(this, arguments);
                };
            })();
        };

        this.register = koa => {
            koa.use(this.middleware());
        };

        this.runner = runner;
    }

}