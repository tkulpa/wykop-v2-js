import API from './api/api';
import Login from './login/login';
import Connect from './login/connect';

export default class Wykop {
  appkey: String;
  secretkey: String;
  ssl: Boolean;
  userAgent: String;
  API: API;
  login: Login;
  connect: Connect;
  request: Function;

  constructor(appkey: String, secretkey: String, params: any) {
    const { ssl, userAgent } = params;
    this.appkey = appkey;
    this.secretkey = secretkey;
    this.ssl = !!ssl;
    this.userAgent = userAgent || 'random';

    this.API = new API(this);
    this.login = new Login(this);
    this.connect = new Connect(this);

    this.request = this.API.request.bind(this.API);
  }
}
