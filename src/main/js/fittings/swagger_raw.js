'use strict';

import _debug from 'debug';
import YAML from 'js-yaml';
import _ from 'lodash';

const debug = _debug('swagger:swagger_raw');
// default filter just drops all the x- labels
const DROP_SWAGGER_EXTENSIONS = /^(?!x-.*)/;

// default filter drops anything labeled x-private
const X_PRIVATE = ['x-private'];

const filterKeysRecursive = (object, dropTagRegex, privateTags) => {
    if (_.isPlainObject(object)) {
        if (_.any(privateTags, (tag) => object[tag])) {
            object = undefined;
        } else {
            let result = {};
            _.each(object, (value, key) => {
                if (dropTagRegex.test(key)) {
                    const v = filterKeysRecursive(value, dropTagRegex, privateTags);
                    if (v !== undefined) {
                        result[key] = v;
                    } else {
                        debug('dropping object at %s', key);
                        delete(result[key]);
                    }
                } else {
                    debug('dropping value at %s', key);
                }
            });
            return result;
        }
    } else if (Array.isArray(object) ) {
        object = object.reduce((reduced, value) => {
            const v = filterKeysRecursive(value, dropTagRegex, privateTags);
            if (v !== undefined) {
                reduced.push(v);
            }
            return reduced;
        }, []);
    }
    return object;
};

const create = (fittingDef, bagpipes) => {
    debug('config: %j', fittingDef);
    let filter = DROP_SWAGGER_EXTENSIONS;
    if (fittingDef.filter) {
        filter = new RegExp(fittingDef.filter);
    }
    debug('swagger doc filter: %s', filter);
    const privateTags = fittingDef.privateTags || X_PRIVATE;
    const filteredSwagger = filterKeysRecursive(bagpipes.config.swaggerNodeRunner.swagger, filter, privateTags);
    if (!filteredSwagger) {
        return next(null, '');
    }
    // should this just be based on accept type?
    const yaml = YAML.safeDump(filteredSwagger, { indent: 2 });
    const json = JSON.stringify(filteredSwagger, null, 2);

    return (context, next) => {
        debug('exec');
        const req = context.request;
        const accept = req.headers['accept'];
        if (accept && accept.indexOf('yaml') != -1) {
            context.headers['Content-Type'] = 'application/yaml';
            next(null, yaml);
        } else {
            context.headers['Content-Type'] = 'application/json';
            next(null, json);
        }
    };
};

export default create;