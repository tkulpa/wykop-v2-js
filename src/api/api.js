const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');
const log = require('npmlog');
const { isMaciej } = require('../utils/isMaciej');

module.exports = class API {
  constructor(wykop) {
    this.wykop = wykop;
  }

  /**
   * Construct URL to send a request
   * @param {Array} type request type
   * @param {Object} p request parameters
   */
  async constructUrl(type, p) {
    let apiParams = ['appkey', this.wykop.appkey];
    if (this.wykop.loggedIn) apiParams = apiParams.concat(['userkey', this.wykop.userkey]);
    if (p && p.api) apiParams = p.api.concat(apiParams);
    let url = `http${this.ssl ? 's' : ''}://a2.wykop.pl/`;
    url += `${type.join('/')}/`;
    url += `${apiParams.join('/')}/`;
    return url;
  }

  /**
   * Construct request headers
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  async constructHeaders(url, params) {
    const headers = {
      'User-Agent': this.wykop.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (isMaciej(this.wykop.appkey)) {
      headers.apisign = this.sign(url, params);
    }
    return headers;
  }

  /**
   * Force encode body to Unicode
   * @param {Object} postParams request POST body
   */
  async readyPostParams(postParams) {
    let i = 0;
    const output = {};
    const postKeys = Object.keys(postParams);
    for (; i < postKeys.length; i += 1) {
      output[postKeys[i]] = unescape(encodeURIComponent(postParams[postKeys[i]]));
    }
    return querystring.stringify(output);
  }

  /**
   * Generate 'apisign' header
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  async sign(url, params) {
    // Not tested yet
    let txt = this.secretkey + url;
    if (params && params.post) {
      let postValues = [];
      const postKeys = Object.keys(params.post);
      let i = 0;
      for (; i < postKeys.length; i += 1) {
        postValues = postValues.concat(
          postValues,
          unescape(encodeURIComponent(params.post[postKeys[i]])),
        );
      }
      txt += postValues.join(',');
    }
    return crypto.createHash('md5').update(txt, 'binary').digest('hex');
  }

  /**
   * Make a request to Wykop API
   * @param {Array} type request type
   * @param {Object} params request parameters
   */
  async request(type, params = {}) {
    const url = await this.constructUrl(type, params);
    const headers = await this.constructHeaders(url, params);
    let post;
    let method;
    if (params && params.post) {
      post = await this.readyPostParams(params.post);
      method = 'post';
    } else {
      method = 'get';
    }
    log.silly('api', 'method', method);
    log.silly('api', 'url', url);
    const req = await axios({
      method,
      url,
      data: post,
      headers,
    });
    return req.data;
  }
};
