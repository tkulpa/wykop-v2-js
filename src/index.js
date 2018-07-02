const axios = require('axios');
const crypto = require('crypto');
const log = require('npmlog');
const querystring = require('querystring');
const isMaciej = require('./utils/isMaciej');
// const sortPostParams = require('./sortPostParams');

const ret = {
  /**
   * Construct URL to send a request
   * @param {Array} type request type
   * @param {Object} p request parameters
   */
  constructUrl: async (type, p) => {
    let apiParams = ['appkey', ret.appkey];
    if (ret.loggedIn) apiParams = apiParams.concat(['userkey', ret.userkey]);
    if (p && p.api) apiParams = apiParams.concat(p.api);
    let url = `http${ret.ssl ? 's' : ''}://a2.wykop.pl/`;
    url += `${type.join('/')}/`;
    url += `${apiParams.join('/')}/`;
    return url;
  },
  /**
   * Construct request headers
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  constructHeaders: async (url, params) => {
    const headers = {
      'User-Agent': ret.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (isMaciej(ret.appkey)) {
      headers.apisign = ret.sign(url, params);
    }
    return headers;
  },
  /**
   * Generate 'apisign' header
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  sign: async (url, params) => {
    // Not tested yet
    let txt = ret.secretkey + url;
    if (params && params.post) {
      const postValues = [];
      const postKeys = Object.keys(params.post);
      let i = 0;
      for (; i < postKeys.length; i += 1) {
        postValues.add(unescape(encodeURIComponent(params.post[postKeys[i]])));
      }
      txt += postValues.join(',');
    }
    return crypto.createHash('md5').update(txt, 'binary').digest('hex');
  },
  /**
   * Force encode body to Unicode
   * @param {Object} postParams request POST body
   */
  readyPostParams: async (postParams) => {
    let i = 0;
    const output = {};
    const postKeys = Object.keys(postParams);
    log.info('rpp', postParams);
    log.info('rpp', postKeys);
    for (; i < postKeys.length; i += 1) {
      output[postKeys[i]] = unescape(encodeURIComponent(postParams[postKeys[i]]));
    }
    log.info('rpp', i);
    log.info('rpp', output);
    return querystring.stringify(output);
  },
  /**
   * Make a request to Wykop API
   * @param {Array} type request type
   * @param {Object} params request parameters
   */
  request: async (type, params = {}) => {
    const url = await ret.constructUrl(type, params);
    const headers = await ret.constructHeaders(url, params);
    let post;
    let method;
    if (params && params.post) {
      post = await ret.readyPostParams(params.post);
      log.info('req', post);
      method = 'post';
    } else {
      method = 'get';
    }
    const request = await axios({
      method,
      url,
      data: post,
      headers,
    });
    log.info('req', 'request', request);
    return request.data;
  },
  login: async (data) => {
    if (typeof data === 'object') {
      if (data.login && data.password && isMaciej(ret.appkey)) {
        const req = await ret.request(['login'], {
          post: {
            login: data.login,
            password: data.password,
          },
        });
        ret.userkey = req.data.userkey;
        ret.login = req.data.profile.login;
        ret.password = data.password;
        ret.loggedIn = true;
        return req;
      } else if (data.login && data.accountkey) {
        const req = await ret.request(['login'], {
          post: {
            login: data.login,
            accountkey: data.accountkey,
          },
        });
        ret.userkey = req.data.userkey;
        ret.login = req.data.profile.login;
        ret.accountkey = data.accountkey;
        ret.loggedIn = true;
        return req;
      } else {
        throw new Error('Wykop SDK error: Too little data to log in');
      }
    } else if (typeof data === 'string') {
      const connectData = Buffer.from(data, 'base64').toString('utf8');
      // There's no other way to verify
      // if this is really provided by wykop
      // or manipulated by user, than just making a request with it
      if (!(connectData.login && connectData.appkey && connectData.token)) {
        throw new Error('Manipulated connect data');
      } else if (connectData.appkey !== ret.appkey) {
        throw new Error('Connect data for wrong appkey');
      } else {
        const req = await ret.request(['login'], {
          post: {
            login: connectData.login,
            accountkey: connectData.token,
          },
        });
        ret.userkey = req.data.userkey;
        ret.login = req.data.profile.login;
        ret.accountkey = connectData.token;
        ret.loggedIn = true;
        return req;
      }
    } else if ((data === undefined || data === null)
      && ret.loggedIn && ret.login
      && (ret.accountkey || (ret.password && isMaciej(ret.appkey)))) {
      if (ret.accountkey) {
        const req = await ret.request(['login'], {
          post: {
            login: ret.login,
            accountkey: ret.accountkey,
          },
        });
        ret.userkey = req.userkey;
        ret.login = req.data.login;
        return req;
      } else if (ret.password) {
        const req = await ret.request(['login'], {
          post: {
            login: ret.login,
            password: ret.password,
          },
        });
        ret.userkey = req.userkey;
        ret.login = req.data.login;
        return req;
      }
    } else {
      throw new Error('Wrong data type - accepting Object or Connect method string only');
    }
  },
  ssl: true,
  userAgent: 'random',
};

module.exports = (appkey, secretkey, p = {}) => {
  const r = ret;
  r.appkey = appkey;
  if (secretkey) r.secretkey = secretkey;
  if (p.ssl) r.ssl = p.ssl;
  if (p.userAgent) r.userAgent = p.userAgent;
  return r;
};
