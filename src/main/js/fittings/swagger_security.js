'use strict';

import _debug from 'debug';
import async from 'async';
import _ from 'lodash';
import path from 'path';

import helpers from '../middleware/helpers';

const debug = _debug('swagger:swagger_security');
const getScopeOrAPIKey = (req, securityDefinition, name, securityRequirement) => {

    let scopeOrKey = null;

    if (securityDefinition.type === 'oauth2') {
        scopeOrKey = securityRequirement[name];
    } else if (securityDefinition.type === 'apiKey') {
        if (securityDefinition.in === 'query') {
            scopeOrKey = helpers.queryString(req)[securityDefinition.name];
        } else if (securityDefinition.in === 'header') {
            scopeOrKey = req.headers[securityDefinition.name.toLowerCase()];
        }
    }

    return scopeOrKey;
};

const sendSecurityError = (err, res, next) => {

    if (!err.code) {
        err.code = 'server_error';
    }
    if (!err.statusCode) {
        err.statusCode = 403;
    }

    if (err.headers) {
        _.each(err.headers, function (header, name) {
            res.setHeader(name, header);
        });
    }

    res.statusCode = err.statusCode;

    next(err);
};

const create = (fittingDef, bagpipes) => {
    debug('config: %j', fittingDef);
    const runner = bagpipes.config.swaggerNodeRunner;
    if (fittingDef.securityHandlersModule && !runner.config.securityHandlers) {
        const appRoot = runner.config.swagger.appRoot;
        const handlersPath = path.resolve(appRoot, fittingDef.securityHandlersModule);
        runner.securityHandlers = require(handlersPath);
        debug('loaded handlers: %s from: %s', Object.keys(runner.securityHandlers), handlersPath);
    }
    // function swagger_security
    return (context, cb) => {
        debug('exec');
        let handlers = runner.securityHandlers || {};
        const req = context.request;
        const operation = req.swagger.operation;
        if (!operation) {
            return cb();
        }
        const security = operation.getSecurity();
        if (!security || security.length === 0) {
            return cb();
        }
        async.map(security, // logical OR - any one can allow function orCheck
            (securityRequirement, cb) => {
                let secName;
                async.map(Object.keys(securityRequirement), // logical AND - all must allow function andCheck
                    (name, cb) => {
                        const secDef = operation.securityDefinitions[name];
                        const handler = handlers[name];
                        secName = name;
                        if (!handler) {
                            return cb(new Error('Unknown security handler: ' + name));
                        }

                        if (handler.length === 4) {// swagger-tools style handler
                            return handler(req, secDef, getScopeOrAPIKey(req, secDef, name, securityRequirement), cb);
                        } else {
                        // connect-style handler
                            return handler(req, context.response, cb);
                        }
                    },//function andCheckDone
                    (err) => {
                        debug('Security check (%s): %s', secName, _.isNull(err) ? 'allowed' : 'denied');
                        // swap normal err and result to short-circuit the logical OR
                        if (err) {
                            return cb(undefined, err);
                        }
                        return cb(new Error('OK'));
                    });
            }, //function orCheckDone
            (ok, errors) => { // note swapped results
                const allowed = !_.isNull(ok) && ok.message === 'OK';
                debug('Request allowed: %s', allowed);

                allowed ? cb() : sendSecurityError(errors[0], context.response, cb);
            });
    };
};

module.exports = create;
