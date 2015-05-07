'use strict';

var got = require('got');

function slack(url) {
  return function send(payload) {
    return got(url, {
      type: 'POST',
      body: JSON.stringify(payload)
    });
  };
}

module.exports = slack;
