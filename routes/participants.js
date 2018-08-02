/**
 * Created by deep on 1/9/17.
 */
var Participant = require('../models/participant');

var express = require('express');
var router = express.Router();


module.exports = function (passport) {

    /***
     * @param teeupId - the id of the teeup
     *
     * update your status for a teeup
     */
    router.post('/', function (req, res) {
        var teeupId = req.body.teeupId;
        var newStatus = req.body.newStatus;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }
        if (!newStatus) {
            return res.status(400).send({status: 400, message: "Please specify a user status"});
        }
        if (newStatus === parseInt(newStatus, 10)) {
            return res.status(400).send({status: 400, message: "Status must be an integer."});
        }

        Participant.filter({userId: userId, teeupId: teeupId}).run().then(function (participants) {
            if (participants.length == 0) {
                return res.status(500).send({status: 500, message: "Server error"});
            } else {
                var participant = participants[0];
                participant.status = newStatus;
                participant.save().then(function () {
                    return res.status(200).send({status: 200, participants: participant});
                });
            }
        });

    });

    /***
     * @param teeupId - the id of the teeup
     *
     * Gets the participant by the id
     */
    router.get('/:participantId', function (req, res) {
        var teeupId = req.params.teeupId;
        var participantId = req.params.participantId;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }
        if (!participantId) {
            return res.status(400).send({status: 400, message: "Please specify a participant Id"});
        }

        Participant.get(participantId).getJoin({
            //TODO make a join to get the things they have made
            userInfo: {
                _apply: function (userInfo) {
                    return userInfo.viewable();
                }
            }
        }).run().then(function (participant) {
          return  res.status(200).send({status: 200, participant: participant});
        });

    });

    return router;

};
