var _          = require('underscore');
var config     = require('./config.json');
var bodyParser = require('body-parser');
var express    = require('express');
var logger     = require('morgan');
var app        = express();
var routes     = require('./routes');

app.set('port', (process.env.PORT || config.port));
// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env before going to config.

app.enable('verbose errors');

!process.env.NODE_ENV && app.use(logger('dev'));
app.use(bodyParser.json());

var SEC_3_4      = 740;
var GAMES        = {};
var START_TAUNTS = ['This is snek'];
var MOVE_TAUNTS  = ['This is snek'];

app.get('/', function(req, res) {
	res.json({
		color: '#ff0000',
		head:  'http://battlesnake-node.herokuapp.com/'
	});
});

app.post('/start', function(req, res) {
	GAMES[req.body.game] = 'north';
	res.json({
		taunt: _.sample(START_TAUNTS)
	});
});

app.post('/move', function(req, res) {
	setTimeout(function() {
		res.json({
			move:  GAMES[req.body.game] || 'north',
			taunt: _.sample(MOVE_TAUNTS)
		});
	}, SEC_3_4);
});

app.post('/end', function(req, res) {
	delete GAMES[req.body.game];
	res.json({});
});

// app.use(routes);

app.use('*',function (req, res, next) {
  if (req.url === '/favicon.ico') {
    // Short-circuit favicon requests
    res.set({'Content-Type': 'image/x-icon'});
    res.status(200);
    res.end();
    next();
  } else {
    // Reroute all 404 routes to the 404 handler
    var err = new Error();
    err.status = 404;
    next(err);
  }

  return;
});

// 404 handler middleware, respond with JSON only
app.use(function (err, req, res, next) {
  if (err.status !== 404) {
    return next(err);
  }

  res.status(404);
  res.send({
    status: 404,
    error: err.message || 'no snakes here'
  });

  return;
});

// 500 handler middleware, respond with JSON only
app.use(function (err, req, res, next) {
  var statusCode = err.status || 500;

  res.status(statusCode);
  res.send({
    status: statusCode,
    error: err
  });

  return;
});

var server = app.listen(app.get('port'), function () {
  console.log('Server listening at http://%s:%s', config.host, app.get('port'));
});
