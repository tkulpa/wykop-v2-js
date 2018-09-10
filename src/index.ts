import { isBrowser, isNode } from 'browser-or-node';
import { Log } from 'ng2-logger';
import API from './api/api';
import Login from './login/login';
import Connect from './login/connect';
import IConstructorParams from './types/IConstructorParams';
import isMaciej from './utils/isMaciej';

if (isBrowser || (isNode && !process.env.WYKOP_V2_DEV)) {
  Log.setProductionMode();
}

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
    const params = p || {};
    const { ssl, userAgent, host } = params;
    this.appkey = appkey;
    this.secretkey = secretkey || '';
    this.ssl = typeof ssl !== 'undefined' ? !!ssl : true;
    this.host = host || 'a2.wykop.pl';
    this.userAgent = userAgent || 'random';
    this.loggedIn = false;

    this.API = new API(this);
    this.login = new Login(this);
    this.connect = new Connect(this);

    this.request = this.API.request.bind(this.API);
  }
}

export { isMaciej };
