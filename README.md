# Sandstorm Design - Nightmare JS - Drupal 7

A module to keep track of commonly used actions in Drupal 7 to be used by Nightmare JS.

## How to use

1. Create a configuration object.
This can be explicitly created in code, but it's probably best to keep security information in a separate file (.env, or .yml).
At a minimum, this object should contain:
~~~~
const config = {
  url: 'https://somesite.net',
  username: 'drupaladmin',
  password: 'supersecretpass1234'
}
~~~~

optional parameters:
• **login** : If the site doesn't use `/user` as the login page, this should be specified

2. Create an instance of this module
Feed it the config cobject created above. now it knows everything.
~~~~
const D7module = new require('./modules/sd-d7-nightmare/index.js');
const D7 = new D7module(config);
~~~~

3. Create a nightmare instance.
A basic example:
~~~~
const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: true });
~~~~
4. Pass D7 functions into nightmare
I've tried this the other way around (passing nightmare into D7) but this way things stay nicely chained.
Use a `wait()` between functions to keep things from getting out of hand (this might not be necessary)
~~~~
nightmare
  .use(D7.Login())
  .wait(500)
  .use(D7.statusReport())
~~~~
