import IConnectData from '../types/IConnectData';
import Wykop from '..';
import ILoginData from '../types/ILoginData';
import ILoginResponse from '../types/ILoginResponse';

export default class Login {
  wykop: Wykop;

  constructor(wykop: Wykop) {
    this.wykop = wykop;
  }

  async normal(data: ILoginData) {
    if (data.login && data.password) {
      const req: ILoginResponse = await this.wykop.API.request(['Login'], {
        post: {
          login: data.login,
          password: data.password,
        },
      });
      this.wykop.userkey = req.userkey;
      this.wykop.username = req.profile.login;
      this.wykop.password = data.password;
      this.wykop.loggedIn = true;
      return req;
    }

    if (data.login && data.accountkey) {
      const req = await this.wykop.API.request(['login'], {
        post: {
          login: data.login,
          accountkey: data.accountkey,
        },
      });
      this.wykop.userkey = req.userkey;
      this.wykop.username = req.profile.login;
      this.wykop.accountkey = data.accountkey;
      this.wykop.loggedIn = true;
      return req;
    }

    throw new Error('Wykop SDK error: Too little data to log in');
  }

  async connect(data: string) {
    const connectData: IConnectData = JSON.parse(btoa(data));
    // There's no other way to verify
    // if this is really provided by wykop
    // or manipulated by user, than just making a request with it
    if (!(connectData.login && connectData.appkey && connectData.token)) {
      throw new Error('Manipulated connect data');
    }

    if (connectData.appkey !== this.wykop.appkey) {
      throw new Error('Connect data for wrong appkey');
    }

    const req = await this.wykop.API.request(['login'], {
      post: {
        login: connectData.login,
        accountkey: connectData.token,
      },
    });
    this.wykop.userkey = req.userkey;
    this.wykop.login = req.profile.login;
    this.wykop.accountkey = connectData.token;
    this.wykop.loggedIn = true;
    return req;
  }

  async relogin() {
    if (this.wykop.username && this.wykop.password) {
      return this.normal({
        login: this.wykop.username,
        password: this.wykop.password,
      });
    }

    if (this.wykop.username && this.wykop.accountkey) {
      this.normal({
        login: this.wykop.username,
        accountkey: this.wykop.accountkey,
      });
    }

    throw new Error('Class doesn\'t contain all required information');
  }
}
