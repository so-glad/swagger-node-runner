'use strict';


import {version} from '../../../../package';

import Abstract from './Abstract';
const debug = require('debug')('swagger:hapi_middleware');

class Response {
    reply = null;
    headers = {};
    statusCode = null;
    res = null;
    constructor(reply) {
        this.reply = reply;
    }

    getHeader = (name) => {
        return this.headers[name.toLowerCase()];
    };

    setHeader = (name, value) => {
        this.headers[name.toLowerCase()] = value;
    };

    end = (string) => {
        this.res = this.reply(string);
        this.res.statusCode = this.statusCode;
        if (this.headers) {
            for (const header in this.headers) {
                this.res.header(header, this.headers[header]);
            }
        }
    };

    finish = () => {
        if (!this.res) {
            this.reply.continue();
        }
    }
}

export default class extends Abstract {

    name = 'swagger-node-runner';

    version = version;

    constructor(runner) {
        super(runner);
    }

    register = (server, options, next) => {
        server.ext('onRequest', (request, reply) => {

            const req = request.raw.req;
            const res = new Response(reply);

            try{
                const operation = this.checkOperation(req, res);
                if(!operation) {
                    return next();
                }
                this.runner.applyMetadata(req, operation, () => {
                    this.afterOperation(req, res, next);
                    res.finish();
                });
            } catch(e) {
                return next(e);
            }
            /* istanbul ignore next */
            server.on('request-error', function (request, err) {
                debug('Request: %s error: %s', request.id, err.stack);
            });

            next();
        });
    };
    // register.attributes = { name: '', version: version }
}
