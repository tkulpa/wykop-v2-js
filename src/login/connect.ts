import crypto from 'crypto';
import API from '../api/api';
import Wykop from '..';

export default class Connect {
  wykop: Wykop;
  API: API;

  constructor(wykop: Wykop) {
    this.wykop = wykop;
    this.API = new API(wykop);
  }

  async constructURL(redirectURL: string) {
    let url = await this.API.constructUrl(['login', 'connect'], {});
    if (redirectURL) {
      const redirect = btoa(encodeURIComponent(redirectURL));
      // @ts-ignore
      const secure = crypto.createHash('md5').update(encodeURIComponent(`${this.wykop.secretkey},${redirectURL}`), 'binary').digest('hex');
      url += `?redirect=${redirect}&secure=${secure}`;
    }
    return url;
  }
}
