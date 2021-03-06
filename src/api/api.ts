import axios from 'axios';
import querystring from 'querystringify';
import md5 from 'js-md5';
import { isNode } from 'browser-or-node';
import Wykop from '../index';
import IParams from '../types/IParams';
import IRequestHeaders from '../types/IRequestHeaders';

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
  async constructUrl(type: string[], { api, named }: IParams, isForSign?: boolean) {
    let url: string;
    if (isForSign) {
      url = 'https://a2.wykop.pl/';
    } else {
      url = `http${this.wykop.ssl ? 's' : ''}://${this.wykop.host}/`;
    }
    url += `${type.join('/')}/`;
    if (api) {
      url += `${api.join('/')}/`;
    }
    if (named) {
      url += Object.keys(named)
        .map(key => `${ key }/${ named[key] }`)
        .join('/') + '/';
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
  async constructHeaders(type: string[], { api, named, post }: IParams) {
    const headers: IRequestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (isNode) {
      headers['User-Agent'] = this.wykop.userAgent;
    }
    headers.apisign = await this.sign(type, { api, named, post });
    return headers;
  }

  /**
   * Force encode body to Unicode
   * @param {Object} postParams request POST body
   */
  async readyPostParams({ post }: IParams) {
    if (!post) return;
    return querystring.stringify(post);
  }

  /**
   * Generate 'apisign' header
   * @param {String} url request URL
   * @param {Object} params request parameters
   */
  async sign(type: string[], { api, named, post }: IParams) {
    let txt = `${this.wykop.secretkey}${this.constructUrl(type, { api, named, post }, true)}`;
    if (post) {
      txt += Object.values(post)
        .map(e => unescape(encodeURIComponent(e))) // force UTF-8 encoding
        .join(',');
    }
    return md5(txt);
  }

  addOtherProperties(response: any) {
    const ret = response.data;
    const properties = Object.keys(response).filter(e => e !== 'data');
    if (typeof response.data === 'object') {
      properties.forEach(e => ret[e] = response[e]);
    } else {
      properties.forEach(e => ret.prototype[e] = response[e]);
    }
    return ret;
  }

  async readyAxiosConfig(type: string[], { api, named, post }: IParams) {
    const url = await this.constructUrl(type, { api, named, post });
    const headers = await this.constructHeaders(type, { api, named, post });
    let data;
    let method = 'get';
    if (post) {
      data = await this.readyPostParams({ post });
      method = 'post';
    }
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
  async request(
    type: string[],
    { api, named, post }: IParams,
  ): Promise<any> {
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
                    resolve(this.addOtherProperties(res2));
                  }
                })
                .catch(res2 => reject(res2));
            } else {
              reject(res.data.error);
            }
          } else {
            resolve(this.addOtherProperties(res.data));
          }
        })
        .catch(res => reject(res));
    });
  }
}
