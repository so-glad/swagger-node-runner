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
            const operation = this.checkOperation(req, res);
            if(!operation) {
                return yield next();
            }
            this.runner.applyMetadata(req, operation, () => {
                this.afterOperation(req, res, next);
            });
        } catch(e) {
            return yield next(e);
        }
    };
}
