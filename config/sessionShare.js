var sessionExpress = require('express-session');
var sessionConfig = require('./config.js')['sessionConfig'];
var passport = require('passport');
var redisStore = require('./redisClient.js')

var session = sessionExpress({
    secret: sessionConfig.secret,
    store: redisStore, // XXX redis server config,
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: false, // important to allow client to read session cookie with JavaScript
        maxAge: 60 * 60 * 1000
    }
});

// session.sessionKey = sessionConfig.name; // needed so socket.js knows what key for the sessionId setting in the handshake cookies

module.exports = session;
