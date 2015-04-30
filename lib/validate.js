'use strict';

var dotty = require('dotty');

function validateLogin() {
  return function (req, res, next) {
    var user = dotty.get(req, 'session.user');

    if (!user && req.url !== '/login'
        && req.url !== '/' && !(/^\/static\//).test(req.url)) {
      req.session.error = 'Not Authenticated';
      res.redirect('/login');
      return;
    }

    next();
  };
}

module.exports = validateLogin;
