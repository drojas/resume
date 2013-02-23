
/**
 * Module dependencies.
 */

var express = require('express')
  , socketio = require('socket.io')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , expressUglify = require('express-uglify');

var app = express();

var config = require('./config');

app.configure('production', function() {
  app.use(expressUglify.middleware({
    src: __dirname + '/public'
    , logLevel: 'error'
  }));
});

app.configure('development', function() {
  if (!process.env.NOCOMPRESS) {
      app.use(expressUglify.middleware({
      src: __dirname + '/public'
      , logLevel: 'info'
    }));
  }
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(function(req, res, next){
    app.locals({
      title: 'drojas'
    })
    next();
  });
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/contact', routes.contact);
app.get('/about', routes.about);

var server = http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

var io = socketio.listen(server);
io
  .of('/chat')
  .on('connection', function(socket) {
    socket.emit('successful connection');
    socket.on('message', function(data) {
      socket.get('name', function(err, name) {
        if (err) { console.log(err); }
        data.from = name;
        if (name === config.admin.name
            && typeof data.to === 'undefined') {
          return false;
        }
        io
          .of('/chat')
          .in(data.to || config.admin.name)
          .emit('message', data);
      });
    });
    socket.on('register', function(name) {
      if (io.rooms.hasOwnProperty('/chat/' + name)) {
        socket.emit('rejected',
          { message: 'The name ' + name + 
                      ' is already in use.' +
                      ' pick a different one.'})
      } else {
        var auth = name.match(/^([^:]*):(.*)$/);
        if (auth) {
          var authorized = false;
          var name = auth[1];
          var pass = auth[2];
          if (name === config.admin.name
              && pass === config.admin.password) {
            authorized = true;
          }
        }
        if (name === config.admin.name && !authorized) {
          socket.emit('restricted name', {
            message: name + ' is a restricted name'
          });
        } else {
          socket.set('name', name, function(){
            var data = { 
              message: 'You are now connected',
              name: name };
            if (name === config.admin.name) {
              data.admin = true;
            }
            socket.join(name);
            socket.emit('accepted', data);
                
          });
        }
      }
    });
    socket.on('unregister', function() {
      socket.get('name', function(err, name) {
        if (err) { console.log(err); }
        socket.leave(name);
        socket.emit('unregistered', {
          message: 'You are now disconnected',
          name: name })
        });
      });
  });
