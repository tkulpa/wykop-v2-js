const axios = require('axios');
const crypto = require('crypto');
const log = require('npmlog');
const querystring = require('querystring');
// const sortPostParams = require('./sortPostParams');

const ret = {
  /**
   * Construct URL to send a request
   * @param {Array} type request type
   * @param {Object} p request parameters
   */
  constructUrl: async (type, p) => {
    let apiParams = ['appkey', ret.appkey];
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
    if (ret.appkey !== 'aNd401dAPp') {
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
