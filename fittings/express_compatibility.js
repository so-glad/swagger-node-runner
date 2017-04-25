'use strict';

import _debug from 'debug';
import Url from 'url';

const debug = _debug('swagger:cors');

const expressCompatibility = (req, res, next) => {
    if (!req.query || !req.path) {
        const url = Url.parse(req.url, !req.query);
        req.path = url.path;
        req.query = url.query;
    }

    if (!res.json) {
        res.json = (obj) => {
            res.statusCode = res.statusCode || 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
        };
    }

    if (!req.get) {
        req.get = (name) => this.headers[name];
    }

    if (!res.set) {
        res.set = res.setHeader;
    }

    if (!res.get) {
        res.get = res.getHeader;
    }

    if (!res.status) {
        res.status = (status) => {
            res.statusCode = status;
        };
    }
    next();
};

export default function create(fittingDef, bagpipes) {
    debug('config: %j', fittingDef);
    return (context, cb) => {
        debug('exec');
        expressCompatibility(context.request, context.response, cb);
    };
}
