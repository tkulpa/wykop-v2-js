import crypto from 'crypto';
import API from '../api/api';

export default class Connect {
  wykop: any;
  API: API;

  constructor(wykop) {
    this.wykop = wykop;
    this.API = new API(wykop);
  }

  async constructURL(redirectURL) {
    let url = await this.API.constructUrl(['login', 'connect'], null);
    if (redirectURL) {
      const redirect = btoa(encodeURIComponent(redirectURL));
      const secure = crypto.createHash('md5').update(encodeURIComponent(`${this.wykop.secretkey},${redirectURL}`, 'binary')).digest('hex');
      url += `?redirect=${redirect}&secure=${secure}`;
    }
    return url;
  }
}
