var _          = require('underscore');
var bodyParser = require('body-parser');
var express    = require('express');
var http       = require('http');
var path       = require('path');
var socketio   = require('socket.io');
var swig       = require('swig');

var routes = require('./routes');

var app    = express();
var server = http.Server(app);
var io     = socketio(server);

app.set('port', process.env.PORT || 8000);

app.enable('verbose errors');

app.use(bodyParser.json());

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set('view cache', false);
swig.setDefaults({ cache: false  });

var SEC_3_4      = 740;
var GAMES        = { };
var START_TAUNTS = ['This is snek'];
var MOVE_TAUNTS  = ['This is snek'];

function addGame(game) {
	GAMES[game] = 'north';
}

function removeGame(game) {
	delete GAMES[game];
	io.emit('game:' + game + ':done');
}

setInterval(function() {
	io.emit('games', _.keys(GAMES));
}, 1000);

io.on('connection', function(socket) {
	var game;

	socket.on('setGame', function(new_game) {
		game = new_game;
		if (!GAMES[game]) {
			return socket.emit('game:' + game + ':done');
		}
		game = new_game;
		socket.emit('going', GAMES[game]);
	});

	socket.on('go', function(dir) {
		if (!GAMES[game]) {
			return socket.emit('game:' + game + ':done');
		}
		GAMES[game] = dir;
		socket.emit('going', GAMES[game]);
	});
});

app.use('/assets', express.static('assets'));

app.get('/', function(req, res) {
	res.json({
		color: '#36CF52',
		head:  process.env.URL + '/assets/snek.gif'
	});
});

app.post('/start', function(req, res) {
	addGame(req.body.game);
	io.emit('game:' + req.body.game + ':turnstart', req.body);
	res.json({
		taunt: _.sample(START_TAUNTS)
	});
});

app.post('/move', function(req, res) {
	io.emit('game:' + req.body.game + ':turnstart', req.body);
	setTimeout(function() {
		io.emit('game:' + req.body.game + ':turnstop', _.pick(req.body, 'turn'));
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
	res.render('game', { game: game, me: process.env.SNAKE_ID });
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

var server = server.listen(app.get('port'), function () {
  console.log('Server listening at ' + process.env.URL);
});
