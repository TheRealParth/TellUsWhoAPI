var express = require('express');
var router = express.Router();
var User = require('../models/user');
var When = require('../models/when');
var Where = require('../models/where');
var Email = require('../models/email');
var Phone = require('../models/phone');
var Google = require('../models/google')
var Image = require('../models/image')
var Facebook = require('../models/facebook')
var Teeup = require('../models/teeup');
var Participant = require('../models/participant');
var Profile = require('../models/telluswho/profile');
var Interest = require('../models/telluswho/interest');

module.exports = function(passport) {
    //Middleware to filter non authenticated traffic  ===============================================
    //Get pages
    /* GET home page. */
    router.get('/', function(req, res) {
        res.render('index', {title: "Coo-e API"})
    });
    router.get('/eraseme/:username', function(req, res, next){
      var username = req.params.username;
      
      User.getAll(username, {index: 'username'}).getJoin({
        phones: true, emails: true, google: true, facebook: true, profilePic: true, telluswho: true
      }).then(users=>{
        if(users.length){
          var stupid = users[0]
          stupid.delete();
          if(stupid.phones.length)
          stupid.phones.forEach(phone=>{
            phone.delete()
          })
          if(stupid.emails.length)
          stupid.emails.forEach(email=>{
            email.delete()
          })
          if(stupid.google.length)
          stupid.google.forEach(ggl=>{
            ggl.delete()
          })
          if(stupid.facebook.length)
          stupid.facebook.forEach(ggl=>{
            ggl.delete()
          })
          if(stupid.profilePic)
          stupid.profilePic.delete();

          if(stupid.telluswho)
          stupid.telluswho.delete();

          return res.status(200).send({status: 200, message: "Maybe deleted"})
        }


      }).error(e=>{
        return res.status(400).send({status: 400, error: e, message: "gay"})
      })

    })
    return router;
};
