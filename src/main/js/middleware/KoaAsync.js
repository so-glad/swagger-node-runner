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
    };
}
