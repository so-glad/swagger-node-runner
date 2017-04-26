'use strict';

import _debug from 'debug';
import CORS from 'cors';

const debug = _debug('swagger:cors');

// config options: https://www.npmjs.com/package/cors

const create = (fittingDef, bagpipes) => {
    debug('config: %j', fittingDef);
    const middleware = CORS(fittingDef);
    return (context, cb) => {
        debug('exec');
        middleware(context.request, context.response, cb);
    };
};

export default create;
