'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _sway = require('sway');

var _sway2 = _interopRequireDefault(_sway);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _bagpipes = require('bagpipes');

var _bagpipes2 = _interopRequireDefault(_bagpipes);

var _events = require('events');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _connect_middleware = require('./lib/connect_middleware');

var _connect_middleware2 = _interopRequireDefault(_connect_middleware);

var _restify_middleware = require('./lib/restify_middleware');

var _restify_middleware2 = _interopRequireDefault(_restify_middleware);

var _koa_generator_middleware = require('./lib/koa_generator_middleware');

var _koa_generator_middleware2 = _interopRequireDefault(_koa_generator_middleware);

var _koa_async_middleware = require('./lib/koa_async_middleware');

var _koa_async_middleware2 = _interopRequireDefault(_koa_async_middleware);

var _hapi_middleware = require('./lib/hapi_middleware');

var _hapi_middleware2 = _interopRequireDefault(_hapi_middleware);

var _sails_middleware = require('./lib/sails_middleware');

var _sails_middleware2 = _interopRequireDefault(_sails_middleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
Runner properties:
  config
  swagger
  api  // (sway)
  connectMiddleware()
  resolveAppPath()
  securityHandlers
  bagpipes

Runner events:
 responseValidationError

config properties:
  appRoot
  mockMode
  configDir
  controllersDirs
  mockControllersDirs
  securityHandlers
 */

var debug = (0, _debug3.default)('swagger');

var SWAGGER_SELECTED_PIPE = 'x-swagger-pipe';
var SWAGGER_ROUTER_CONTROLLER = 'x-swagger-router-controller';
var DEFAULT_FITTINGS_DIRS = ['api/fittings'];
var DEFAULT_VIEWS_DIRS = ['api/views'];
var DEFAULT_SWAGGER_FILE = 'api/swagger/swagger.yaml'; // relative to appRoot

/*
SwaggerNode config priority:
  1. swagger_* environment vars
  2. config passed to create()
  3. read from swagger node in default.yaml in config directory
  4. defaults in this file
 */

var Runner = function () {
    function Runner(appJsConfig, callback) {
        var _this = this;

        _classCallCheck(this, Runner);

        this.config = _config2.default.util.cloneDeep(_config2.default);
        this.swaggerConfigDefaults = {
            enforceUniqueOperationId: false,
            startWithErrors: false,
            startWithWarnings: true
        };
        this.appJsConfig = null;
        this.api = null;
        this.swagger = null;
        this.securityHandlers = null;
        this.bagpipes = null;

        this.resolveAppPath = function (to) {
            return _path2.default.resolve(_this.appJsConfig.appRoot, to);
        };

        this.connectMiddleware = function () {
            return (0, _connect_middleware2.default)(_this);
        };

        this.expressMiddleware = this.connectMiddleware;

        this.restifyMiddleware = function () {
            return (0, _restify_middleware2.default)(_this);
        };

        this.koaMiddleware = function () {
            return (0, _koa_async_middleware2.default)(_this);
        };

        this.koa1Middleware = function () {
            return (0, _koa_generator_middleware2.default)(_this);
        };

        this.sailsMiddleware = function () {
            return (0, _sails_middleware2.default)(_this);
        };

        this.hapiMiddleware = function hapiMiddleware() {
            return (0, _hapi_middleware2.default)(this);
        };

        this.defaultErrorHandler = function () {
            var defaultErrorFitting = function defaultErrorFitting(context, next) {
                debug('default error handler: %s', context.error.message);
                next();
            };
            return _this.bagpipes.createPipeFromFitting(defaultErrorFitting, { name: 'defaultErrorHandler' });
        };

        this.getOperation = function (req) {
            return _this.api.getOperation(req);
        };

        this.getPath = function (req) {
            return _this.api.getPath(req);
        };

        this.applyMetadata = function (req, operation, cb) {
            var swagger = req.swagger = {};
            swagger.operation = operation;
            cb();
        };

        this.getPipe = function (req) {
            var operation = req.swagger.operation;
            var path = operation ? operation.pathObject : _this.getPath(req);
            var config = _this.config.swagger;

            // prefer explicit pipe
            var pipeName = null;
            if (operation) {
                pipeName = operation[SWAGGER_SELECTED_PIPE];
            }
            if (!pipeName) {
                pipeName = path[SWAGGER_SELECTED_PIPE];
            }

            // no explicit pipe, but there's a controller
            if (!pipeName) {
                if (operation && operation[SWAGGER_ROUTER_CONTROLLER] || path[SWAGGER_ROUTER_CONTROLLER]) {
                    pipeName = config.swaggerControllerPipe;
                }
            }
            debug('pipe requested:', pipeName);

            // default pipe
            if (!pipeName) {
                pipeName = config.defaultPipe;
            }

            if (!pipeName) {
                debug('no default pipe');
                return null;
            }

            var pipe = _this.bagpipes.pipes[pipeName];

            if (!pipe) {
                debug('no defined pipe: ', pipeName);
                return null;
            }

            debug('executing pipe %s', pipeName);

            return pipe;
        };

        this.createPipes = function () {
            var config = _this.config.swagger;

            var fittingsDirs = (config.fittingsDirs || DEFAULT_FITTINGS_DIRS).map(function (dir) {
                return _path2.default.resolve(config.appRoot, dir);
            });
            var swaggerNodeFittingsDir = _path2.default.resolve(__dirname, './fittings');
            fittingsDirs.push(swaggerNodeFittingsDir);

            var viewsDirs = (config.viewsDirs || DEFAULT_VIEWS_DIRS).map(function (dir) {
                return _path2.default.resolve(config.appRoot, dir);
            });

            // legacy support: set up a default piping for traditional swagger-node if nothing is specified
            if (!config.bagpipes || config.bagpipes === 'DEFAULTS_TEST') {

                debug('**** No bagpipes defined in config. Using default setup. ****');

                config.swaggerControllerPipe = 'swagger_controllers';

                config.bagpipes = {
                    _router: {
                        name: 'swagger_router',
                        mockMode: false,
                        mockControllersDirs: ['api/mocks'],
                        controllersDirs: ['api/controllers']
                    },
                    _swagger_validate: {
                        name: 'swagger_validator',
                        validateReponse: true
                    },
                    swagger_controllers: ['cors', 'swagger_params_parser', 'swagger_security', '_swagger_validate', 'express_compatibility', '_router']
                };

                if (config.mapErrorsToJson) {
                    config.bagpipes.swagger_controllers.unshift({ onError: 'json_error_handler' });
                }
            }

            var pipesDefs = config.bagpipes;

            var pipesConfig = {
                userFittingsDirs: fittingsDirs,
                userViewsDirs: viewsDirs,
                swaggerNodeRunner: _this
            };
            return _bagpipes2.default.create(pipesDefs, pipesConfig);
        };

        _events.EventEmitter.call(this);
        this.appJsConfig = appJsConfig;
        this.callback = callback;
        // don't override if env var already set
        if (!process.env.NODE_CONFIG_DIR) {
            if (!appJsConfig.configDir) {
                appJsConfig.configDir = 'config';
            }
            process.env.NODE_CONFIG_DIR = _path2.default.resolve(appJsConfig.appRoot, appJsConfig.configDir);
        }
        this.config.swagger = _config2.default.util.extendDeep(this.swaggerConfigDefaults, this.config.swagger, appJsConfig, this.readEnvConfig());
        debug('resolved config: %j', this.config);

        var swayOpts = {
            definition: appJsConfig.swagger || appJsConfig.swaggerFile || this.resolveAppPath(DEFAULT_SWAGGER_FILE)
        };

        debug('initializing Sway');
        // sway uses Promises
        _sway2.default.create(swayOpts).then(function (api) {

            debug('validating api');
            var validateResult = api.validate();
            debug('done validating api. errors: %d, warnings: %d', validateResult.errors.length, validateResult.warnings.length);

            var errors = validateResult.errors;
            if (errors && errors.length > 0) {
                if (!_this.config.swagger.enforceUniqueOperationId) {
                    errors = errors.filter(function (err) {
                        return err.code !== 'DUPLICATE_OPERATIONID';
                    });
                }
                if (errors.length > 0) {
                    if (_this.config.swagger.startWithErrors) {
                        var errorText = JSON.stringify(errors);
                        console.error(errorText, 2);
                    } else {
                        var err = new Error('Swagger validation errors:');
                        err.validationErrors = errors;
                        throw err;
                    }
                }
            }

            var warnings = validateResult.warnings;
            if (warnings && warnings.length > 0) {
                var warningText = JSON.stringify(warnings);
                if (_this.config.swagger.startWithWarnings) {
                    console.error(warningText, 2);
                } else {
                    var _err = new Error('Swagger validation warnings:');
                    _err.validationWarnings = warnings;
                    throw _err;
                }
            }

            _this.api = api;
            _this.swagger = api.definition;
            _this.securityHandlers = appJsConfig.securityHandlers || appJsConfig.swaggerSecurityHandlers; // legacy name
            _this.bagpipes = _this.createPipes();

            callback(null, _this);
        }).catch(function (err) {
            callback(err);
        }).catch(function (err) {
            console.error('Error in callback! Tossing to global error handler.', err.stack);

            if (err.validationErrors) {
                console.error('Details: ');
                for (var i = 0; i < err.validationErrors.length; i++) {
                    console.error("\t#" + i + ".: " + err.validationErrors[i].message + " in swagger config at: >" + err.validationErrors[i].path.join('/') + "<");
                }
            }
            process.nextTick(function () {
                throw err;
            });
        });
    }

    // adds req.swagger to the request


    // must assign req.swagger (see #applyMetadata) before calling


    _createClass(Runner, [{
        key: 'readEnvConfig',
        value: function readEnvConfig() {
            var config = {};
            _lodash2.default.each(process.env, function (value, key) {
                var split = key.split('_');
                if (split[0] === 'swagger') {
                    var configItem = config;
                    for (var i = 1; i < split.length; i++) {
                        var subKey = split[i];
                        if (i < split.length - 1) {
                            if (!configItem[subKey]) {
                                configItem[subKey] = {};
                            }
                            configItem = configItem[subKey];
                        } else {
                            try {
                                configItem[subKey] = JSON.parse(value);
                            } catch (err) {
                                configItem[subKey] = value;
                            }
                        }
                    }
                }
            });
            debug('loaded env vars: %j', config);
            return config;
        }
    }]);

    return Runner;
}();

_util2.default.inherits(Runner, _events.EventEmitter);

var _class = function _class() {
    _classCallCheck(this, _class);
};

_class.create = function (config, cb) {

    if (!_lodash2.default.isFunction(cb)) {
        throw new Error('callback is required');
    }
    if (!config || !config.appRoot) {
        return cb(new Error('config.appRoot is required'));
    }

    new Runner(config, cb);
};

exports.default = _class;