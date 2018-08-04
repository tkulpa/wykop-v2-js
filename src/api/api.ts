import axios from 'axios';
import crypto from 'crypto';
import querystring from 'querystring';
import log from 'npmlog';
import Login from '../login/login';
import isMaciej from '../utils/isMaciej';
import params from '../types/params';

export default class API {
  wykop: any;
  login: Login;

  constructor(wykop) {
    this.wykop = wykop;
  }

  /**
   * Construct URL to send a request
   * @param {Array} type request type
   * @param {Object} p request parameters
   */
  async constructUrl(type: Array<String>, p: params) {
    let apiParams = ['appkey', this.wykop.appkey];
    if (this.wykop.loggedIn) apiParams = apiParams.concat(['userkey', this.wykop.userkey]);
    if (p && p.api) apiParams = p.api.concat(apiParams);
    let url = `http${this.wykop.ssl ? 's' : ''}://a2.wykop.pl/`;
    url += `${type.join('/')}/`;
    url += `${apiParams.join('/')}/`;
    return url;
  }

  /**
   * Construct request headers
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  async constructHeaders(url: String, { post }) {
    const headers = {
      'User-Agent': this.wykop.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
      apisign: await this.sign(url, { post }),
    };
    if (isMaciej(this.wykop.appkey)) {
      delete(headers.apisign);
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
  async sign(url, { post }) {
    // Not tested yet
    let txt = `${this.wykop.secretkey}${url}`;
    if (post) {
      let postValues = [];
      const postKeys = Object.keys(post);
      let i = 0;
      for (; i < postKeys.length; i += 1) {
        postValues = postValues.concat(
          unescape(encodeURIComponent(post[postKeys[i]])),
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
  async request(type, { api, post }: params) {
    const url = await this.constructUrl(type, { api, post });
    const headers = await this.constructHeaders(url, { post });
    let data;
    let method = 'get';
    if (post) {
      data = await this.readyPostParams(post);
      method = 'post';
    }
    log.silly('api', 'method', method);
    log.silly('api', 'url', url);
    log.silly('api', 'post data', post);
    log.silly('api', 'headers', headers);
    const requestConfig = {
      method,
      url,
      data,
      headers,
    };
    return new Promise(async (resolve, reject) => {
      axios(requestConfig)
        .catch(res => reject(res))
        .then((res) => {
          if (!res.headers['content-type'].includes('application/json')) {
            reject(res);
          } else if (!res.status.ok) {
            reject(res);
          } else if (res.data.error) {
          // if userkey expired
          // TODO: set actual error code
            if (res.data.error.code === -1 && this.wykop.loggedIn) {
              // log in again and retry
              this.login = new Login(this.wykop);
              this.login.relogin().then(() => axios(requestConfig))
                .catch(res2 => reject(res2))
                .then((res2) => {
                  if (!res2.data) {
                    reject(res2);
                  } else if (res2.data.error) {
                    reject(res2.data.error);
                  } else {
                    resolve(res2.data.data);
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
}
