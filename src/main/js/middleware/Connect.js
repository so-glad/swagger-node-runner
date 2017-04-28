'use strict';


import Middleware from './Abstract';


class Connect extends Middleware {

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

export default Connect;