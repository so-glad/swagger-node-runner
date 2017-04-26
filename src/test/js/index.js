'use strict';

var should = require('should');
var path = require('path');
var _ = require('lodash');
var util = require('util');

var SwaggerRunner = require('..');

var DEFAULT_PROJECT_ROOT = path.resolve(__dirname, 'assets', 'project');
var DEFAULT_PROJECT_CONFIG = { appRoot: DEFAULT_PROJECT_ROOT };

var SWAGGER_WITH_ERRORS = {
  swagger: "2.0"
};

var SWAGGER_WITH_WARNINGS = {
  swagger: "2.0",
  info: {
    title: '',
    version: ''
  },
  paths: {},
  definitions: {
    SomeUnusedDefinition: {
      properties: {
        name: {
          type: 'string'
        }
      }
    }
  }
};


describe('index', function() {

  describe('instantiation', function() {

    it('should fail without config', function(done) {

      var config = undefined;
      SwaggerRunner.create(config, function(err, runner) {
        should.exist(err);
        err.message.should.eql('config.appRoot is required');
        done();
      });
    });

    it('should fail without config.appRoot', function(done) {

      var config = {};
      SwaggerRunner.create(config, function(err, runner) {
        should.exist(err);
        err.message.should.eql('config.appRoot is required');
        done();
      });
    });

    it('should accept passed in configuration', function(done) {

      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      config.something = 'x';
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        config.something.should.eql(runner.config.swagger.something);
        done();
      });
    });

    it('should accept env configuration', function(done) {

      var test = 'me';
      var test2 = { x: [ 'y'] };
      process.env.swagger_test = test;
      process.env.swagger_test2_test = JSON.stringify(test2);
      SwaggerRunner.create(DEFAULT_PROJECT_CONFIG, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.should.have.properties({
          test: test,
          test2: { test: test2 }
        });
        done();
      });
    });

    it('should create default config when missing', function(done) {

      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      config.mapErrorsToJson = true;
      config.bagpipes = 'DEFAULTS_TEST';
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.bagpipes.should.have.property('swagger_controllers');

        var app = require('connect')();
        runner.connectMiddleware().register(app);

        var request = require('supertest');

        request(app)
          .get('/hello')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql('Hello, stranger!');
            done();
          });
      });
    });

    it('should create with injected dependencies controllers', function(done) {

      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      var fooFactory = {
        hello: function(name){
          if(!name)
            name = 'stranger';
          return util.format('Hello, %s!', name);
        }
      }
      config.dependencies = {FooFactory: fooFactory}
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.bagpipes.should.have.property('swagger_controllers');

        var app = require('connect')();
        runner.connectMiddleware().register(app);

        var request = require('supertest');

        request(app)
          .get('/hello_injected_dependencies')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql('Hello, stranger!');
            done();
          });
      });
    });
    
    beforeEach( function() {
      //force to load fresh of require('config')
      var xConfigModulePath = /node_modules[\\\/]config[\\\/]/;
      Object.keys(require.cache).forEach(function(path) {
          if ( xConfigModulePath.test(path) )
              delete require.cache[path];
      });
    });
    afterEach(function() {
        delete process.env.NODE_CONFIG_DIR;
    });

    it('should use pipe interface when _router.controllersInterface is set to `pipe`', function(done) {
      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      config.configDir = path.resolve(DEFAULT_PROJECT_ROOT, "config_pipe");
      
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.bagpipes.should.have.property('swagger_controllers');

        var app = require('connect')();
        runner.connectMiddleware().register(app);

        var request = require('supertest');

        request(app)
          .get('/hello')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            should.not.exist(err, err && err.stack);
            res.body.should.eql({ message: 'Hello, stranger!' });
            done();
          });
      });        
    });
    
    it('should use pipe interface when _router.controllersInterface is set to `auto` and operation.length is 2', function(done) {
      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      config.configDir = path.resolve(DEFAULT_PROJECT_ROOT, "config_auto");
      
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.bagpipes.should.have.property('swagger_controllers');

        var app = require('connect')();
        runner.connectMiddleware().register(app);

        var request = require('supertest');

        request(app)
          .get('/controller_interface_auto_detected_as_pipe')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('x-interface', /pipe/)
          .end(function(err, res) {
            should.not.exist(err, err && err.stack);
            res.body.should.eql({ interface: "pipe" });
            done();
          });
      });        
    });
    
    it('should use middleware interface when _router.controllersInterface is set to `auto` and operation.length is 3', function(done) {
      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      config.configDir = path.resolve(DEFAULT_PROJECT_ROOT, "config_auto");
      
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.bagpipes.should.have.property('swagger_controllers');

        var app = require('connect')();
        runner.connectMiddleware().register(app);

        var request = require('supertest');

        request(app)
          .get('/controller_interface_auto_detected_as_middleware')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('x-interface', /middleware/)
          .end(function(err, res) {
            should.not.exist(err, err && err.stack);
            res.body.should.eql({ interface: "middleware" });
            done();
          });
      });        
    });
    
    it('should use adhere to cascading directgive `x-interface-type` found on path', function(done) {
      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      config.configDir = path.resolve(DEFAULT_PROJECT_ROOT, "config_auto");
      
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.bagpipes.should.have.property('swagger_controllers');

        var app = require('connect')();
        runner.connectMiddleware().register(app);

        var request = require('supertest');

        request(app)
          .get('/controller_interface_on_path_cascades')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('x-interface', /pipe/)
          .end(function(err, res) {
            should.not.exist(err, err && err.stack);
            res.body.should.eql({ interface: "pipe" });
            done();
          });
      });        
    });

    it('should use adhere to cascading directgive `x-interface-type` found on operation over one found on path', function(done) {
      var config = _.clone(DEFAULT_PROJECT_CONFIG);
      config.configDir = path.resolve(DEFAULT_PROJECT_ROOT, "config_auto");
      
      SwaggerRunner.create(config, function(err, runner) {
        if (err) { return done(err); }
        runner.config.swagger.bagpipes.should.have.property('swagger_controllers');

        var app = require('connect')();
        runner.connectMiddleware().register(app);

        var request = require('supertest');

        request(app)
          .get('/controller_interface_on_operation_cascades')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .expect('x-interface', /middleware/)
          .end(function(err, res) {
            should.not.exist(err, err && err.stack);
            res.body.should.eql({ interface: "middleware" });
            done();
          });
      });        
    });     
    

    it('should fail without callback', function() {
      (function() { SwaggerRunner.create(DEFAULT_PROJECT_CONFIG) }).should.throw('callback is required');
    });
  });

  it('should continue with bad swagger if startWithErrors is true', function(done) {
    var config = _.clone(DEFAULT_PROJECT_CONFIG);
    config.startWithErrors = true;
    config.swagger = SWAGGER_WITH_ERRORS;
    SwaggerRunner.create(config, function(err, runner) {
      should.not.exist(err);
      done();
    });
  });

  it('should fail with bad swagger if startWithErrors is false', function(done) {
    var config = _.clone(DEFAULT_PROJECT_CONFIG);
    config.swagger = SWAGGER_WITH_ERRORS;
    SwaggerRunner.create(config, function(err, runner) {
      should.exist(err);
      err.message.should.eql('Swagger validation errors:');
      err.should.have.property('validationErrors');
      err.validationErrors.should.be.an.Array;
      err.validationErrors.length.should.eql(2);
      done();
    });
  });

  it('should fail with swagger warnings if startWithWarnings is false', function(done) {
    var config = _.clone(DEFAULT_PROJECT_CONFIG);
    config.startWithWarnings = false;
    config.swagger = SWAGGER_WITH_WARNINGS;
    SwaggerRunner.create(config, function(err, runner) {
      should.exist(err);
      err.message.should.eql('Swagger validation warnings:');
      err.should.have.property('validationWarnings');
      err.validationWarnings.should.be.an.Array;
      err.validationWarnings.length.should.eql(1);
      done();
    });
  });

  it('should continue with swagger warnings if startWithWarnings is true', function(done) {
    var config = _.clone(DEFAULT_PROJECT_CONFIG);
    config.startWithWarnings = true;
    config.swagger = SWAGGER_WITH_WARNINGS;
    SwaggerRunner.create(config, function(err, runner) {
      should.not.exist(err);
      done();
    });
  });
});
