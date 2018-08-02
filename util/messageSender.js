var Message = require('../models/message');
var Teeup = require('../models/teeup');
var Participant = require('../models/participant');
var admin = require("firebase-admin");
var serviceAccount = require("../config/serviceAccountKey.json");
var io = require('../sockets/socketClient');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://coordinator-1326.firebaseio.com"
});

/**
 * gets the list of device ids that are associated with the teeup and their participant objects
 * */
var getUserDevices = function (teeupId, callback) {
    Participant.filter({teeupId: teeupId}).getJoin({userInfo: {pushTokens: true}}).run().then((participants) => {
        var list = [];
        for (var i = 0; i < participants.length; i++) {
            var tokens = participants[i].userInfo;
            var ids = tokens ? tokens.pushTokens : [];
            for (var j = 0; j < ids.length; j++) {
                list.push(ids[j]);
            }
        }
        callback(list);
    });
};

var sendMessage = function (body, callback) {
    new Message(body).save().then((message) => {

        getUserDevices(message.teeupId, (registrationTokens) => {
            // See the "Defining the message payload" section below for details
            // on how to define a message payload.
            var payload = {
                data: {
                    title: "New message",
                    body: "There's activity in a teeup!",
                    messageId: message.id
                }
            };

            // Send a message to the devices corresponding to the provided
            // registration tokens.
            admin.messaging().sendToDevice(registrationTokens, payload).then((response) => {
                ;
                
                //callback(response);
            }).catch((error) => {
                
                //callback(error);
            });

        });

        return callback(message);
    });
};

exports.notifyMessageSent = function (teeupId, userId, message, callback) {
    var body = {
        message: message,
        teeupId: teeupId,
        createdBy: userId,
        actionType: "MESSAGE"
    };
    sendMessage(body, (message) => {
        return callback(message);
    });
};

exports.teeupCreated = function (teeupId, userId) {
    var body = {
        createdBy: userId,
        actionType: "TEEUP_CREATED",
        teeupId: teeupId
    };

    sendMessage(body);
};

exports.whereSuggestion = function (teeupId, userId, where) {
    var body = {
        createdBy: userId,
        actionType: "WHERE_SUGGESTION",
        teeupId: teeupId,
        whereId: where.id
    };

    sendMessage(body);
};

exports.whenSuggestion = function (teeupId, userId, when) {
    var body = {
        createdBy: userId,
        actionType: "WHEN_SUGGESTION",
        teeupId: teeupId,
        whenId: when.id
    };

    sendMessage(body);
};

exports.whenVoteUp = function (teeupId, userId, when) {
    var body = {
        createdBy: userId,
        actionType: "WHEN_VOTE_UP",
        teeupId: teeupId,
        whenId: when.id
    };

    sendMessage(body);
};

exports.whenVoteDown = function (teeupId, userId, when) {
    var body = {
        createdBy: userId,
        actionType: "WHEN_VOTE_DOWN",
        teeupId: teeupId,
        whenId: when.id
    };

    sendMessage(body);
};

exports.whereVoteUp = function (teeupId, userId, where) {
    var body = {
        createdBy: userId,
        actionType: "WHERE_VOTE_UP",
        teeupId: teeupId,
        whereId: where.id
    };

    sendMessage(body);
};

exports.whereVoteDown = function (teeupId, userId, where) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "WHERE_VOTE_DOWN",
        whereId: where.id
    };

    sendMessage(body);
};

exports.invitedUsers = function (teeupId, userId, participantIds, emails, phones) {
    var body = {
        createdBy: userId,
        actionType: "INVITED_USERS",
        teeupId: teeupId,
        invitedUsers: participantIds,
        invitedEmails: emails,
        invitedPhones: phones
    };

    sendMessage(body);
};

exports.titleChange = function (teeupId, userId, oldTitle, newTitle) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "TITLE_CHANGE",
        newTitle: newTitle,
        oldTitle: oldTitle
    };

    sendMessage(body);
};

exports.organizerSet = function (teeupId, userId, participantId, role) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "ORGANIZER_SET",
        participantId: participantId,
        newRole: role
    };

    sendMessage(body);
};

