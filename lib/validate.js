'use strict';

var dotty = require('dotty');

function validateLogin() {
  return function (req, res, next) {
    var user = dotty.get(req, 'session.user');

    if (!user) {
      req.session.error = 'Not Authenticated';
      res.redirect('/signin');
      // return void next('Not Authorized');
    } else {
      next();
    }
  };
}

module.exports = validateLogin;
