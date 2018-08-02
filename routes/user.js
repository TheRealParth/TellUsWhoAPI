var User = require('../models/user');
var Email = require('../models/email');
var Phone = require('../models/phone');
var express = require('express');
var router = express.Router();
var Image = require('../models/image.js');
var Google = require('../models/google')
var Facebook = require('../models/facebook');
var teeupUtil = require('../util/teeup-util');
module.exports = function (passport) {

    /**
     * gets the user's profile page
     * */
    router.get('/profile', function (req, res) {
        var userId = req.user.id;
        User.get(userId).getJoin({email: true}).run().then(function (user) {
            if (user) {
                //get the email because joining fucks everything up...
                //Parth sucks
                delete user.password;
                Email.filter({userId: userId}).run().then(function (emails) {
                    user.email = emails[0];
                    return res.status(200).send({status: 200, profile: user});
                });
            } else {
                return res.status(400).send({status: 400, message: "error getting profile"});
            }
        });
    });
    router.post('/addGoogle', function(req, res){
        var email = req.body.email;
        var userId = req.user.id;
        var token = req.body.token;
        if(!token || !email) return res.status(400).send({status: 400, message: "Missing email or token"})


        Email.get(email).then((email)=>{
          if(email.userId && (email.userId != userId))
            return res.status(400).send({status:400, message: "Email already in use by another user."})
          else return teeupUtil.makeGoogle();
        }).catch(Errors.DocumentNotFound, (err)=>{
          return teeupUtil.makeGoogle();
        })
    })

    router.post('/addFacebook', function(req, res){
        var email = req.body.email;
        var userId = req.user.id;
        var token = req.body.token;
        if(!token || !email) return res.status(400).send({status: 400, message: "Missing email or token"})


        Email.get(email).then((email)=>{
          if(email.userId && (email.userId != userId))
            return res.status(400).send({status:400, message: "Email already in use by another user."})
          else  return teeupUtil.makeFacebook();
        }).catch(Errors.DocumentNotFound, (err)=>{
          return teeupUtil.makeFacebook();
        })
    })
    router.post('/addEmail', function(req,res){
        var email = req.body.email;
        var userId = req.user.id;
        if(!email) return res.status(400).send({status: 400, message: "Missing email"})


        Email.get(email).then((email)=>{
          if(email.userId && (email.userId != userId))
            return res.status(400).send({status:400, message: "Email already in use by another user."})
          else return teeupUtil.makeEmail(email, userId);
        }).catch(Errors.DocumentNotFound, (err)=>{
          return teeupUtil.makeEmail(email, userId);
        })
    })
    router.post('/addPhone', function(req,res){
        var phone = req.body.phone;
        var userId = req.user.id;
        if(!phone) return res.status(400).send({status: 400, message: "Missing phone"})

        var makePhone = function(){
          new Phone({
            id: phone,
            userId: userId,
            createdBy: userId
          }).save().then((thing)=>{
              return res.status(200).send({status:200, message: "Phone added successfully"})
          })
        }

        Phone.get(phone).then((phone)=>{
          if(phone.userId && (phone.userId != userId))
            return res.status(400).send({status: 400, message: "Phone already in use by another user."})
          else return makePhone();
        }).catch(Errors.DocumentNotFound, (err)=>{
          return makePhone();
        })

    })
    /**
     * Get user information about a user (filtered by privacy)
     */
    router.get('/:userId', function (req, res) {
        var userId = req.params.userId;

        if (!userId) {
            return res.status(400).send({status: 400, message: "Please specify a user id."});
        }

        User.get(userId).run().then(function (user) {
            if (!user) {
                return res.status(404).send({status: 404, message: "User not found"});
            }
            //return res.status(200).send({status: 200, user: user});

            delete user.password;
            delete user.hasCompletedSurvey;
            delete user.forgotExpires;
            delete user.forgotCode;
            delete user.privacy;
            //delete user.profile;
            delete user.tellUsWho;
            delete user.settings;

            return res.status(200).send({status: 200, user: user});
        });
    });

    /**
     * Get a user's profile picture
     */
    router.get('/:userId/profilePic', function (req, res) {
        var userId = req.params.userId;

        if (!userId) {
            return res.status(400).send({status: 400, message: "Please specify a user id."});
        }

        User.get(userId).run().then(function (user) {
            if (!user) {
                return res.status(404).send({status: 404, message: "User not found"});
            }
            var picId = user.profilePicId;
            if (!picId) {
                return res.status(200).send({status: 200, message: "User doesn't have a profile picture."});
            }
            Image.get(picId).run().then((image) => {
                return res.status(200).send({status: 200, image: image});
            }).error(() => {
                return res.status(400).send({status: 400, message: "Error getting profile picture."});
            })
        }).error(() => {
            return res.status(404).send({status: 404, message: "User not found"});
        });
    });
    /**
     * update apns token
     */

    /**
     * Update user (self only)
     */
    router.put('/:id', function (req, res) {

    });

    /**
     * Search user?
     */
    router.get('/find/:search', function (req, res) {

    });

    //TODO change user privacy settings

    //TODO change user personal info

    //TODO change user profile info
    return router;
};