exports.organizerUnset = function (teeupId, userId, participantId, role) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "ORGANIZER_UNSET",
        participantId: participantId,
        newRole: role
    };

    sendMessage(body);
};

exports.gamePlanWhenSet = function (teeupId, userId, whenId) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "GAMEPLAN_WHEN_SET",
        whenId: whenId
    };

    sendMessage(body);
};

exports.gamePlanWhereSet = function (teeupId, userId, whereId) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "GAMEPLAN_WHERE_SET",
        whereId: whereId
    };

    sendMessage(body);
};

exports.gamePlanWhenDecided = function (teeupId, userId, whenId) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "GAMEPLAN_WHEN_DECIDED",
        whenId: whenId
    };

    sendMessage(body);
};

exports.gamePlanWhenUndecided = function (teeupId, userId, whenId) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "GAMEPLAN_WHEN_UNDECIDED",
        whenId: whenId
    };

    sendMessage(body);
};

exports.gamePlanWhereDecided = function (teeupId, userId, whereId) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "GAMEPLAN_WHERE_DECIDED",
        whereId: whereId
    };

    sendMessage(body);
};

exports.gamePlanWhereUndecided = function (teeupId, userId, whereId) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "GAMEPLAN_WHERE_UNDECIDED",
        whereId: whereId
    };

    sendMessage(body);
};

exports.teeupStatusChange = function (teeupId, userId, status) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "TEEUP_STATUS_CHANGE",
        newTeeupStatus: "" + status
    };

    sendMessage(body);
};

exports.teeupStatusAutoChange = function (teeupId, status) {
    // var stanza = getNewStanza(teeupId);
    //
    // stanza.c('body').c('actionType').t("AUTO_TEEUP_STATUS_CHANGE").up()
    //     .c('newTeeupStatus').t(status).up()
    //
    // sendMessage(stanza);
    //TODO why does this method exist?
};

exports.teeupItsOnMinAutoChange = function (teeupId, status) {
    // var stanza = getNewStanza(teeupId);
    //
    // stanza.c('body').c('actionType').t("AUTO_TEEUP_ITS_ON_MIN_STATUS_CHANGE").up()
    //     .c('newTeeupStatus').t(status).up()
    //
    // sendMessage(stanza);
    //TODO why does this method exist?
};

exports.teeupStatusAutoChangeSettings = function (teeupId, settings, userId) {
    // var stanza = getNewStanza(teeupId);
    //
    // stanza.c('body').c('actionType').t("AUTO_CHANGE_SETTINGS_UPDATE").up()
    //     .c('newTeeupAutoChangeSettings')
    //     .c('happeningIfWhenIsReached').t(settings.happeningIfWhenIsReached).up()
    //     .c('requireWhenBeDecided').t(settings.requireWhenBeDecided).up()
    //     .c('requireItsOnBeSet').t(settings.requireItsOnBeSet).up()
    //     .c("remindParticipants").t(settings.remindParticipants).up()
    //     .c("remindParticipantsWithNudge").t(settings.remindParticipantsWithNudge).up()
    //     .c("itsEndedTime").t(settings.itsEndedTime).up()
    //     .c("itsEndedOption").t(settings.itsEndedOption).up()
    //     .c('userId').t(userId).up()
    //
    // sendMessage(stanza);
    //TODO why does this method exist?
};

exports.teeupSettingsUpdate = function (teeupId, settings, userId) {
    // var stanza = getNewStanza(teeupId);
    //
    // stanza.c('body').c('actionType').t("TEEUP_SETTINGS_UPDATE").up()
    //     .c('newTeeupSettings')
    //     .c('isPublic').t(settings.isPublic).up()
    //     .c('join').t(settings.join).up()
    //     .c('invite').t(settings.invite).up()
    //     .c('suggest').t().up(settings.suggest)
    //     .c('decideGamePlan').t(settings.decideGamePlan).up()
    //     .c('modifyRow').t(settings.modifyRow).up()
    //
    // sendMessage(stanza);
    //TODO why does this method exist?
};

exports.userStatusChange = function (teeupId, userId, status) {
    var body = {
        createdBy: userId,
        teeupId: teeupId,
        actionType: "USER_STATUS_CHANGE",
        newUserStatus: status
    };

    sendMessage(body);
};
