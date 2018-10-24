import md5 from 'js-md5';
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
      const secure = md5(`${this.wykop.secretkey},${redirectURL}`);
      url += `?redirect=${redirect}&secure=${secure}`;
    }
    return url;
  }
}
