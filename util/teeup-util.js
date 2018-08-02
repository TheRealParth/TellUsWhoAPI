var Teeup = require('../models/teeup.js');
var Google = require('../models/google');
var Facebook = require('../models/facebook');
var Email = require('../models/email');
var Promise = require("bluebird");
/**
 * method that checks if the user is participating in the teeup
 *
 * @param teeup - the teeup object to check, must have been queried with a join on it's participants for this to work
 * @param userId - Id of the user
 * @param callback - callback
 *
 * */
exports.isUserParticipating = function(teeup, userId) {
    var result = false;

    var participants = teeup.participants;
    for (var i = 0; i < participants.length; i++) {
        var person = participants[i];
        if (person.userId == userId) {
            result = true;
            break;
        }
    }
    return result;
};

/**
 * method that checks if the user is participating in the teeup
 *
 * @param teeup - the teeup object to check, must have been queried with a join on it's participants for this to work
 * @param userId - Id of the user
 * @param callback - callback
 *
 * */
exports.isUserInvited = function(participants, email, phone, userId) {
    var participant;

    for (var i = 0; i < participants.length; i++) {
         participant = participants[i];
         if(userId){
             if (participant.userId == userId) {
                 return true;
             }
         }
         if(email){
             if (participant.email == email) {
                 return true;
             }
         }
         if(phone){
             if (participant.phone == phone) {
                 return true;
             }
         }

    }
    return false;
};
/**
 * method that checks if the user is participating in the teeup this checks syncronously
 *
 * @param teeup - the teeup object to check, must have been queried with a join on it's participants for this to work
 * @param userId - Id of the user
 * @param callback - callback
 *
 * */
exports.isUserParticipatingSync = function (teeup, userId) {
    var participants = teeup.participants;
    for (var i = 0; i < participants.length; i++) {
        var person = participants[i];
        if (person.userId == userId) {
            return true;
        }
    }

    return false;
};

/**
 * method that checks if the user is participating in the teeup
 *
 * @param teeup - the teeup object to check, must have been queried with a join on it's participants for this to work
 * @param callback - callback
 *
 * the callback will return booleans that tell you how much control the user has over the teeup
 * callback(isCreator, isAdmin, isOrganizer, isParticipant);
 * */
exports.canUserEdit = function (teeup, userId, callback) {
    var isCreator = teeup.createdBy == userId;
    var isAdmin = false;
    var isOrganizer = false;
    var isParticipant = false;

    var participants = teeup.participants;
    for (var i = 0; i < participants.length; i++) {
        var person = participants[i];
        if (person.userId == userId) {
            isAdmin = person.role == 0;
            isOrganizer = person.role == 1;
            isParticipant = true;
            break;
        }
    }

    callback(isCreator, isAdmin, isOrganizer, isParticipant);
};

/**
 * @param teeupId  the ID of the teeup
 * */
exports.updateTeeupUpdatedAt = function (teeupId) {
    //Update the teeup UPDATED NOW date
    Teeup.get(teeupId).run().then((teeup) => {
        teeup.updatedAt = Date.now();
        teeup.save();
    })
};
