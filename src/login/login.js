const API = require('../api/api');
const { isMaciej } = require('../utils/isMaciej');

module.exports = class login {
  constructor(wykop) {
    this.wykop = wykop;
    this.API = new API(wykop);
  }

  async withData(data) {
    if (data.login && data.password && isMaciej(this.wykop.appkey)) {
      const req = await this.API.request(['login'], {
        post: {
          login: data.login,
          password: data.password,
        },
      });
      this.wykop.userkey = req.data.userkey;
      this.wykop.login = req.data.profile.login;
      this.wykop.password = data.password;
      this.wykop.loggedIn = true;
      return req;
    } else if (data.login && data.accountkey) {
      const req = await this.API.request(['login'], {
        post: {
          login: data.login,
          accountkey: data.accountkey,
        },
      });
      this.wykop.userkey = req.data.userkey;
      this.wykop.login = req.data.profile.login;
      this.wykop.accountkey = data.accountkey;
      this.wykop.loggedIn = true;
      return req;
    } else {
      throw new Error('Wykop SDK error: Too little data to log in');
    }
  }

  async withConnectData(data) {
    const connectData = Buffer.from(data, 'base64').toString('utf8');
    // There's no other way to verify
    // if this is really provided by wykop
    // or manipulated by user, than just making a request with it
    if (!(connectData.login && connectData.appkey && connectData.token)) {
      throw new Error('Manipulated connect data');
    } else if (connectData.appkey !== this.appkey) {
      throw new Error('Connect data for wrong appkey');
    } else {
      const req = await this.API.request(['login'], {
        post: {
          login: connectData.login,
          accountkey: connectData.token,
        },
      });
      this.wykop.userkey = req.data.userkey;
      this.wykop.login = req.data.profile.login;
      this.wykop.accountkey = connectData.token;
      this.wykop.loggedIn = true;
      return req;
    }
  }

  async relogin() {
    if (this.wykop.login && this.wykop.password && isMaciej(this.wykop.appkey)) {
      this.withData({
        login: this.wykop.login,
        password: this.wykop.password,
      });
    } else if (this.wykop.login && this.wykop.accountkey) {
      this.withData({
        login: this.wykop.login,
        accountkey: this.wykop.accountkey,
      });
    } else {
      throw new Error("Class doesn't contain all required information");
    }
  }
};
