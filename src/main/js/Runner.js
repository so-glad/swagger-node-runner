'use strict';

/**
 * @author palmtale
 * @since 2017/4/26.
 */


import _ from 'lodash';
import _debug from 'debug';
import path from 'path';
// import util from 'util';
import Config from 'config';
import sway from 'sway';
import bagpipes from 'bagpipes';
import {EventEmitter} from 'events';


import ExpressMiddleware from './middleware/Express';
import RestifyMiddleware from './middleware/Restify';
import KoaMiddleware from './middleware/KoaAsync';
import HapiMiddleware from './middleware/Hapi';
import SailsMiddleware from './middleware/Sails';

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

const SWAGGER_SELECTED_PIPE = 'x-swagger-pipe';
const SWAGGER_ROUTER_CONTROLLER = 'x-swagger-router-controller';
const DEFAULT_FITTINGS_DIRS = ['api/fittings'];
const DEFAULT_VIEWS_DIRS = ['api/views'];
const DEFAULT_SWAGGER_FILE = 'api/swagger/swagger.yaml'; // relative to appRoot

const debug = _debug('swagger');
/*
 SwaggerNode config priority:
 1. swagger_* environment vars
 2. config passed to create()
 3. read from swagger node in default.yaml in config directory
 4. defaults in this file

 // util.inherits(Runner, EventEmitter);
 */
export default class Runner extends EventEmitter {

    config = Config.util.cloneDeep(Config);
    appJsConfig = null;
    api = null;
    swagger = null;
    securityHandlers = null;
    bagpipes = null;

    swaggerConfigDefaults = {
        enforceUniqueOperationId: false,
        startWithErrors: false,
        startWithWarnings: true
    };

    constructor(appJsConfig) {
        super();
        this.appJsConfig = appJsConfig;
        // don't override if env var already set
        if (!process.env.NODE_CONFIG_DIR) {
            if (!appJsConfig.configDir) {
                appJsConfig.configDir = 'config';
            }
            process.env.NODE_CONFIG_DIR
                = path.resolve(appJsConfig.appRoot, appJsConfig.configDir);
        }
        this.config.swagger =
            Config.util.extendDeep(
                this.swaggerConfigDefaults,
                this.config.swagger,
                appJsConfig,
                this.readEnvConfig());
        debug('resolved config: %j', this.config);
    }

    setupSway = async () => {
        const swayOpts = {
            definition: this.appJsConfig.swagger ||
            this.appJsConfig.swaggerFile ||
            this.resolveAppPath(DEFAULT_SWAGGER_FILE)
        };

        debug('initializing Sway');
        try {
            const api = await sway.create(swayOpts);

            debug('validating api');
            const validateResult = api.validate();
            debug('done validating api. errors: %d, warnings: %d', validateResult.errors.length, validateResult.warnings.length);

            let errors = validateResult.errors;
            if (errors && errors.length > 0) {
                if (!this.config.swagger.enforceUniqueOperationId) {
                    errors = errors.filter(err => (err.code !== 'DUPLICATE_OPERATIONID'));
                }
                if (errors.length > 0) {
                    if (this.config.swagger.startWithErrors) {
                        const errorText = JSON.stringify(errors);
                        //TODO think logger would be better than console. Maybe some log facade framework use.
                        console.error(errorText, 2);
                    } else {
                        const err = new Error('Swagger validation errors:');
                        err.validationErrors = errors;
                        throw err;
                    }
                }
            }

            let warnings = validateResult.warnings;
            if (warnings && warnings.length > 0) {
                const warningText = JSON.stringify(warnings);
                if (this.config.swagger.startWithWarnings) {
                    console.error(warningText, 2);
                } else {
                    const err = new Error('Swagger validation warnings:');
                    err.validationWarnings = warnings;
                    throw err;
                }
            }

            this.api = api;
            this.swagger = api.definition;
            this.securityHandlers = this.appJsConfig.securityHandlers ||
                this.appJsConfig.swaggerSecurityHandlers; // legacy name
            this.bagpipes = this.createPipes();
        } catch (err) {
            console.error('Error in callback! Tossing to global error handler.', err.stack);
            if (err.validationErrors) {
                console.error('Details: ');
                for (let i = 0; i < err.validationErrors.length; i++) {
                    console.error('\t#' + i + '.: ' + err.validationErrors[i].message +
                        ' in swagger config at: >' + err.validationErrors[i].path.join('/') + '<');
                }
            }
            process.nextTick(() => {
                throw err;
            });
        }
    };

