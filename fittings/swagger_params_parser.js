'use strict';

import _debug from 'debug';
import bodyParser from 'body-parser';
import async from 'async';
import {is as typeis}  from 'type-is';
import multer from 'multer';
import _  from 'lodash';


import helpers from '../lib/helpers';
const debug = _debug('swagger:swagger_params_parser');
const debugContent = _debug('swagger:content');

const parseRequest = (req, fittingDef, cb) => {

    if (req.query && req.body && req.files) {
        return cb();
    }

    let shouldParseBody = false;
    let shouldParseForm = false;
    let shouldParseQuery = false;
    let multFields = [];

    req.swagger.operation.parameterObjects.forEach(parameter => {
        switch (parameter.in) {
        case 'body':
            shouldParseBody = true;
            break;
        case 'formData':
            shouldParseForm = true;
            if (parameter.type === 'file') {
                multFields.push({ name: parameter.name });
            }
            break;

        case 'query':
            shouldParseQuery = true;
            break;
        }
    });

    if (!req.query && shouldParseQuery) {
        helpers.queryString(req);
    }

    if (req.body || (!shouldParseBody && !shouldParseForm)) {
        return cb();
    }

    let res = null;
    debugContent('parsing req.body for content-type: %s', req.headers['content-type']);
    async.series([
        (cb) => {
            if (multFields.length === 0) {
                return cb();
            }
            const mult = multer(fittingDef.multerOptions);
            mult.fields(multFields)(req, res, (err) => {
                if (err) { /* istanbul ignore next */
                    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                        err.statusCode = 400;
                    }
                    return cb(err);
                }
                if (req.files) {
                    _.forEach(req.files, (file, name) => {
                        req.files[name] = (Array.isArray(file) && file.length === 1) ? file[0] : file;
                    });
                }
                debugContent('multer parsed req.body:', req.body);
                cb();
            });
        },
        (cb) => {
            if (req.body || !shouldParseForm) {
                return cb();
            }
            if (skipParse(fittingDef.urlencodedOptions, req)) {
                return cb();
            } // hack: see skipParse function
            const urlEncodedBodyParser = bodyParser.urlencoded(fittingDef.urlencodedOptions);
            urlEncodedBodyParser(req, res, cb);
        },
        (cb) => {
            if (req.body) {
                debugContent('urlencoded parsed req.body:', req.body);
                return cb();
            }
            if (skipParse(fittingDef.jsonOptions, req)) {
                return cb();
            } // hack: see skipParse function
            bodyParser.json(fittingDef.jsonOptions)(req, res, cb);
        },
        (cb) => {
            if (req.body) {
                debugContent('json parsed req.body:', req.body);
                return cb();
            }
            if (skipParse(fittingDef.textOptions, req)) { return cb(); } // hack: see skipParse function
            bodyParser.text(fittingDef.textOptions)(req, res, (err) => {
                if (req.body) { debugContent('text parsed req.body:', req.body); }
                cb(err);
            });
        }
    ], (err) => cb(err));
};

// hack: avoids body-parser issue: https://github.com/expressjs/body-parser/issues/128

const skipParse = (options, req) => (typeof options.type !== 'function' && !Boolean(typeis(req, options.type)) );


const create = (fittingDef, bagpipes) => {
    debug('config: %j', fittingDef);

    _.defaults(fittingDef, {
        jsonOptions: {
            type: ['json', 'application/*+json']
        },
        urlencodedOptions: {
            extended: false
        },
        multerOptions: {
            inMemory: true
        },
        textOptions: {
            type: '*/*'
        }
    });

    return (context, next) => {
        debug('exec');
        const req = context.request;
        parseRequest(req, fittingDef, (err) => {
            if (err) {
                /* istanbul ignore next */ return next(err);
            }
            const params = req.swagger.params = {};
            req.swagger.operation.parameterObjects.forEach(parameter => {
                params[parameter.name] = parameter.getValue(req); // note: we do not check for errors here
            });
            next(null, params);
        });
    };
};

export default create;