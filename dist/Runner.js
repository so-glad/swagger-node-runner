
'use strict';

/**
 * @author palmtale
 * @since 2017/4/26.
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug2 = require('debug');

var _debug3 = _interopRequireDefault(_debug2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _sway = require('sway');

var _sway2 = _interopRequireDefault(_sway);

var _bagpipes = require('bagpipes');

var _bagpipes2 = _interopRequireDefault(_bagpipes);

var _events = require('events');

var _Connect = require('./middleware/Connect');

var _Connect2 = _interopRequireDefault(_Connect);

var _Express = require('./middleware/Express');

var _Express2 = _interopRequireDefault(_Express);

var _Restify = require('./middleware/Restify');

var _Restify2 = _interopRequireDefault(_Restify);

var _KoaAsync = require('./middleware/KoaAsync');

var _KoaAsync2 = _interopRequireDefault(_KoaAsync);

var _Hapi = require('./middleware/Hapi');

var _Hapi2 = _interopRequireDefault(_Hapi);

var _Sails = require('./middleware/Sails');

var _Sails2 = _interopRequireDefault(_Sails);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

var SWAGGER_SELECTED_PIPE = 'x-swagger-pipe';
var SWAGGER_ROUTER_CONTROLLER = 'x-swagger-router-controller';
var DEFAULT_FITTINGS_DIRS = ['api/fittings'];
var DEFAULT_VIEWS_DIRS = ['api/views'];
var DEFAULT_SWAGGER_FILE = 'api/swagger/swagger.yaml'; // relative to appRoot

var debug = (0, _debug3.default)('swagger');
/*
 SwaggerNode config priority:
 1. swagger_* environment vars
 2. config passed to create()
 3. read from swagger node in default.yaml in config directory
 4. defaults in this file
 */

var Runner = function () {
    function Runner(appJsConfig) {
        var _this = this;

        _classCallCheck(this, Runner);

        this.config = _config2.default.util.cloneDeep(_config2.default);
        this.appJsConfig = null;
        this.api = null;
        this.swagger = null;
        this.securityHandlers = null;
        this.bagpipes = null;
        this.swaggerConfigDefaults = {
            enforceUniqueOperationId: false,
            startWithErrors: false,
            startWithWarnings: true
        };
        this.setupSway = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
            var swayOpts, api, validateResult, errors, errorText, err, warnings, warningText, _err, i;

            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            swayOpts = {
                                definition: _this.appJsConfig.swagger || _this.appJsConfig.swaggerFile || _this.resolveAppPath(DEFAULT_SWAGGER_FILE)
                            };


                            debug('initializing Sway');
                            _context.prev = 2;
                            _context.next = 5;
                            return _sway2.default.create(swayOpts);

                        case 5:
                            api = _context.sent;


                            debug('validating api');
                            validateResult = api.validate();

                            debug('done validating api. errors: %d, warnings: %d', validateResult.errors.length, validateResult.warnings.length);

                            errors = validateResult.errors;

                            if (!(errors && errors.length > 0)) {
                                _context.next = 21;
                                break;
                            }

                            if (!_this.config.swagger.enforceUniqueOperationId) {
                                errors = errors.filter(function (err) {
                                    return err.code !== 'DUPLICATE_OPERATIONID';
                                });
                            }

                            if (!(errors.length > 0)) {
                                _context.next = 21;
                                break;
                            }

                            if (!_this.config.swagger.startWithErrors) {
                                _context.next = 18;
                                break;
                            }

                            errorText = JSON.stringify(errors);
                            //TODO think logger would be better than console. Maybe some log facade framework use.

                            console.error(errorText, 2);
                            _context.next = 21;
                            break;

                        case 18:
                            err = new Error('Swagger validation errors:');

                            err.validationErrors = errors;
                            throw err;

                        case 21:
                            warnings = validateResult.warnings;

                            if (!(warnings && warnings.length > 0)) {
                                _context.next = 31;
                                break;
                            }

                            warningText = JSON.stringify(warnings);

                            if (!_this.config.swagger.startWithWarnings) {
                                _context.next = 28;
                                break;
                            }

                            console.error(warningText, 2);
                            _context.next = 31;
                            break;

                        case 28:
                            _err = new Error('Swagger validation warnings:');

                            _err.validationWarnings = warnings;
                            throw _err;

                        case 31:

                            _this.api = api;
                            _this.swagger = api.definition;
                            _this.securityHandlers = _this.appJsConfig.securityHandlers || _this.appJsConfig.swaggerSecurityHandlers; // legacy name
                            _this.bagpipes = _this.createPipes();
                            _context.next = 42;
                            break;

                        case 37:
                            _context.prev = 37;
                            _context.t0 = _context['catch'](2);

                            console.error('Error in callback! Tossing to global error handler.', _context.t0.stack);
                            if (_context.t0.validationErrors) {
                                console.error('Details: ');
                                for (i = 0; i < _context.t0.validationErrors.length; i++) {
                                    console.error('\t#' + i + '.: ' + _context.t0.validationErrors[i].message + ' in swagger config at: >' + _context.t0.validationErrors[i].path.join('/') + '<');
                                }
                            }
                            process.nextTick(function () {
                                throw _context.t0;
                            });

                        case 42:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, _this, [[2, 37]]);
        }));

        this.resolveAppPath = function (to) {
            return _path2.default.resolve(_this.appJsConfig.appRoot, to);
        };

        this.mount = function (app) {
            var middleware = null;

            if (app.subdomainOffset === 2) {
                //KOA specification
                middleware = new _KoaAsync2.default(_this);
            } else {
                middleware = new _Express2.default(_this);
            }

            middleware.register(app);
        };

        this.connectMiddleware = function () {
            return new _Connect2.default(_this);
        };

        this.expressMiddleware = function () {
            return new _Express2.default(_this);
        };

        this.restifyMiddleware = function () {
            return new _Restify2.default(_this);
        };

        this.koaMiddleware = function () {
            return new _KoaAsync2.default(_this);
        };

        this.sailsMiddleware = function () {
            return new _Sails2.default(_this);
        };

        this.hapiMiddleware = function () {
            return new _Hapi2.default(_this);
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
            if (cb) {
                cb(null, req);
            } else {
                return new Promise(function (resolved) {
                    return resolved(req);
                });
            }
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
        // don't override if env var already set
        if (!process.env.NODE_CONFIG_DIR) {
            if (!appJsConfig.configDir) {
                appJsConfig.configDir = 'config';
            }
            process.env.NODE_CONFIG_DIR = _path2.default.resolve(appJsConfig.appRoot, appJsConfig.configDir);
        }
        this.config.swagger = _config2.default.util.extendDeep(this.swaggerConfigDefaults, this.config.swagger, appJsConfig, this.readEnvConfig());
        debug('resolved config: %j', this.config);
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

exports.default = Runner;