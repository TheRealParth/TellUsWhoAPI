var express = require('express');
var router = express.Router();
var Promise = require('bluebird');

var User = require('../../models/user.js');
var Profile = require('../../models/telluswho/profile.js');
var Contact = require('../../models/contact.js');
var SenseOfCommunity = require('../../models/telluswho/senseOfCommunity.js');
var BackgroundInfo = require('../../models/telluswho/backgroundInfo.js');
var SchoolAndWork = require('../../models/telluswho/schoolAndWork.js');
var Sociability = require('../../models/telluswho/sociability.js');
var Wellbeing = require('../../models/telluswho/wellbeing.js');
var Image = require('../../models/image.js');
var Interest = require('../../models/telluswho/interest.js')
var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";
var authUtil = require('../../util/auth-util');
var helpers = require('./helpers.js')
var _ = require('lodash');
var ADDRESS = "http://" + addr + ":" + port;

module.exports = function (passport) {

    router.get('/', function(req, res){
      var userEmail = req.user.primaryEmailId
      var adminEmails = ['qgjones@gmail.com', 'sz255@njit.edu', 'psyrotix@gmail.com', 'deep7176@gmail.com', 'harirao3@gmail.com', 'danielletavella@gmail.com', 'dougzytko@gmail.com'];

      if(!_.includes(adminEmails, userEmail)) return res.status(400).send({status: 400, message: "You must be an ADMIN to access this"});

      User.filter({}).getJoin({emails: true, phones: true}).then((users)=>{

          var tempUsers = _.keyBy(users, 'id');
          Profile.filter({}).getJoin({
            wellbeing: true,
            sociability: true,
            senseOfCommunity: true,
            backgroundInfo: true,
            schoolAndWork:true,
            interests: {
                places: true
              }
            }).then((profiles)=>{
              profiles.forEach((pro)=>{
                if(pro && tempUsers[pro.userId]) {
                  tempUsers[pro.userId].profile = pro;
                  tempUsers[pro.userId].hasContactOnDesktop = false
                  tempUsers[pro.userId].contacts=[]
                }
              })
              Contact.filter({}).then((contacts)=>{

                var l = contacts.length;
                for(var i = 0; i < l; i++){
                  if(contacts[i].positions.length){
                    if(tempUsers[contacts[i].createdBy]) {
                      tempUsers[contacts[i].createdBy].hasContactOnDesktop = true
                      tempUsers[contacts[i].createdBy].contacts.push(contacts[i])
                    }
                  }
                }
                return res.status(200).send({status: 200, message: "success", users: tempUsers})
              })
            })
      }).error((err)=>{
        return res.status(500).send({status: 500, message: err})
      })
    })

    return router;
};
