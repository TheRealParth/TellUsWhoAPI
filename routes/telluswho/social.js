var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var User = require('../../models/user.js');
var Place = require('../../models/telluswho/place');
var Interest = require('../../models/telluswho/interest.js');
var Contact = require('../../models/contact.js');
var Profile = require('../../models/telluswho/profile.js')
var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";

var ADDRESS = "http://" + addr + ":" + port;

module.exports = function (passport) {
    router.post('/updateContact', (req, res) => {
      var newContact = req.body.contact;

      Contact.get(newContact.id).then((contact)=> {
        contact.positions = newContact.positions;
        contact.tags = newContact.tags;
        contact.close = newContact.close;
        contact.meet = newContact.meet;
        contact.known = newContact.known;
        contact.communication = newContact.communication;
        contact.country = newContact.country;
        contact.language = newContact.language;
        contact.gender = newContact.gender;
        contact.major = newContact.major;
        contact.technology = newContact.technology;
        contact.introducedBySomeone = newContact.introducedBySomeone;
        contact.groups = newContact.groups;
        contact.supportFriend = newContact.supportFriend;
        contact.notFacebookFriend = newContact.notFacebookFriend;
        contact.emergencyFriend = newContact.emergencyFriend;
        contact.save().then((contact)=>{
            return res.status(200).send({status: 200, message: "success"})
        })
      })
    })

    router.post('/uploadTags', (req, res) => {
      var tags = req.body.tags;
      var profileId = req.user.profileId;

      Profile.get(profileId).then((profile)=>{
        if(profile.hasTags) return res.status(200).send({status: 200, message: "Already uploaded tags", tags: profile.tags})
        profile.tags = tags;
        profile.hasTags = true;
        profile.save().then((profile) => {
          return res.status(200).send({status: 200, message: "uploaded tags successfully", tags: profile.tags})
        })
      })
    })

    router.post('/uploadTag', (req, res) => {
      var tag = req.body.tag;
      var profileId = req.user.profileId;

      Profile.get(profileId).then((profile)=>{
        profile.tags.push(tag)
        profile.save().then((profile) => {
          return res.status(200).send({status: 200, message: "uploaded tags successfully", tags: profile.tags})
        })
      })
    })
    router.post('/uploadGroups', (req, res) => {
      var groups = req.body.groups;
      var profileId = req.user.profileId;

      Profile.get(profileId).then((profile)=>{
        profile.groups = groups
        profile.save().then((profile) => {
          return res.status(200).send({status: 200, message: "uploaded groups successfully", groups: profile.groups})
        })
      })
    })
    router.post('/setTagsQuestionsProgress', (req, res)=>{
      var newProgress = req.body.progress;
      var profileId = req.user.profileId;

      Profile.get(profileId).then((profile)=>{
        profile.tagsQuestionsProgress = newProgress
        profile.save().then((profile) => {
          return res.status(200).send({status: 200, message: "uploaded tags successfully", progress: profile.tagsQuestionsProgress})
        })
      })
    })
    router.post('/setBucketQuestionsProgress', (req, res)=>{
      var newProgress = req.body.progress;
      var profileId = req.user.profileId;

      Profile.get(profileId).then((profile)=>{
        profile.bucketQuestionsProgress = newProgress
        profile.save().then((profile) => {
          return res.status(200).send({status: 200, message: "updated successfully", progress: profile.bucketQuestionsProgress})
        })
      })
    })
    router.post('/setSelectContactsProgress', (req, res)=>{
      var newProgress = req.body.progress;
      var profileId = req.user.profileId;

      Profile.get(profileId).then((profile)=>{
        profile.selectContactsProgress = newProgress
        profile.save().then((profile) => {
          return res.status(200).send({status: 200, message: "updated successfully", progress: profile.selectContactsProgress})
        })
      })
    })

    router.get('/setDone/:type', (req, res) => {
      var type = req.params.type;
      var profileId = req.user.profileId;
      if(!type) return res.status(400).send({status: 400, message: "No type param provided"})
      Profile.get(profileId).then((profile)=>{
        if(type == "groupContacts") {
          profile.doneGroupContacts = true;
        } else if(type == "sortContacts") {
          profile.doneSortContacts = true;
        } else if(type == "tagsQuestions") {
          profile.doneTagsQuestions = true;
        } else if(type == "bucketQuestions") {
          profile.doneBucketQuestions = true;
        } else if(type == "selectContacts") {
          profile.doneSelectContacts = true;
        } else if(type == "social") {
          profile.doneSocial = true;
        }
        profile.save().then((profile)=> {
          return res.status(200).send({status: 200, message: "Success"})
        })
      })
    })

    return router;
};
