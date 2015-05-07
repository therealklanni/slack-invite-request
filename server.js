'use strict';

var express = require('express');
var app = express();

var hbs = require('express-handlebars');
var session = require('express-session');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var validate = require('./lib/validate');
var rateLimit = require('./lib/rate-limit');

var _ = require('lodash');
var dotty = require('dotty');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var assign = require('lodash/object/assign');
var async = require('async');

var strings = yaml.safeLoad(fs.readFileSync(path.resolve('./strings.yml')));

var gaToken = process.env.GA_TOKEN;
var slackUri = process.env.SLACK_WEBHOOK_URL;
var clientId = process.env.GOOGLE_CLIENTID;

strings.main = assign({}, {
  title: strings.title,
  gaToken: gaToken
}, strings.main);
strings.signin = assign({}, {
  title: strings.title,
  gaToken: gaToken,
  clientId: clientId
}, strings.signin);
strings.apply = assign({}, {
  title: strings.title,
  gaToken: gaToken
}, strings.apply);

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
  multer(),
  function (req, res, next) {
    var user = dotty.get(req, 'session.user');

    if (user) {
      res.locals.displayName = user.displayName;
    }

    next();
  },
  function (req, res, next) {
    req.originUri = req.protocol + '://' + req.get('host');
    next();
  }
);

app.get('/', function (req, res) {
  res.render('main', _.assign({}, strings.main, dotty.get(req, 'session.user')));
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

app.get('/thanks', validate(), function (req, res) {
  res.render('thanks', _.assign({}, strings.main, dotty.get(req, 'session.user')));
});

app.get('/apply', validate(), function (req, res) {
  res.render('apply', assign({}, strings.apply, {
    user: res.locals.displayName
  }));
});

app.post('/apply', validate(), rateLimit(), function (req, res) {
  var user = dotty.get(req, 'session.user');
  var files = req.files;
  var renameJobs = [];

  for (var field in files) {
    var fileObj = files[field];
    var tmpPath = fileObj.path;
    var filename = field + '-' + fileObj.name;
    var dest = __dirname + '/public/images/' + filename;

    assign(fileObj, {
      dest: dest,
      uri: req.originUri + '/images/' + filename
    });

    renameJobs.push(async.apply(fs.rename, tmpPath, dest));
  }

  async.parallel(renameJobs, function (err) {
    if (err) {
      console.error(err);
      return void res.sendStatus(500);
    }

    res.sendStatus(200);
  });
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.use(express.static('public', {
  index: false
}));

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Slack Invite Request listening at http://%s:%s', host, port);
});
