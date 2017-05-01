'use strict';

import Abstract from './Abstract';
// var debug = require('debug')('swagger:sails_middleware');

export default class extends Abstract {
    constructor(runner) {
        super(runner);
    }

    middleware = (req, res, next) => { // flow back to connect pipe
        try{
            const pipe = this.pipe(req,res);
            if(!pipe) {
                next();
            }
            const context = this.pipeContext(req, res, next);
            this.runner.bagpipes.play(pipe, context);
        } catch(e) {
            return next(e);
        }
    }
}