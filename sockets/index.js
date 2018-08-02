var session = require('../config/sessionShare');
var redisStore = require('../config/redisClient.js');
var sessionConfig = require('../config/config.js')['sessionConfig'];
var cookieParser = require('socket.io-cookie-parser');
var cookieSession = require('cookie-session')({secret: sessionConfig.secret})
var f = require('./messagingFunctions.js')

var _ = require('lodash')
/**
* Create a cache class
* @param config
*/
var Io = function(port) {
    this.io = require('socket.io')(port);

    this.io.use(function(socket, next) {
        session(socket.request, socket.request.res, next);
    });

    this.io.use(cookieParser(sessionConfig.secret, {
      decode: function (str) {
        return str.replace('-', '_');
      }
    }))

    this.io.use(function(socket, next){
      cookieSession(socket.handshake, {}, next)
    })

    this.io.sockets.on("connection", f.messagingFunctions)

};

module.exports = Io;
