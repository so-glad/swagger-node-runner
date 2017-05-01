'use strict';


import Middleware from './Abstract';


class Connect extends Middleware {

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

export default Connect;