var express = require('express');
var router = express.Router();
var Promise = require('bluebird');

var User = require('../../models/user.js');
var Profile = require('../../models/telluswho/profile.js');
var SenseOfCommunity = require('../../models/telluswho/senseOfCommunity.js');
var Sociability = require('../../models/telluswho/sociability.js');
var Wellbeing = require('../../models/telluswho/wellbeing.js');

var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";

var ADDRESS = "http://" + addr + ":" + port;

module.exports = function (passport) {

    router.post('/senseOfCommunity', function(req, res){
      var userId = req.user.id;

      var studentsCare = req.body.studentsCare;
      var facultyCare = req.body.facultyCare;
      var connected = req.body.connected;
      var community = req.body.community;
      var likeFamily = req.body.likeFamily;
      var isolated = req.body.isolated;
      var friendSupport = req.body.friendSupport;
      var satisfied = req.body.satisfied;
      var loan = req.body.loan;
      var advice = req.body.advice;

      if(!studentsCare) return res.status(400).send({status: 400, message: "Missing field studentsCare."})
      if(!facultyCare) return res.status(400).send({status: 400, message: "Missing field facultyCare."})
      if(!connected) return res.status(400).send({status: 400, message: "Missing field connected."})
      if(!community) return res.status(400).send({status: 400, message: "Missing field community."})
      if(!likeFamily) return res.status(400).send({status: 400, message: "Missing field likeFamily."})
      if(!isolated) return res.status(400).send({status: 400, message: "Missing field isolated."})
      if(!friendSupport) return res.status(400).send({status: 400, message: "Missing field friendSupport."})
      if(!satisfied) return res.status(400).send({status: 400, message: "Missing field satisfied."})
      if(!loan) return res.status(400).send({status: 400, message: "Missing field loan."})
      if(!advice) return res.status(400).send({status: 400, message: "Missing field advice."})

       function createNewSurvey(profile){

        var newObj = new SenseOfCommunity({
          studentsCare: studentsCare,
          facultyCare: facultyCare,
          connected: connected,
          community: community,
          likeFamily: likeFamily,
          isolated: isolated,
          friendSupport: friendSupport,
          satisfied: satisfied,
          loan: loan,
          advice: advice,
          createdBy: userId
        });

        if(profile) {

          newObj.profileId = profile.id;
          newObj.save().then((soc)=>{
            profile.senseOfCommunityId = soc.id;
            profile.save().then(profile=>{
              profile.senseOfCommunity = soc;
              return res.status(200).send({status:200, message: "Success", profile: profile})
            })

          })
        } else {
          new Profile({
            userId: userId,
          }).save().then((profile)=>{


            User.get(req.user.id).then(user=>{
              user.profileId = profile.id;
              user.save()
            })
            newObj.profileId = profile.id;
            newObj.save().then((soc)=>{
              profile.senseOfCommunityId = soc.id;
              profile.save().then(profile=>{
                profile.senseOfCommunity = soc;
                return res.status(201).send({status:201, message: "Success", profile: profile})
              })
            })
          })
        }
      }

      Profile.getAll(userId, {index: 'userId'}).then((profile)=>{
        if(profile.length){
           createNewSurvey(profile[0])
         }else {
           createNewSurvey(false)
         }
      }).error((err)=>{

        return res.status(500).send({status: 500, message: err})
      })

    })
    router.post('/sociability', function(req, res){
      var userId = req.user.id;
      var profileId = req.user.profileId;

      var likePeople = req.body.likePeople;
      var mixSocially = req.body.mixSocially;
      var preferOthers = req.body.preferOthers;
      var peopleStimulating = req.body.peopleStimulating;
      var makingContacts = req.body.makingContacts;
      var sociallyAwkward = req.body.sociallyAwkward;
      var talkToStrangers = req.body.talkToStrangers;
      var tenseWithStrangers = req.body.tenseWithStrangers;
      var tenseWithPeople = req.body.tenseWithPeople;
      var nervousAuthority = req.body.nervousAuthority;
      var uncomfortableParties = req.body.uncomfortableParties;
      var oppositeSex = req.body.oppositeSex;

      if(!likePeople) return res.status(400).send({status: 400, message: "Missing field likePeople"});
      if(!mixSocially) return res.status(400).send({status: 400, message: "Missing field mixSocially"});
      if(!preferOthers) return res.status(400).send({status: 400, message: "Missing field preferOthers"});
      if(!peopleStimulating) return res.status(400).send({status: 400, message: "Missing field peopleStimulating"});
      if(!makingContacts) return res.status(400).send({status: 400, message: "Missing field makingContacts"});
      if(!sociallyAwkward) return res.status(400).send({status: 400, message: "Missing field sociallyAwkward"});
      if(!talkToStrangers) return res.status(400).send({status: 400, message: "Missing field talkToStrangers"});
      if(!tenseWithStrangers) return res.status(400).send({status: 400, message: "Missing field tenseWithStrangers"});
      if(!tenseWithPeople) return res.status(400).send({status: 400, message: "Missing field tenseWithPeople"});
      if(!nervousAuthority) return res.status(400).send({status: 400, message: "Missing field nervousAuthority"});
      if(!uncomfortableParties) return res.status(400).send({status: 400, message: "Missing field uncomfortableParties"});
      if(!oppositeSex) return res.status(400).send({status: 400, message: "Missing field oppositeSex"});

      if(!profileId) return res.status(400).send({status:400, message: "No telluswho profile found."})
      Profile.get(profileId).getJoin({wellbeing: true, sociability: true, senseOfCommunity: true,  backgroundInfo: true, schoolAndWork:true, interests: true}).then(profile=>{
        if(profile.sociabilityId){
          Sociability.get(profile.sociabilityId).then(soc=>{
            soc.likePeople = likePeople;
            soc.mixSocially = mixSocially;
            soc.preferOthers = preferOthers;
            soc.peopleStimulating = peopleStimulating;
            soc.makingContacts = makingContacts;
            soc.sociallyAwkward = sociallyAwkward;
            soc.talkToStrangers = talkToStrangers;
            soc.tenseWithStrangers = tenseWithStrangers;
            soc.tenseWithPeople = tenseWithPeople;
            soc.nervousAuthority = nervousAuthority;
            soc.uncomfortableParties = uncomfortableParties;
            soc.oppositeSex = oppositeSex;
            soc.save().then(soc=>{
              return res.status(200).send({status: 200, message: "Success", profile: profile, sociability: soc})
            })
          })
        } else {
          new Sociability({
            likePeople: likePeople,
            mixSocially: mixSocially,
            preferOthers: preferOthers,
            peopleStimulating: peopleStimulating,
            makingContacts: makingContacts,
            sociallyAwkward: sociallyAwkward,
            talkToStrangers: talkToStrangers,
            tenseWithStrangers: tenseWithStrangers,
            tenseWithPeople: tenseWithPeople,
            nervousAuthority: nervousAuthority,
            uncomfortableParties: uncomfortableParties,
            oppositeSex: oppositeSex,
            createdBy: userId
          }).save().then(soc=>{
            profile.sociabilityId = soc.id;
            profile.save().then(prof=>{
              return res.status(201).send({status: 201, message: "Success", sociability: soc})
            })
          })
        }
      })
    })
    router.post('/wellbeing', function(req, res){
      var userId = req.user.id;
      var profileId = req.user.profileId;

      var physicalHealth = req.body.physicalHealth;
      var happyAtNjit = req.body.happyAtNjit;
      var stayAtNjit = req.body.stayAtNjit;
      var lackCompanionShip = req.body.lackCompanionShip;
      var feelLeftOut = req.body.feelLeftOut;
      var feelIsolated = req.body.feelIsolated;
      var feelFailure = req.body.feelFailure;
      var highSelfEsteem = req.body.highSelfEsteem;
      var lifeIdeal = req.body.lifeIdeal;
      var lifeExcellent = req.body.lifeExcellent;
      var lifeSatisfied = req.body.lifeSatisfied;
      var doNotHaveProud = req.body.doNotHaveProud;

      if(!physicalHealth) return res.status(400).send({status: 400, message: "Missing field physicalHealth"});
      if(!happyAtNjit) return res.status(400).send({status: 400, message: "Missing field happyAtNjit"});
      if(!stayAtNjit) return res.status(400).send({status: 400, message: "Missing field stayAtNjit"});
      if(!lackCompanionShip) return res.status(400).send({status: 400, message: "Missing field lackCompanionShip"});
      if(!feelLeftOut) return res.status(400).send({status: 400, message: "Missing field feelLeftOut"});
      if(!feelIsolated) return res.status(400).send({status: 400, message: "Missing field feelIsolated"});
      if(!feelFailure) return res.status(400).send({status: 400, message: "Missing field feelFailure"});
      if(!highSelfEsteem) return res.status(400).send({status: 400, message: "Missing field highSelfEsteem"});
      if(!lifeIdeal) return res.status(400).send({status: 400, message: "Missing field lifeIdeal"});
      if(!lifeExcellent) return res.status(400).send({status: 400, message: "Missing field lifeExcellent"});
      if(!lifeSatisfied) return res.status(400).send({status: 400, message: "Missing field lifeSatisfied"});
      if(!doNotHaveProud) return res.status(400).send({status: 400, message: "Missing field doNotHaveProud"});

      if(!profileId) return res.status(400).send({status:400, message: "No telluswho profile found."})

      Profile.get(profileId).then(profile=>{
        if(profile.wellbeingId){
          Wellbeing.get(profile.wellbeingId).then(well=>{

            well.physicalHealth = physicalHealth;
            well.happyAtNjit = happyAtNjit;
            well.stayAtNjit = stayAtNjit;
            well.lackCompanionShip = lackCompanionShip;
            well.feelLeftOut = feelLeftOut;
            well.feelIsolated = feelIsolated;
            well.feelFailure = feelFailure;
            well.highSelfEsteem = highSelfEsteem;
            well.lifeIdeal = lifeIdeal;
            well.lifeExcellent = lifeExcellent;
            well.lifeSatisfied = lifeSatisfied;
            well.doNotHaveProud = doNotHaveProud;

            well.save().then(well=>{
              return res.status(200).send({status: 200, message: "Success", wellbeing: well})
            })
          })
        } else {
          new Wellbeing({
            physicalHealth: physicalHealth,
            happyAtNjit: happyAtNjit,
            stayAtNjit: stayAtNjit,
            lackCompanionShip: lackCompanionShip,
            feelLeftOut: feelLeftOut,
            feelIsolated: feelIsolated,
            feelFailure: feelFailure,
            highSelfEsteem: highSelfEsteem,
            lifeIdeal: lifeIdeal,
            lifeExcellent: lifeExcellent,
            lifeSatisfied: lifeSatisfied,
            doNotHaveProud: doNotHaveProud,
            createdBy: userId
          }).save().then(well=>{
            profile.wellbeingId = well.id;
            profile.save().then(prof=>{
              return res.status(201).send({status: 201, message: "Success", wellbeing: well})
            })
          })
        }
      })
    })

    return router;
};
