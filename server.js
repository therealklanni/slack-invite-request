'use strict';

var express = require('express');
var app = express();

var hbs = require('express-handlebars');
var session = require('express-session');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var validate = require('./lib/validate');
var rateLimit = require('./lib/rate-limit');

var dotty = require('dotty');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var assign = require('lodash/object/assign');

var strings = yaml.safeLoad(fs.readFileSync(path.resolve('./strings.yml')));

strings.signin.clientId = process.env.GOOGLE_CLIENTID;
var nav = {
  title: strings.title,
  user: {}
}
strings.signin.title = strings.title;
strings.apply.title = strings.title;

app.engine('.hbs', hbs({
  defaultLayout: 'main',
  extname: '.hbs',
  partialsDir: ['./views/partials/']
}));
app.set('view engine', '.hbs');
app.set('views', './views');

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || 'hack me pls, kthx'
  }),
  cookieParser(),
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json(),
  function (req, res, next) {
    var user = dotty.get(req, 'session.user');

    if (user) {
      res.locals.displayName = user.displayName;
    }

    next();
  }
);

app.get('/', function (req, res) {
  res.render('main', assign({}, strings, {
    user: res.locals.displayName
  }));
});

app.get('/signin', function (req, res) {
  var user = dotty.get(req, 'session.user');
  console.log('locals', res.locals)

  if (user) {
    res.redirect('/apply');
  } else {
    res.render('signin', strings.signin);
  }
});

app.post('/signin', rateLimit(), function (req, res) {
  var user = dotty.get(req, 'body.user');

  if (user && user.kind === 'plus#person') {
    console.log('User "%s" logged in', user.displayName);
    req.session.user = user;
    res.sendStatus(200).end();
  } else {
    res.sendStatus(401).end();
  }
});

app.get('/apply', validate(), function (req, res) {
  res.render('apply', assign({}, strings.apply, {
    user: res.locals.displayName
  }));
});

app.post('/apply', rateLimit());

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.use('/static', express.static('public', {
  index: false
}));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Slack Invite Request listening at http://%s:%s', host, port);
});
