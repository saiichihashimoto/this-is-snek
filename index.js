var _          = require('underscore');
var bodyParser = require('body-parser');
var express    = require('express');
var path       = require('path');
var routes     = require('./routes');
var swig       = require('swig');

var app = express();

app.set('port', process.env.PORT || 8000);

app.enable('verbose errors');

app.use(bodyParser.json());

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', false);
swig.setDefaults({ cache: false  });

var SEC_3_4      = 740;
var GAMES        = { dummy: 'test' };
var START_TAUNTS = ['This is snek'];
var MOVE_TAUNTS  = ['This is snek'];

function print_games() {
	console.log('Games:');
	_.each(GAMES, function(dir, game_id) {
		console.log(process.env.URL + game_id);
	});
}

function addGame(game) {
	GAMES[game] = 'north';
	print_games();
}

function removeGame(game) {
	delete GAMES[game];
	print_games();
}

app.get('/', function(req, res) {
	res.json({
		color: '#ff0000',
		head:  'http://battlesnake-node.herokuapp.com/'
	});
});

app.post('/start', function(req, res) {
	addGame(req.body.game);
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
	removeGame(req.body.game);
	res.json({});
});

app.get('/games', function(req, res) {
	res.render('games', { games: _.keys(GAMES) });
});

app.get('*', function(req, res, next) {
	var game = req.url.slice(1);
	if (!GAMES[game]) {
		return next();
	}
	res.render('game', { game: game });
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
  console.log('Server listening at ' + process.env.URL);
});
