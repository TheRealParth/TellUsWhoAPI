var User = require('../models/user');
var When = require('../models/when');
var Where = require('../models/where');
var Email = require('../models/email');
var Phone = require('../models/phone');
var Teeup = require('../models/teeup');
var Participant = require('../models/participant');

var express = require('express');
var router = express.Router();
var thinky = require('../util/thinky.js');
var r = thinky.r;
var R = require('ramda');
var Errors = thinky.Errors;
var Promise = require('bluebird');
var teeupUtil = require('../util/teeup-util');
var message = require('../util/messageSender');

var auto = require('../util/jobFunctions');


var PAGINATION_LIMIT = 10;
var ADDRESS = "http://localhost:8080";

module.exports = function (passport) {

    router.post('/itsOnMin/:teeupId', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;
        var min = parseInt(req.body.min);
        //TODO CHANGE TO REMOVE JOB BY JOB ID IF == 0
        if (!(min > 0)) {
            return res.status(400).send({status: 400, message: "Invalid minimum value, must be greater than 0"})
        }
        if (!teeupId) {
            return res.status(400).send({status: 400, message: "No teeup id provided"})
        }

        Teeup.get(teeupId).getJoin({participants: true}).run().then(teeup => {
            var isParticipant = false;
            var goingCount = 0;
            var participantsCount = teeup.participants.length;

            if (min > participantsCount) {
                return res.status(400).send({status: 400, message: "Not that many participants in teeup."})
            }

            teeup.participants.forEach((participant) => {
                if (participant.status == 2) {
                    goingCount++;
                }
                if (participant.userId == userId) {
                    isParticipant = true;
                    if (participant.role == 2) return res.status(400).send({
                        status: 400,
                        message: "You must be an organizer or creator to do that."
                    })
                }
            })
            if (!isParticipant) return res.status(400).send({status: 400, message: "Not a participant."})
            teeup.autoChangeSettings.itsOnMin = min;

            if ((goingCount >= min) && (teeup.status != 1)) {
                teeup.status = 1;
                message.autoTeeupStatusChange(teeupId, teeup.status)
            }

            teeup.save().then(teeup => {
                message.teeupStatusAutoChangeSettings(teeupId, teeup.autoChangeSettings, userId)
                return res.status(200).send({status: 200, message: "Saved successfully", newMin: min})
            })
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });

    router.post('/happeningIfWhenIsReached/:teeupId', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;
        var happeningIfWhenIsReached = req.body.happeningIfWhenIsReached;

        if (typeof(happeningIfWhenIsReached) != "boolean") {
          return  res.status(400).send({status: 400, message: "happeningIfWhenIsReached is not defined or not a boolean."});
        }

        if (!teeup.gamePlanWhen && happeningIfWhenIsReached) {
            //TODO REMOVE THIS

            return res.status(400).send({status: 400, message: "Game plan when is not set."})
        }

        Teeup.get(teeupId).getJoin({participants: true, gamePlanWhen: true}).run().then(teeup => {
            var isParticipant = false;
            teeup.participants.forEach((participant) => {

                if (participant.userId == userId) {
                    isParticipant = true;
                    if (participant.role == 2) {
                        res.status(400).send({status: 400, message: "You must be an organizer or creator to do that."})
                    }
                }
            })
            if (!isParticipant) {
                return res.status(400).send({status: 400, message: "Not a participant."})
            }

            teeup.autoChangeSettings.happeningIfWhenIsReached = happeningIfWhenIsReached;

            teeup.save().then(teeup => {

                message.setHappeningAutoChange(teeupId, teeup.autoChangeSettings, userId)
                auto.setHappeningAutoChange(teeupId, teeup.gamePlanWhen.fromDate, teeup.autoChangeSettings.happeningJobId)

                return res.status(200).send({
                    status: 200,
                    message: "Saved successfully",
                    happeningIfWhenIsReached: happeningIfWhenIsReached
                })
            })
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    })

    router.post('/requireWhenBeDecided/:teeupId', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;
        var requireWhenBeDecided = req.body.requireWhenBeDecided;

        if (typeof(requireWhenBeDecided) != "boolean") {
            return res.status(400).send({status: 400, message: "requireWhenBeDecided is not defined or not a boolean."});
        }

        Teeup.get(teeupId).getJoin({participants: true, gamePlanWhen: true}).run().then(teeup => {
            var isParticipant = false;
            var isOrganizer = true;
            teeup.participants.forEach((participant) => {
                if (participant.userId == userId) {
                    isParticipant = true;
                    if (participant.role == 2) {
                        isOrganizer = false;
                    }
                }
            })
            if(!isOrganizer) {
                return res.status(400).send({status: 400, message: "You must be an organizer or creator to do that."})
            }
            if (!isParticipant) {
                return res.status(400).send({status: 400, message: "Not a participant."})
            }

            if (!teeup.autoChangeSettings.happeningIfWhenIsReached) {
                return res.status(400).send({
                    status: 400,
                    message: "The setting happeningIfWhenIsReached must be set to true."
                })
            }

            teeup.autoChangeSettings.requireWhenBeDecided = requireWhenBeDecided;

            teeup.save().then(teeup => {
                message.teeupStatusAutoChangeSettings(teeupId, teeup.autoChangeSettings, userId)
                return res.status(200).send({
                    status: 200,
                    message: "Saved successfully",
                    requireWhenBeDecided: requireWhenBeDecided
                })
            })
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    })

    router.post('/requireItsOnBeSetFirst/:teeupId', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;
        var requireItsOnBeSetFirst = req.body.requireItsOnBeSetFirst;

        if (typeof(requireItsOnBeSetFirst) != "boolean") {
            return res.status(400).send({status: 400, message: "requireWhenBeDecided is not defined or not a boolean."});
        }

        Teeup.get(teeupId).getJoin({participants: true, gamePlanWhen: true}).run().then(teeup => {
            var isParticipant = false;
            var isOrganizer = true;

            teeup.participants.forEach((participant) => {
                if (participant.userId == userId) {
                    isParticipant = true;
                    if (participant.role == 2) {
                        isOrganizer = false;
                    }
                }
            })
            if(!isOrganizer) {
                return res.status(400).send({status: 400, message: "You must be an organizer or creator to do that."})
            }
            if (!isParticipant) {
                return res.status(400).send({status: 400, message: "Not a participant."})
            }

            if (!teeup.autoChangeSettings.happeningIfWhenIsReached) {
                return res.status(400).send({
                    status: 400,
                    message: "The setting happeningIfWhenIsReached must be set to true."
                })
            }

            teeup.autoChangeSetoptings.requireItsOnBeSetFirst = requireItsOnBeSetFirst;

            teeup.save().then(teeup => {
                message.teeupStatusAutoChangeSettings(teeupId, teeup.autoChangeSettings, userId)
                return res.status(200).send({
                    status: 200,
                    message: "Saved successfully",
                    requireItsOnBeSetFirst: requireItsOnBeSetFirst
                })
            })
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    })

    return router;
};
