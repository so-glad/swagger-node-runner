'use strict';


import Connect from './Connect';
const ALL_METHODS = ['del', 'get', 'head', 'opts', 'post', 'put', 'patch'];


export default class extends Connect {

    constructor(runner){
        super(runner);
    }

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
