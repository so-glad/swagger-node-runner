'use strict';


import qs from 'qs';
import parseUrl from 'parseurl';

// side-effect: stores in query property on req
const queryString = (req) => {
    if (!req.query) {
        const url = parseUrl(req);
        req.query = (url.query) ? qs.parse(url.query) : {};
    }
    return req.query;
};

export default queryString;
