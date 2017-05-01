
'use strict';

/**
 * @author palmtale
 * @since 2017/4/24.
 */

import Abstract from './Abstract';


export default class extends Abstract {

    constructor(runner) {
        super(runner);
    }

    middleware = function *(next) {
        const req = this.request;
        const res = this.response;
        try{
            const pipe = this.pipe(req,res);
            if(!pipe) {
                return yield next();
            }
            const context = this.pipeContext(req, res, next);
            this.runner.bagpipes.play(pipe, context);
        } catch(e) {
            return yield next(e);
        }
    };
}