    mount = (app) => {
        let middleware = null;

        if (app.subdomainOffset === 2) { //KOA specification
            middleware = new KoaMiddleware(this);
        } else {
            middleware = new ExpressMiddleware(this);
        }

        middleware.register(app);
    };
    // adds req.swagger to the request
    applyMetadata = (req, operation, cb) => {
        const swagger = req.swagger = {};
        swagger.operation = operation;
        if (cb) {
            cb(null, req);
        } else {
            return new Promise((resolved) => {
                return resolved(req);
            });
        }
    };

    resolveAppPath = (to) => path.resolve(this.appJsConfig.appRoot, to);

    readEnvConfig() {
        const config = {};
        _.each(process.env, (value, key) => {
            const split = key.split('_');
            if (split[0] !== 'swagger') {
                return;
            }
            let configItem = config;
            for (let i = 1; i < split.length; i++) {
                const subKey = split[i];
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
        });
        debug('loaded env vars: %j', config);
        return config;
    }

    defaultErrorHandler = () => {
        const defaultErrorFitting = (context, next) => {
            debug('default error handler: %s', context.error.message);
            next();
        };
        return this.bagpipes.createPipeFromFitting(defaultErrorFitting, {name: 'defaultErrorHandler'});
    };

    getOperation = (req) => {
        return this.api.getOperation(req);
    };

    getPath = (req) => {
        return this.api.getPath(req);
    };
    // must assign req.swagger (see #applyMetadata) before calling
    getPipe = (req) => {
        const operation = req.swagger.operation;
        const path = operation ? operation.pathObject : this.getPath(req);
        const config = this.config.swagger;

        // prefer explicit pipe
        let pipeName = null;
        if (operation) {
            pipeName = operation[SWAGGER_SELECTED_PIPE];
        }
        if (!pipeName) {
            pipeName = path[SWAGGER_SELECTED_PIPE];
        }

        // no explicit pipe, but there's a controller
        if (!pipeName) {
            if ((operation && operation[SWAGGER_ROUTER_CONTROLLER]) || path[SWAGGER_ROUTER_CONTROLLER]) {
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

        const pipe = this.bagpipes.pipes[pipeName];

        if (!pipe) {
            debug('no defined pipe: ', pipeName);
            return null;
        }

        debug('executing pipe %s', pipeName);

        return pipe;
    };

    createPipes = () => {
        const config = this.config.swagger;

        const fittingsDirs = (config.fittingsDirs || DEFAULT_FITTINGS_DIRS).map(dir =>
            path.resolve(config.appRoot, dir)
        );
        const swaggerNodeFittingsDir = path.resolve(__dirname, './fittings');
        fittingsDirs.push(swaggerNodeFittingsDir);

        const viewsDirs = (config.viewsDirs || DEFAULT_VIEWS_DIRS).map(dir =>
            path.resolve(config.appRoot, dir)
        );

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
                swagger_controllers: [
                    'cors',
                    'swagger_params_parser',
                    'swagger_security',
                    '_swagger_validate',
                    'express_compatibility',
                    '_router'
                ]
            };

            if (config.mapErrorsToJson) {
                config.bagpipes.swagger_controllers.unshift({onError: 'json_error_handler'});
            }
        }

        const pipesDefs = config.bagpipes;

        const pipesConfig = {
            userFittingsDirs: fittingsDirs,
            userViewsDirs: viewsDirs,
            swaggerNodeRunner: this
        };
        return bagpipes.create(pipesDefs, pipesConfig);
    };

    restifyMiddleware = () => {
        return new RestifyMiddleware(this);
    };

    koaMiddleware = () => {
        return new KoaMiddleware(this);
    };

    sailsMiddleware = () => {
        return new SailsMiddleware(this);
    };

    hapiMiddleware = () => {
        return new HapiMiddleware(this);
    };
}

module.exports = Runner;