'use strict';
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var session = require('./config/sessionShare.js')
var passport = require('passport');
var dbconfig = require('./config/config.js')['rethinkdb'];
var APPSECRET = require('./config/config.js')['sessionConfig'].secret;
var thinky = require('./util/thinky.js');
var User = require('./models/user')
require('./config/passport')(passport);

var fileUpload = require('express-fileupload');


var app = express();

var index = require('./routes/index')(passport);
var auth = require('./routes/auth')(passport);
var userRoutes = require('./routes/user')(passport);
var teeupRoutes = require('./routes/teeup')(passport);
var messagesRoutes = require('./routes/messages')(passport);
var whenRoutes = require('./routes/when')(passport);
var whereRoutes = require('./routes/where')(passport);
var contactRoutes = require('./routes/contact')(passport);
var imageRoutes = require('./routes/image')(passport);
var phoneRoutes = require('./routes/phone')(passport);
var emailRoutes = require('./routes/email')(passport);
var apiRoutes = require('./routes/api')(passport);
var teeupAutoSettingsRoutes = require('./routes/teeupAutoSettings')(passport);
var feedbackRoutes = require('./routes/feedback')(passport);
var ADDRESS = process.env.ADDRESS || "localhost";
//tell us who routes
var tellUsWhoRoutes = require('./routes/telluswho/index')(passport);
var scientificRoutes = require('./routes/telluswho/scientific')(passport);
var basicInfoRoutes = require('./routes/telluswho/basicInfo')(passport);
var interestRoutes = require('./routes/telluswho/interests')(passport);
var socialRoutes = require('./routes/telluswho/social')(passport);
var adminRoutes = require('./routes/telluswho/admin')(passport);

app.use(cookieParser(APPSECRET));
app.use(cookieSession({secret: APPSECRET}));


app.use(session);

app.use(passport.initialize());
app.use(passport.session());

function isLoggedIn(req, res, next) {
    //

    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).send({status: 401, message: "You must be logged in."})
}
//

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Credentials", "true");
    if(process.env.ADDRESS){
        res.header("Access-Control-Allow-Origin", 'http://' + process.env.ADDRESS + ":3000");
    } else {
        res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    }
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization, Accept");

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('tmp', path.join(__dirname, 'tmp'));
app.set('view engine', 'jade');




// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({limit: '500mb', extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/image/file', express.static(path.join(__dirname, 'images')));

app.use(fileUpload());




app.use('/', index);
app.use('/auth', auth);
app.use('/api', apiRoutes);
app.use('/api/user', isLoggedIn, userRoutes);
app.use('/api/teeups', isLoggedIn, teeupRoutes);
app.use('/api/messages', isLoggedIn, messagesRoutes);
app.use('/api/contact', isLoggedIn, contactRoutes);
app.use('/api/phone', isLoggedIn, phoneRoutes);
app.use('/api/email', isLoggedIn, emailRoutes);
app.use('/api/feedback', isLoggedIn, feedbackRoutes);
app.use('/api/when', isLoggedIn, whenRoutes);
app.use('/api/where', isLoggedIn, whereRoutes);
app.use('/api/teeups/auto', isLoggedIn, teeupAutoSettingsRoutes);
app.use('/api/image', isLoggedIn, imageRoutes);


//Tell us who stuff
app.use('/api/telluswho', isLoggedIn, tellUsWhoRoutes);
app.use('/api/telluswho', isLoggedIn, socialRoutes);
app.use('/api/telluswho', isLoggedIn, scientificRoutes);
app.use('/api/telluswho', isLoggedIn, basicInfoRoutes);
app.use('/api/telluswho', isLoggedIn, interestRoutes);
app.use('/api/telluswho/admin', isLoggedIn, adminRoutes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    return res.status(404).send({status: 404, message: "Route not found!"});
    //next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    return res.status(err.status || 500).send({status: err.status || 500, message: "Server Error! Try again later"});
    //res.render('error');
});

module.exports = app;
