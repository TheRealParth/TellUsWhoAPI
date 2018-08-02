var Google = require('../models/google');
var Facebook = require('../models/facebook');
var Email = require('../models/email');
var Participant = require('../models/participant');
var Phone = require('../models/phone');
var User = require('../models/user');
var thinky = require('../util/thinky.js');
var r = thinky.r;
var Promise = require('bluebird');

/**
 * method that adds the users facebook info to our database.
 *
 * @param token - the facebook auth token.
 * @param userId - Id of the user
 * @param email - User's facebook email
 *
 * */
exports.makeFacebook = function(token, userId, email){
    Facebook.get(token).then((facebook)=>{
        if(facebook.userId != userId){
            return res.status(400).send({status: 400, message: "Facebook account is already in use by another user."})
        } else {
            return res.status(200).send({status: 200, message: "You have already linked that account."})
        }
    }).catch(Errors.DocumentNotFound, function (err) {
        if(userId){
            new Facebook({
                id: token,
                userId: userId,
                email: email,
            }).save().then((facebook)=>{
               return res.status(200).send({status: 200, message: "Added Facebook profile successfully"})
            })
        }

    })
}


/**
 * method that checks if the user is participating in the teeup this checks syncronously
 *
 * @param teeup - the teeup object to check, must have been queried with a join on it's participants for this to work
 * @param userId - Id of the user
 * @param callback - callback
 *
 * */
exports.makeEmail = function(email, userId){
    new Email({
        id: email,
        userId: userId,
        createdBy: userId
    }).save().then((thing)=>{
        return res.status(200).send({status:200, message: "Email added successfully"})
    })
}

/**
 * method that checks if the user is participating in the teeup this checks syncronously
 *
 * @param teeup - the teeup object to check, must have been queried with a join on it's participants for this to work
 * @param userId - Id of the user
 * @param callback - callback
 *
 * */
exports.makeGoogle = function(token, userId, email){
    Google.get(token).then((google)=>{
        if(google.userId != userId){
            return res.status(400).send({status: 400, message: "Google account is already in use by another user."})
        }
    }).catch(Errors.DocumentNotFound, function (err) {
        new Google({
            id: token,
            userId: userId,
            email: email,
        }).save().then((google)=>{
            return res.status(200).send({status: 200, message: "Added google profile successfully."})
        })
    })
}
/**
 * Gets the phone object if it exists if not returns a new phone object
 *
 * @param phone - User's phone number
 * @param email - User's email
 * @param callback - callback
 *
 * */
exports.getEmailAndPhone = function(username, emails, phone, facebook, google) {
    var getPromises = [];
    getPromises.push(Promise.resolve(
        User.filter({
            username: username
        }).run())
    );
    getPromises.push(Promise.resolve(
        Email.getAll(r.args(emails), {index: 'id'}).run()
    ));
    getPromises.push(Promise.resolve(
        Phone.getAll(phone, {index: "id"}).run()
    ));
    getPromises.push(Promise.resolve(
        Facebook.filter((facebook)=>{
          return facebook("emails").contains(r.args(emails))
        }).run()
    ));
    getPromises.push(Promise.resolve(
        Google.filter((google)=>{
          return google("emails").contains(r.args(emails))
        }).run()
    ));
    if(facebook){
      getPromises.push(Promise.resolve(
          Facebook.getAll(facebook.id, {index: 'id'}).run()
      ));
    }
    if(google){
      getPromises.push(Promise.resolve(
          Google.getAll(google.id, {index: 'id'}).run()
      ));
    }

    return Promise.all(getPromises);
}

/**
 * Finds all the participant objects if they exit by emails and phones.
 *
 * @param emails - array of user's emails
 * @param phones - array of user's phone numbers
 * @param userId - id of user.
 *
 * */
exports.findMyTeeups = function(emails, phones, userId){
    //TODO: put this stuff in a job queue it should do this in the background
    //get participant objects with matching email or phone
    Promise.all(
        [Promise.resolve(Participant.getAll(r.args(emails), {index: "email"}).run()),
            Promise.resolve(Participant.getAll(r.args(phones), {index: "phone"}).run())]
    ).then((arrs)=>{
        var participantsToSave = [];
        arrs.forEach((arr)=>{
            arr.forEach((participant)=>{
                if(!participant.userId){
                    participant.userId = userId;
                    participantsToSave.push(participant.save());
                }
            })
        });
        if(participantsToSave.length) return Promise.all(participantsToSave);

        return Promise.resolve(()=>{return [];});
    });
}

/**
 * method that filters user information before sending it out
 *
 * */
exports.viewableUser = function(user){
    var phones = [];
    var emails = [];

    if(user.phones && user.phones.length){
      user.phones.forEach((phone)=>{
          phones.push({
              id: phone.id,
              isValidated: phone.isValidated,
              userId: phone.userId,
              createdAt: phone.createdAt,
          })
      })
    }
    if(user.emails && user.emails.length){
      user.emails.forEach((email)=>{
          emails.push({
              id: email.id,
              isValidated: email.isValidated,
              userId: email.userId,
              createdAt: email.createdAt,
          })
      })
    }


    var newUser = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        emails: emails,
        phones: phones,
        primaryEmail: user.primaryEmail,
        primaryPhone: user.primaryPhone,
        hasCompletedSurvey: user.hasCompletedSurvey,
        hasContacts: user.hasContacts,
        profile: user.profile,
        privacy: user.privacy,
        profileId: user.profileId,
        createdAt: user.createdAt,
        profilePicPath: user.profilePicPath
    }
    if(user.profilePicId) newUser.profilePicId = user.profilePicId;
    if(user.facebookProfilePicUrl) newUser.facebookProfilePicUrl = user.facebookProfilePicUrl;
    if(user.googleProfilePicUrl) newUser.googleProfilePicUrl = user.googleProfilePicUrl;
    if(user.telluswho) newUser.telluswho = user.telluswho;
    if(user.profilePicId) newUser.profilePicId = user.profilePicId;
    if(user.facebookId) newUser.facebookId = user.facebookId;
    if(user.googleId) newUser.googleId = user.googleId;
    if(user.google) newUser.google = user.google;
    if(user.facebook) newUser.facebook = user.facebook;
    if(user.facebookProfilePicUrl) newUser.facebookProfilePicUrl = user.facebookProfilePicUrl;
    if(user.googleProfilePicUrl) newUser.googleProfilePicUrl = user.googleProfilePicUrl;

    return newUser;
}
