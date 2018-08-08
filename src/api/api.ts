import axios from 'axios';
import crypto from 'crypto';
import querystring from 'querystring';
import log from 'npmlog';
import Wykop from '../index';
import Login from '../login/login';
import isMaciej from '../utils/isMaciej';
import IParams from '../types/IParams';
import IWykopResponse from '../types/IWykopResponse';

export default class API {
  wykop: Wykop;

  constructor(wykop: Wykop) {
    this.wykop = wykop;
  }

  /**
   * Construct URL to send a request
   * @param {Array} type request type
   * @param {Object} p request parameters
   */
  async constructUrl(type: Array<String>, { api, named }: IParams) {
    let url = `http${this.wykop.ssl ? 's' : ''}://${this.wykop.host}/`;
    url += `${type.join('/')}/`;
    if (api) {
      url += `${api.join('/')}/`;
    }
    if (named) {
      url += `${Object.keys(named)
        .map(key => `${ key }/${ named[key] }`)
        .join('/')}/`;
    }
    url += `appkey/${this.wykop.appkey}/`;
    if (this.wykop.loggedIn && this.wykop.userkey) {
      url += `userkey/${this.wykop.userkey}`;
    }
    return url;
  }

  /**
   * Construct request headers
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  async constructHeaders(url: string, { post }: IParams) {
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
  async readyPostParams({ post }: IParams) {
    return querystring.stringify(post);
  }

  /**
   * Generate 'apisign' header
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  async sign(url: string, { post }: IParams) {
    // Not tested yet
    let txt = `${this.wykop.secretkey}${url}`;
    if (post) {
      let postValues: Array<string> = [];
      const postKeys: Array<string> = Object.keys(post);
      let i = 0;
      for (; i < postKeys.length; i += 1) {
        postValues = postValues.concat(
          unescape(encodeURIComponent(post[postKeys[i]])),
        );
      }
      txt += postValues.join(',');
    }
    log.silly('api', 'sign txt', txt);
    // @ts-ignore
    return crypto.createHash('md5').update(txt, 'binary').digest('hex');
  }

  async readyAxiosConfig(type: Array<String>, { api, named, post }: IParams) {
    const url = await this.constructUrl(type, { api, named, post });
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
    return {
      method,
      url,
      data,
      headers,
    };
  }

  /**
   * Make a request to Wykop API
   * @param {Array} type request type
   * @param {Object} params request parameters
   */
  async request(type: Array<String>, { api, named, post }: IParams): Promise<IWykopResponse> {
    return new Promise(async (resolve, reject) => {
      axios(await this.readyAxiosConfig(type, { api, named, post }))
        .then((res) => {
          // if server sends HTML error ("trwa aktualizacja serwisu", "cos poszło nie tak")
          if (!res.headers['content-type'].includes('application/json')) {
            reject(res);
          // if server sends JSON error
          } else if (res.data.error) {
          // if userkey expired
          // TODO: set actual error code
            if (res.data.error.code === -1 && this.wykop.loggedIn) {
              // log in again and retry
              this.wykop.login.relogin()
                .then(async () => axios(await this.readyAxiosConfig(type, { api, post })))
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
              reject(res.data.error);
            }
          } else {
            resolve(res.data.data);
          }
        })
        .catch(res => reject(res));
    });
  }
}
