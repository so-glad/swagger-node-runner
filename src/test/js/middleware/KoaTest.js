
'use strict';

/**
 * @author palmtale
 * @since 2017/5/2.
 */

import path from 'path';
import App from 'koa';


import common from './common';
import commonMock from './common_mock';
import SwaggerRunner from '../../../../dist/Runner';

const TEST_PROJECT_ROOT = path.resolve(__dirname, '..', '..', 'resources', 'project');
const TEST_PROJECT_CONFIG = { appRoot: TEST_PROJECT_ROOT };

const MOCK_CONFIG = {
    appRoot: TEST_PROJECT_ROOT,
    bagpipes: {_router: {mockMode: true}}
};

describe('connect_middleware', () => {

    describe('standard', () => {

        before(done => createServer.call(this, TEST_PROJECT_CONFIG, done));

        common();
    });

    describe('mock', function() {

        before(function(done) {
            createServer.call(this, MOCK_CONFIG, done);
        });

        commonMock();
    });
});

const createServer = (config, done) => {
    const runner = new SwaggerRunner(config);
    runner.setupSway()
        .then(() => {
            runner.mount(App());
            done();
        })
        .catch(err => {
            console.error(err);
            return done(err);
        });
};
