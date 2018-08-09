# wykop-v2-js

## Wykop API v2 SDK in TypeScript

Wykop API v2 is not officially available, and works only with keys created for it (used in 2 Android apps - [official Wykop.pl client](https://play.google.com/store/apps/details?id=pl.wykop.droid) and unofficial [Wykop Mobilny](https://github.com/feelfreelinux/WykopMobilny)).

To use it in your project:

```bash
npm install wykop-v2
```

```js
import Wykop from 'wykop-v2';
// or in CommonJS:
const Wykop = require('wykop-v2');

const wykop = new Wykop('appkey', 'secret', {
  ssl: true,
  userAgent: 'rogal',
});

wykop.login.normal({
  login: 'login',
  accountkey: 'accountkey', // Get it with Wykop Connect
  // password: 'P455phR453', <= Works with official app's key only, use it *instead of* accountkey
}).then(() => wykop.request(['entries', 'voteup'], {
  api: [32261501],
}));
```