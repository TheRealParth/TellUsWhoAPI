var express = require('express');
var router = express.Router();
var Promise = require('bluebird');

var User = require('../../models/user.js');
var Profile = require('../../models/telluswho/profile.js');
var BackgroundInfo = require('../../models/telluswho/backgroundInfo.js')
var SchoolAndWork = require('../../models/telluswho/schoolAndWork.js')
var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";

var ADDRESS = "http://" + addr + ":" + port;

module.exports = function (passport) {

    router.post('/backgroundInfo', function (req, res) {

        var userId = req.user.id;
        var profileId = req.user.profileId;

        var dob = req.body.dob;
        var gender = req.body.gender;
        var nationality = req.body.nationality;
        var nativeLanguage = req.body.nativeLanguage;
        var otherLanguages = req.body.otherLanguages;
        var sexualIdentification = req.body.sexualIdentification;
        var relationshipStatus = req.body.relationshipStatus;
        var currentCountry = req.body.currentCountry;
        var currentCity = req.body.currentCity;
        var currentState = req.body.currentState;
        var grownCountry = req.body.grownCountry;
        var grownCity = req.body.grownCity;
        var grownState = req.body.grownState;
        var liveWith = req.body.liveWith;
        var onCampus = req.body.onCampus;
        var campusHousing = req.body.campusHousing;
        var grownNonUSA = req.body.grownNonUSA;
        var lengthOfStayInUSA = req.body.lengthOfStayInUSA;

        if (!onCampus) return res.status(400).send({status: 400, message: "Missing field onCampus"});
        if (!dob) return res.status(400).send({status: 400, message: "Missing field DOB"});
        if (!gender) return res.status(400).send({status: 400, message: "Missing field gender"});
        if (!nationality.length) return res.status(400).send({status: 400, message: "Missing field nationality"});
        if (!nativeLanguage) return res.status(400).send({status: 400, message: "Missing field nativeLanguage"});
        if (!sexualIdentification) return res.status(400).send({
            status: 400,
            message: "Missing field sexualIdentification"
        });
        if (!relationshipStatus) return res.status(400).send({
            status: 400,
            message: "Missing field relationshipStatus"
        });
        if ((onCampus == 2) && !currentCountry) return res.status(400).send({
            status: 400,
            message: "Missing field currentCountry"
        });
        if ((onCampus == 2) && !currentCity) return res.status(400).send({
            status: 400,
            message: "Missing field currentCity"
        });
        if ((onCampus == 2) && !currentState) return res.status(400).send({
            status: 400,
            message: "Missing field currentState"
        });
        if (!grownCountry && !grownNonUSA) return res.status(400).send({status: 400, message: "Missing fields for where you were grown"});
        if (!grownCity && !grownNonUSA) return res.status(400).send({status: 400, message: "Missing fields for where you were grown"});
        if (!grownState && !grownNonUSA) return res.status(400).send({status: 400, message: "Missing fields for where you were grown"});
        if (!liveWith) return res.status(400).send({status: 400, message: "Missing field liveWith"});
        if ((onCampus == 1) && !campusHousing) return res.status(400).send({
            status: 400,
            message: "Missing field campusHousing"
        });

        Profile.get(profileId).getJoin({
            wellbeing: true,
            sociability: true,
            senseOfCommunity: true,
            backgroundInfo: true,
            schoolAndWork:true,
            interests: {places: true}
        }).run().then(pro => {

            new BackgroundInfo({
                dob: new Date(dob),
                gender: gender,
                nationality: nationality,
                nativeLanguage: nativeLanguage,
                otherLanguages: otherLanguages,
                sexualIdentification: sexualIdentification,
                relationshipStatus: relationshipStatus,
                currentCountry: currentCountry,
                currentCity: currentCity,
                currentState: currentState,
                grownCountry: grownCountry,
                grownCity: grownCity,
                grownState: grownState,
                liveWith: liveWith,
                onCampus: onCampus,
                grownNonUSA: grownNonUSA,
                lengthOfStayInUSA: lengthOfStayInUSA,
                campusHousing: campusHousing,
                createdBy: userId
            }).save().then(bginfo => {
              if(!pro.backgroundInfoId){
                pro.backgroundInfoId = bginfo.id;
                pro.save();
              }
                pro.backgroundInfo = bginfo;
                return res.status(202).send({status: 202, message: "Created successfully.",  profile: pro, backgroundInfo: bginfo})
            })
        }).error((err) => {
            return res.status(500).send({status: 500, message: err})
        })

    });

    router.post('/schoolAndWork', function (req, res) {

        var userId = req.user.id;
        var profileId = req.user.profileId;

        var organizations = req.body.organizations ? req.body.organizations : [];
        var internationalStudentStatus = req.body.internationalStudentStatus;
        var majors = req.body.majors;
        var graduate = req.body.graduate;
        var studentType = req.body.studentType;
        var doesWork = req.body.doesWork;
        var doesVolunteer = req.body.doesVolunteer;
        var workField = req.body.workField;
        var workPlace = req.body.workPlace;
        var volunteerField = req.body.volunteerField;
        var volunteerPlace = req.body.volunteerPlace;
        var firstYear = req.body.firstYear;
        var lengthOfStayAtNJIT = req.body.lengthOfStayAtNJIT;

        if (!majors) return res.status(400).send({status: 400, message: "Missing field majors"});

        if (!graduate) return res.status(400).send({status: 400, message: "Missing field graduate"});
        if (!studentType)  return res.status(400).send({status: 400, message: "Missing field studentType"});
        if (!doesWork) doesWork = 2;
        if (!doesVolunteer) doesVolunteer = 2;
        if ((doesWork == 1) && !workField) return res.status(400).send({status: 400, message: "Missing field workField"});
        if ((doesWork == 1) && !workPlace) return res.status(400).send({status: 400, message: "Missing field workPlace"});
        if ((doesVolunteer == 1) && !volunteerField) return res.status(400).send({
            status: 400,
            message: "Missing field volunteerField"
        });
        if ((doesVolunteer == 1) && !volunteerPlace) return res.status(400).send({
            status: 400,
            message: "Missing field volunteerPlace"
        });
        if (graduate == 2 && !firstYear) return res.status(400).send({status: 400, message: "Missing field firstYear"});
        if (graduate == 1 && !lengthOfStayAtNJIT) return res.status(400).send({status: 400, message: "Missing Length of Stay At NJIT"})

        if(graduate == 1){
            firstYear = null
        }

        Profile.get(profileId).getJoin({wellbeing: true, sociability: true, senseOfCommunity: true,  backgroundInfo: true, schoolAndWork:true, interests: true}).then(profile => {
            new SchoolAndWork({
                organizations: organizations,
                internationalStudentStatus: internationalStudentStatus,
                majors: majors,
                graduate: graduate,
                studentType: studentType,
                doesWork: doesWork,
                doesVolunteer: doesVolunteer,
                workField: workField,
                workPlace: workPlace,
                volunteerField: volunteerField,
                volunteerPlace: volunteerPlace,
                firstYear: firstYear,
                lengthOfStayAtNJIT: lengthOfStayAtNJIT,
                createdBy: userId
            }).save().then(saw => {
              if(!profile.schoolAndWorkId){
                profile.schoolAndWorkId = saw.id;
                profile.save();
              }
                return res.status(202).send({status: 202, message: "Created successfully.", profile: profile, schoolAndWork: saw})
            }).error((err) => {
                return res.status(500).send({status: 500, message: err})
            })
        })

    });
    return router;
};
