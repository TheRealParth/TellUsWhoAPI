var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var User = require('../../models/user.js');
var Place = require('../../models/telluswho/place');
var Interest = require('../../models/telluswho/interest.js');
var Profile = require('../../models/telluswho/profile.js');
var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";

var ADDRESS = "http://" + addr + ":" + port;

module.exports = function (passport) {

    router.post('/interests', function(req, res){
      var userId = req.user.id;
      var profileId = req.user.profileId;
      var interests = req.body.interests;

      if(!profileId) return res.status(400).send({status: 400, message: "No profile is set."});
      if(!interests) return res.status(400).send({status: 400, message: "No interests posted."});
      if(!interests.length) return res.status(400).send({status: 400, message: "Need at least one interest posted."});
      var interestsToSave = []
      var alreadySaved = []
      interests.forEach((interest)=>{
        if(!interest.category || !interest.subcategory || !interest.value){
            return res.status(400).send({status: 400, message: "Missing category, value, or subcategory"});
        }
        interest.value.forEach((val)=>{
          if(alreadySaved.indexOf(val) == -1){
            var currInterest = new Interest({
              title: val,
              category: interest.category,
              subcategory: interest.subcategory,
              createdBy: userId,
              profileId: profileId
            }).save();
            interestsToSave.push(
              Promise.resolve(currInterest)
            )
            alreadySaved.push(val)
          }
        })


      });
      Promise.all(interestsToSave).then(savedInterests=>{
        Profile.get(profileId).then(profile=>{
          profile.hasInterests = true;
          profile.save();
          return res.status(200).send({status: 200, message: "Saved successfully", interests: savedInterests});
        }).error((e)=>{
          return res.status(400).send({status: 400, message: "error saving", e: e})
        })
      }).error((e)=>{
        return res.status(400).send({status: 400, message: "error saving", e: e})
      })
    })

    router.post('/places', function(req, res){
        var userId = req.user.id;
        var profileId = req.user.profileId;
        var interests = req.body.interests;

        if(!profileId) return res.status(400).send({status: 400, message: "No profile is set."});
        if(!interests) return res.status(400).send({status: 400, message: "No interests posted."});

        var placesToSave = [];
        var isPlaceMissing = false;
        interests.forEach((interest)=>{
            if(!interest.places || !interest.places.length){
                isPlaceMissing = true;
            }
            interest.places.forEach((place)=>{
                if(!place.placesId || !place.fullAddress || !place.locationName) isPlaceMissing = true;
            })
            if(!isPlaceMissing){
              interest.places.forEach((place)=>{
                  placesToSave.push(Promise.resolve(new Place({
                      placesId: place.placesId,
                      fullAddress: place.fullAddress,
                      locationName: place.locationName,
                      interestId: interest.id,
                      createdBy: userId
                  }).save()))
              })
            }

        })

        if(isPlaceMissing) return res.status(400).send({status: 400, message: "Missing places for an interest"})

        Promise.all(placesToSave).then(savedPlaces=>{
            Interest.getAll(profileId, {index: 'profileId'}).getJoin({places: true}).then((interests)=>{
              Profile.get(profileId).getJoin({wellbeing: true, sociability: true, senseOfCommunity: true,  backgroundInfo: true, schoolAndWork:true, interests: {places: true}}).then((profile)=>{
                  profile.hasPlaces = true;
                  profile.save();
                  return res.status(200).send({status: 200, message: "Saved successfully", profile: profile, interests: interests});
                })
            }).catch((e)=>{
                return res.status(400).send({status: 400, message: "Failed to fetch interests"});
            })

        }).catch((e)=>{
            return res.status(400).send({status: 400, message: "error saving", e: e})
        })
    })

    //Using one endpoint for 5 different pages ;)
    router.post('/levels/:type', function(req,res){
        var profileId = req.user.profileId;
        var interests = req.body.interests;
        var type = req.params.type;
        var userId = req.user.id;

        var allowedTypes = ["levelOfPassion", "methodInGroup", "levelOfExpertise", "willingToTeach", "willingToBeTaught", "doingInGroup", "lookingForOthers"];

        if(!type) return res.status(400).send({status: 400, message: "Invalid endpoint, level type is required"});
        if(!profileId) return res.status(400).send({status: 400, message: "No profile is set."});
        if(!interests) return res.status(400).send({status: 400, message: "No interests posted."});

        if(allowedTypes.indexOf(type) == -1){
            return res.status(400).send({status: 400, message: "Type parameter is invalid."});
        }

        Profile.get(profileId).getJoin({interests: true}).then((profile)=>{
            profile.interests = interests;

            switch(type){
              case "levelOfPassion":
                profile.hasPassion = true;
              break;
              case "methodInGroup":
                profile.hasGroupMethod = true;
              break;
              case "levelOfExpertise":
                profile.hasExpertise = true;
              break;
              case "willingToTeach":
                profile.hasTeach = true;
              break;
              case "willingToBeTaught":
                profile.hasTaught = true;
              break;
              case "doingInGroup":
                profile.hasGroup = true;
              break;
              case "lookingForOthers":
                profile.hasOthers = true;
              break;
            }
          Interest.save(profile.interests, {conflict: 'replace'}).then(things=>{
              profile.save();
              profile.interests = things;
              return res.status(200).send({status: 200, message: "Successfully updated interests", profile: profile,  interests: things})
          })
        }).catch(e=>{
          return res.status(400).send({status: 400, error: e, message: "Failed to fetch profile"});
        })
    })


    return router;
};
