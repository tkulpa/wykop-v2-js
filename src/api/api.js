const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');
const log = require('npmlog');
const Login = require('../login/login');
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
    if (!isMaciej(this.wykop.appkey)) {
      headers.apisign = await this.sign(url, params);
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
    let txt = `${this.wykop.secretkey}${url}`;
    if (params && params.post) {
      let postValues = [];
      const postKeys = Object.keys(params.post);
      let i = 0;
      for (; i < postKeys.length; i += 1) {
        postValues = postValues.concat(
          unescape(encodeURIComponent(params.post[postKeys[i]])),
        );
      }
      txt += postValues.join(',');
    }
    log.silly('api', 'sign txt', txt);
    const result = await crypto.createHash('md5').update(txt, 'binary').digest('hex');
    return result;
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
    log.silly('api', 'post data', post);
    log.silly('api', 'headers', headers);
    const requestConfig = {
      method,
      url,
      data: post,
      headers,
    };
    return new Promise(async (resolve, reject) => {
      axios(requestConfig).then((res) => {
        if (res.error) {
          // if log in required
          // TODO: set actual error code
          if (res.error.code === -1 && this.wykop.loggedIn) {
            // log in again and retry
            this.login = new Login(this.wykop);
            this.login.relogin().then(() => axios(requestConfig))
              .then((res2) => {
                if (res2.data.error) {
                  reject(res2.data.error);
                } else {
                  resolve(res2.data);
                }
              })
              .catch(res2 => reject(res2));
          } else {
            reject(res.error);
          }
        } else {
          resolve(res.data.data);
        }
      })
        .catch(res => reject(res));
    });
  }
};
