const crypto = require('crypto');
const API = require('../api/api');

module.exports = class connect {
  constructor(wykop) {
    this.wykop = wykop;
    this.API = new API(wykop);
  }

  async constructURL(redirectURL) {
    let url = await this.API.constructUrl(['login', 'connect']);
    if (redirectURL) {
      const redirect = Buffer.from(encodeURIComponent(redirectURL)).toString('base64');
      const secure = crypto.createHash('md5').update(encodeURIComponent(`${this.wykop.secretkey},${redirectURL}`, 'binary')).digest('hex');
      url += `?redirect=${redirect}&secure=${secure}`;
    }
    return url;
  }
};
