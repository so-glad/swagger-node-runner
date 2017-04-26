'use strict';

/**
 * @author palmtale
 * @since 2017/4/26.
 */


import _ from 'lodash';
import Runner from './Runner';

export default class {
    static create = async (config, callback) => {

        if (callback && !_.isFunction(callback)) {
            throw new Error('callback is required');
        }
        if (!config || !config.appRoot) {
            return callback(new Error('config.appRoot is required'));
        }
        const runner = new Runner(config);
        try {
            await runner.setupSway();
            return callback ? callback(null, runner) : runner;
        } catch (e) {
            if(callback){
                callback(e);
            } else {
                throw e;
            }
        }
    };
}

