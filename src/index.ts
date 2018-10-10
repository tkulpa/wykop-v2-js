import API from './api/api';
import Login from './login/login';
import Connect from './login/connect';
import IConstructorParams from './types/IConstructorParams';
import isMaciej from './utils/isMaciej';

export default class Wykop {
  appkey: string;
  secretkey: string;
  ssl: boolean;
  host: string;
  userAgent: string;
  loggedIn: boolean;
  username?: string;
  userkey?: string;
  accountkey?: string;
  password?: string;
  API: API;
  login: Login;
  connect: Connect;
  request: API['request'];

  constructor(appkey: string, secretkey?: string, p?: IConstructorParams) {
    const { ssl, userAgent, host } = Object.assign({
      ssl: true,
      host: 'a2.wykop.pl',
      userAgent: 'random',
      usingBridge: false,
    }, p);
    this.appkey = appkey;
    this.secretkey = secretkey || '';
    this.ssl = ssl;
    this.host = host;
    this.userAgent = userAgent;
    this.loggedIn = false;

    this.API = new API(this);
    this.login = new Login(this);
    this.connect = new Connect(this);

    this.request = this.API.request.bind(this.API);
  }
}

export { isMaciej };
