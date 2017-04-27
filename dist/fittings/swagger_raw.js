'use strict';

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug3.default)('swagger:swagger_raw');
// default filter just drops all the x- labels
var DROP_SWAGGER_EXTENSIONS = /^(?!x-.*)/;

// default filter drops anything labeled x-private
var X_PRIVATE = ['x-private'];

var filterKeysRecursive = function filterKeysRecursive(object, dropTagRegex, privateTags) {
    if (_lodash2.default.isPlainObject(object)) {
        if (_lodash2.default.any(privateTags, function (tag) {
            return object[tag];
        })) {
            object = undefined;
        } else {
            var result = {};
            _lodash2.default.each(object, function (value, key) {
                if (dropTagRegex.test(key)) {
                    var v = filterKeysRecursive(value, dropTagRegex, privateTags);
                    if (v !== undefined) {
                        result[key] = v;
                    } else {
                        debug('dropping object at %s', key);
                        delete result[key];
                    }
                } else {
                    debug('dropping value at %s', key);
                }
            });
            return result;
        }
    } else if (Array.isArray(object)) {
        object = object.reduce(function (reduced, value) {
            var v = filterKeysRecursive(value, dropTagRegex, privateTags);
            if (v !== undefined) {
                reduced.push(v);
            }
            return reduced;
        }, []);
    }
    return object;
};

var create = function create(fittingDef, bagpipes) {
    debug('config: %j', fittingDef);
    var filter = DROP_SWAGGER_EXTENSIONS;
    if (fittingDef.filter) {
        filter = new RegExp(fittingDef.filter);
    }
    debug('swagger doc filter: %s', filter);
    var privateTags = fittingDef.privateTags || X_PRIVATE;
    var filteredSwagger = filterKeysRecursive(bagpipes.config.swaggerNodeRunner.swagger, filter, privateTags);
    if (!filteredSwagger) {
        return next(null, '');
    }
    // should this just be based on accept type?
    var yaml = _jsYaml2.default.safeDump(filteredSwagger, { indent: 2 });
    var json = JSON.stringify(filteredSwagger, null, 2);

    return function (context, next) {
        debug('exec');
        var req = context.request;
        var accept = req.headers['accept'];
        if (accept && accept.indexOf('yaml') != -1) {
            context.headers['Content-Type'] = 'application/yaml';
            next(null, yaml);
        } else {
            context.headers['Content-Type'] = 'application/json';
            next(null, json);
        }
    };
};

module.exports = create;