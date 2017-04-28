'use strict';


import Abstract from './Abstract';
const ALL_METHODS = ['del', 'get', 'head', 'opts', 'post', 'put', 'patch'];


export default class extends Abstract {

    constructor(runner){
        super(runner);
    }

    middleware = (req, res, callback) => {
        try{
            const operation = this.checkOperation(req, res);
            if(!operation) {
                return callback();
            }
            this.runner.applyMetadata(req, operation, () => {
                this.afterOperation(req, res, callback);
            });
        } catch(e) {
            return callback(e);
        }
    };


    register(app) {
        // this bit of oddness forces Restify to route all requests through the middleware
        ALL_METHODS.forEach(method => {
            app[method]('.*', (req, res, next) => {
                req.query = undefined; // oddly, req.query is a function in Restify, kill it
                this.middleware(req, res, (err) => {
                    if (err) {
                        return next(err);
                    }
                    if (!res.finished) {
                        res.statusCode = 404;
                        res.end('Not found');
                    }
                    next();
                });
            });
        });

        super.register(app);
    }
}
