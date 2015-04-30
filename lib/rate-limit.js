'use strict';

var dotty = require('dotty');

function rateLimit() {
  return function (req, res, next) {
    var timestamp = dotty.get(req, 'session.timestamp');

    if (timestamp && Date.now() - timestamp < 3600000) {
      res.status(429)
        .send('Whoa, ' + name + ', got a little over-excited there, did ya?');
      return;
    }

    next();
  };
}

module.exports = rateLimit;
