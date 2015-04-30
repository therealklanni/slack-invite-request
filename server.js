'use strict';

var express = require('express');
var app = express();

var hbs = require('express-handlebars');
var session = require('express-session');

var cookieParser = require('cookie-parser');
var validate = require('./lib/validate');
var rateLimit = require('./lib/rate-limit');

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
  validate()
);

app.post('/apply', rateLimit());

app.get('/', function (req, res) {
  res.render('main', {
    title: 'Slack Invite Request'
  });
});

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
