const API = require('./api/api');
const Login = require('./login/login');
const Connect = require('./login/connect');

module.exports = class Wykop {
  constructor(appkey, secretkey, params = {}) {
    this.appkey = appkey;
    this.secretkey = secretkey ? secretkey : null;
    this.ssl = params.ssl ? params.ssl : true;
    this.userAgent = params.userAgent ? params.userAgent : 'random';

    this.API = new API(this);
    this.login = new Login(this);
    this.connect = new Connect(this);

    this.request = this.API.request;
  }
};
