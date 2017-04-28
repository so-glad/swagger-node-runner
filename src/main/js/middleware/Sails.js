'use strict';

import Abstract from './Abstract';
// var debug = require('debug')('swagger:sails_middleware');

export default class extends Abstract {
    constructor(runner) {
        super(runner);
    }

    middleware = (req, res, next) => { // flow back to connect pipe
        try{
            const operation = this.checkOperation(req, res);
            if(!operation) {
                return next();
            }
            this.runner.applyMetadata(req, operation, () => {
                this.afterOperation(req, res, next);
            });
        } catch(e) {
            return next(e);
        }
    }
}