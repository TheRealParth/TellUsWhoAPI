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
var ADDRESS = "http://" + addr + ":" + port;

module.exports = function (passport) {

    router.get('/', function(req, res){
      var userId = req.user.id;
      var profileId = req.user.profileId;

      if(!profileId) return res.status(400).send({status: 400, message: "No tell us who data found."})

      Profile.get(profileId).getJoin({wellbeing: true, sociability: true, senseOfCommunity: true,  backgroundInfo: true, schoolAndWork:true, interests: {places: true}}).run().then((profile)=>{

        if(profile){
            User.getAll(profile.userId).getJoin({phones:true, contacts: true, emails: true}).then((users)=>{
              if(users[0].hasContacts){
                Contact.filter({createdBy: users[0].id}).getJoin({interests: true}).run().then((contacts)=>{
                    return res.status(200).send({status: 200, message: "Successful",contacts: contacts, profile: profile, user: authUtil.viewableUser(users[0])})
                })
              }else {
                return res.status(200).send({status: 200, message: "Successful", profile: profile, user: authUtil.viewableUser(users[0])})
              }

            })

        } else {
          return res.status(400).send({status: 400, message: "You currently have not started the survey."})
        }
      }).error((err)=>{
        return res.status(500).send({status: 500, message: err})
      })
    })

    router.post('/profileReview', function(req,res){
      var userId = req.user.id;
      var user = req.user
      var profileId = req.user.profileId;
      var backgroundInfo = req.body.backgroundInfo;
      var schoolAndWork = req.body.schoolAndWork;
      var interests = req.body.interests;
      //
      if(!profileId) return res.status(400).send({status: 400, message: "No tell us who data found."})

      var profilePic = req.body.profilePic ? req.body.profilePic : false;

      var swCheck = helpers.schoolAndWorkCheck(schoolAndWork);
      var bgCheck = helpers.backgroundInfoCheck(backgroundInfo);
      var intrCheck = helpers.interestsCheck(interests);

      if(swCheck) return res.status(swCheck.status).send(swCheck);
      if(bgCheck) return res.status(bgCheck.status).send(bgCheck);
      if(intrCheck) return res.status(intrCheck.status).send(intrCheck);

      var thingsToSave = [];

      if(profilePic){
        thingsToSave.push(new Image({
          imageData: profilePic.imageData,
          type: profilePic.type,
          height: profilePic.height,
          width: profilePic.width
        }).save())
      }

      Profile.get(profileId).getJoin({wellbeing: true, sociability: true, senseOfCommunity: true,  backgroundInfo: true, schoolAndWork:true, interests: {places: true}})
        .then((profile)=>{
          if(profile.backgroundInfo.id != backgroundInfo.id) return res.status(400).send({status: 400, message: "Non matching objects"})
          if(profile.schoolAndWork.id != schoolAndWork.id) return res.status(400).send({status: 400, message: "Non matching objects"})

          thingsToSave.push(BackgroundInfo.get(backgroundInfo.id).update(backgroundInfo).run())
          thingsToSave.push(SchoolAndWork.get(schoolAndWork.id).update(schoolAndWork).run())

          interests.forEach((interest)=>{
            if(interest.id == undefined){
              thingsToSave.push(new Interest({
                  title: interest.category,
                  category: interest.category,
                  subcategory: '',
                  createdBy: userId,
                  profileId: profileId
                }).save());
            }
            else {
              thingsToSave.push(Interest.get(interest.id).update(interest).run())
            }
          });

          profile.hasReviewedProfile = true;
          profile.save().then(profile=>{
              Promise.all(thingsToSave).then((things)=>{
                things.forEach((thing)=>{
                  if(Image === thing.getModel()){
                    user.profilePicId = thing.id;
                    user.save();
                  } else if (BackgroundInfo === thing.getModel()){
                    profile.backgroundInfo = thing;
                  } else if (schoolAndWork === thing.getModel()){
                    profile.schoolAndWork = thing;
                  } else if (Interest == thing.getModel()) {
                    profile.interest = thing;
                  }
                })
                if(profilePic) return res.status(200).send({status: 200, message: "Successful", profile: profile, profilePic: profilePic, user: authUtil.viewableUser(user)})
                else return res.status(200).send({status: 200, message: "Successful", profile: profile, user: authUtil.viewableUser(user)})
              }).error(e=>{
                  return res.status(400).send({status: 400, message: "No tell us who data found."})
              })

          }).error(e=>{
              return res.status(400).send({status: 400, message: "No tell us who data found."})
          })
        }).error(e=>{
            return res.status(400).send({status: 400, message: "No tell us who data found."})
        })
    })

    // RESET YOUR TELLUSWHO DATA
    router.get('/deleteMe', (req, res)=>{
      User.get(req.user.id).getJoin({
        phones: true,
        emails: true,
      }).then(user=>{
        Profile.filter({userId: user.id}).then((pro)=>{
          Contact.filter({userId: user.id}).then((cont)=>{
            cont.forEach((c)=>{
              c.delete();
            })
          })
            pro.forEach((p)=>{
              p.delete();
            })

            user.deleteAll().then(()=>{
              return res.send("Success")
            }).catch(e=>{
              ;
            })

        })

      }).error(e=>{
        ;
        return res.send("Failed to delete ur garbage. ")
      })
    })

    return router;
};
