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
var async = require('async');
var changeCase = require('change-case');

var mv = require('mv');

var strings = yaml.safeLoad(fs.readFileSync(path.resolve('./strings.yml')));

var env = process.env;
var gaToken = env.GA_TOKEN;
var slackUrl = env.SLACK_WEBHOOK_URL;
var clientId = env.GOOGLE_CLIENTID;
var channel = env.SLACK_CHANNEL;
var botName = env.SLACK_BOT_NAME || 'SIR';

function exitWithError(err) {
  console.error(err);
  process.exit(1);
}

if (!gaToken) {
  exitWithError('Please set GA_TOKEN environment variable.')
}

if (!slackUrl) {
  exitWithError('Please set SLACK_WEBHOOK_URL environment variable.')
}

if (!clientId) {
  exitWithError('Please set GOOGLE_CLIENTID environment variable.')
}

var slack = require('./lib/slack')(slackUrl);

// extend strings
strings.main = _.assign({}, {
  title: strings.title,
  gaToken: gaToken
}, strings.main);
strings.signin = _.assign({}, {
  title: strings.title,
  gaToken: gaToken,
  clientId: clientId
}, strings.signin);
strings.apply = _.assign({}, {
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
    req.originUri = req.protocol + '://' + req.get('host');
    next();
  }
);

app.get('/', function (req, res) {
  res.render('main', _.assign({}, strings.main, dotty.get(req, 'session.user')));
});

app.get('/signin', function (req, res) {
  var user = dotty.get(req, 'session.user');

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
  var user = dotty.get(req, 'session.user');

  strings.apply.form.fullName.value = user.displayName;
  strings.apply.form.email.value = user.emails[0].value;

  res.render('apply', _.assign({}, strings.apply, user));
});

app.post('/apply', validate(), rateLimit(), function (req, res) {
  var user = dotty.get(req, 'session.user');
  var files = req.files;
  var renameJobs = [];

  console.log('Received application from "%s <%s>"', user.displayName, user.emails[0].value);

  for (var field in files) {
    var fileObj = files[field];
    var tmpPath = fileObj.path;
    var filename = field + '-' + fileObj.name;
    var dest = __dirname + '/public/images/' + filename;

    _.assign(fileObj, {
      dest: dest,
      uri: req.originUri + '/images/' + filename
    });

    mv(tmpPath, dest, function(err) {
    });
  }

  async.parallel(renameJobs, function (err) {
    if (err) {
      console.error(err);
      return void res.sendStatus(500);
    }

    res.redirect('/thanks');

    slack({
      channel: channel,
      username: botName,
      icon_url: req.originUri + 'images/bot.png',
      attachments: [
        {
          fallback: user.displayName + ' wants to join Slack',
          author_name: user.displayName,
          author_link: user.url,
          author_icon: dotty.get(user, 'image.url'),
          color: '#28f428',
          pretext: 'New invite request:',
          text: req.body.comments ? '"' + req.body.comments + '"' : undefined,
          fields: _.map(
            _.pairs(_.omit(req.body, 'comments')),
            _.flow(
              function (x) { return x; },
              _.partialRight(_.map, function (str, i) {
                return i ? str : changeCase.title(str);
              }),
              _.partial(_.zipObject, ['title', 'value']),
              _.partialRight(_.assign, { short: true })
            )
          )
            .concat(_.map(files, function (file) {
              return {
                title: file.fieldname,
                value: '<' + file.uri + '|View>',
                short: true
              }
            }))
        }
      ]
    });
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
