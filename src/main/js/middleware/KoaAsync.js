
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

    middleware = async (ctx, next) => {
        const req = ctx.request;
        const res = ctx.res;
        try{
            const pipe = this.pipe(req,res);
            if(!pipe) {
                return await next();
            }
            const context = this.pipeContext(req, res, next);
            this.runner.bagpipes.play(pipe, context);
        } catch(e) {
            return await next(e);
        }
    };
}
