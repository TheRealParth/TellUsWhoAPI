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
var messageSender = require('../util/messageSender');
var emailSender = require('../util/emailSender');
var textSender = require('../util/textSender');
var regexEmail = require('../config/config')['regexEmail'];
var regexPhone = require('../config/config')['regexPhone'];
var chatUtil = require('../util/chat-util');
var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";

var ADDRESS = "http://" + addr + ":" + port;
var PAGINATION_LIMIT = 10;

module.exports = function (passport) {
    /**
     * sends emails and text invitations for you
     *
     * @param emailInvitationList - list of email addresses to send invitation to
     * @param textInvitationList - list of phone numbers to send invitation to
     * @param username - username
     * @param teeup - teeup
     * */
    function sendInvitations(emailInvitationList, textInvitationList, username, teeup) {
        if (emailInvitationList.length) {
            emailSender.sendInvitationEmails(emailInvitationList, username, teeup, (arg) => {
                ;
            });
        }
        if (textInvitationList.length) {
            textSender.sendInvitationText(textInvitationList, username, teeup, (arg) => {

            })
        }
    }

    /**
     * returns participants to save promisified and ready to go
     *
     * @param users - list of user objects to invite
     * @param userId
     * @param teeupId
     * @param participants - list of participant objects
     * */
    function getParticipantsToSave(users, userId, teeupId, participants, noCheck) {
        var noCheck = noCheck ? noCheck : false;
        var participantsToSave = [];
        var emailInvitationList = [];//list of emails to email the invite
        var textInvitationList = [];//list of phone numbers to text the invite

        var newParticipant;
        var alreadyInvited = false;
        var existingUsers = [];

        users.forEach((user) => {
            //if its me
            if (user.id == userId) return user;
            if (!noCheck) alreadyInvited = teeupUtil.isUserInvited(participants, user.email, user.phone, user.userId);
            if (alreadyInvited) return user;

            newParticipant = new Participant({
                teeupId: teeupId,
                invitedBy: userId,
            });
            if (user.email && (existingUsers.indexOf(user.email) == -1)) {
                newParticipant.email = user.email;
                if (!user.userId) {
                    emailInvitationList.push(user.email);
                    existingUsers.push(user.email);
                }
            }
            if (user.phone && (existingUsers.indexOf(user.phone) == -1)) {
                newParticipant.phone = user.phone;
                if (!user.userId) {
                    textInvitationList.push(user.phone);
                    existingUsers.push(user.phone);
                }
            }
            if (user.userId && (existingUsers.indexOf(user.userId) == -1)) {
                newParticipant.userId = user.userId;
                existingUsers.push(user.userId);
            }

            participantsToSave.push(Promise.resolve(newParticipant.save()));
        })

        return {
            participantsToSave: participantsToSave,
            emailInvitationList: emailInvitationList,
            textInvitationList: textInvitationList
        }

    }

    /**
     * Takes an email or phone item and compares each user with it taking any userId it finds and putting it on the user object.
     *
     * @param item - Phone or Email object
     * @param users - list of user objects to be invited
     * */
    function associateUserId(item, users) {
        if (item.getModel() == Phone) {
            users.map((user) => {
                if (user.userId) return user;
                if (user.phone && (user.phone == item.id)) {
                    if (item.userId) {
                        user.userId = item.userId;
                        return user;
                    }
                }
            })
        }
        if (item.getModel() == Email) {
            users.map((user) => {
                if (user.userId) return user;
                if (user.email && (user.email == item.id)) {
                    if (item.userId) {
                        user.userId = item.userId;
                        return user;
                    }
                }
            })
        }
        return users;
    }

    /**
     * Checks all the invited users and makes sure everything is formatted properly
     *
     * @param users - array of user objects that have email or phone
     * */
    function invitedUsersValidation(users) {
        users.forEach((user) => {
            if (!user.email && !user.phone) return {status: 400, message: "Invalid email: " + user.email};

            if (user.email && !user.email.match(regexEmail)) return {
                status: 400,
                message: "Invalid email: " + user.email
            };
            if (user.phone && !user.phone.match(regexPhone)) return {
                status: 400,
                message: "Invalid email: " + user.email
            };
        })
        return {status: 200};
    }

    /**
     *  returns a promise that combines find emails and find phone  into one promise
     * @param users
     * @returns {Array of promises}
     */
    function getFindUsersPromises(users) {
        var findUsersPromises = [];
        users.forEach((user) => {
            if (user.email) findUsersPromises.push(Promise.resolve(Email.getAll(user.email.toLowerCase())));
            if (user.phone) findUsersPromises.push(Promise.resolve(Phone.getAll(user.phone.toLowerCase())));
        })
        return findUsersPromises;
    }


    function saveWhen(userId, teeup, when, callback) {
        if (when == undefined) {
            return callback(null);
        }
        var newWhen = new When({
            teeupId: teeup.id,
            thumbsUp: [userId],
            thumbsDown: [],
            createdBy: userId
        });
        newWhen.fromDate = new Date(when.whenFrom);
        if (when.whenTo > 0) {
            newWhen.toDate = new Date(when.whenTo);
        }
        newWhen.dateText = when.dateText;
        newWhen.timeText = when.timeText;

        newWhen.save().then(function (savedWhen) {
            teeup.gamePlanWhenId = savedWhen.id;
            teeup.save();
            return callback(savedWhen);
        })

    }

    function saveWhere(userId, teeup, where, callback) {
        if (where == undefined) {
            return callback(null);
        }

        new Where({
            teeupId: teeup.id,
            googlePlacesId: where.googlePlacesId,
            locationName: where.locationName,
            fullAddress: where.fullAddress,
            thumbsUp: [userId],
            thumbsDown: [],
            lat: where.lat,
            lon: where.lon,
            city: where.city,
            state: where.state,
            zip: where.zip,
            street: where.street,
            createdBy: userId
        }).save().then(function (savedWhere) {
            teeup.gamePlanWhereId = savedWhere.id;
            teeup.save();
            return callback(savedWhere);
        });
    }

    /***
     * Create a new teeup this also adds the user as a participant in the teeup
     */
    router.get('/test', function (req, res) {
        var test = "test";
        messageSender.titleChange(test, test, test);
        return res.status(200).send({status: 200, message: "stuff"})
    });

    /***
     * Create a new teeup this also adds the user as a participant in the teeup
     */
    router.post('/', function (req, res) {
        //have all required fields?
        var title = req.body.title;
        var message = req.body.message;
        var userId = req.user.id;
        var users = req.body.inviteUsers ? req.body.inviteUsers : false;

        if (!title || !users) {
            return res.status(400).send({
                status: 400,
                message: "Missing fields, please enter teeup title and invited users"
            });
        }

        if (users) {
            var resObj = invitedUsersValidation(users);
            if (resObj.status != 200) return res.status(resObj.status).send(resObj);
        }


        var where = req.body.where;
        var when = req.body.when;

        if (when) {
            var whenFrom = when.whenFrom;
            var whenTo = when.whenTo;

            if (!when.dateText || !when.timeText) {
                return res.status(400).send({
                    status: 400,
                    message: "Please include dateText or timeText"
                });
            }

            when.whenFrom = parseInt(whenFrom);
            if (when.whenTo) when.whenTo = parseInt(whenTo);
        }
        if (where) {
            //TODO add more validation
            if (!where.googlePlacesId && !where.locationName) {
                return res.status(400).send({
                    status: 400,
                    message: "Missing location name or google places id."
                });
            }
        }

        // create teeup object
        new Teeup({
            title: title,
            message: message,
            createdBy: userId
        }).save().then((teeup) => {
            messageSender.teeupCreated(teeup.id, userId);
            var myParticipantObj;
            var teeupId = teeup.id;
            // if the user made the teeup they're automatically in the going state
            myParticipantObj = Promise.resolve(new Participant({
                teeupId: teeupId,
                userId: userId,
                role: 0,
                status: 2
            }).save());

            var participantsToSave = [];

            if (users) {
                var findUsersPromises = getFindUsersPromises(users);

                Promise.all(findUsersPromises).then((emailsAndPhones) => {
                    emailsAndPhones.forEach((arr) => {
                        arr.forEach((item) => {
                            users = associateUserId(item, users);
                        })
                    });
                });


                var stuff = getParticipantsToSave(users, userId, teeupId, [], true);
                participantsToSave = stuff.participantsToSave;
                var emailInvitationList = stuff.emailInvitationList;
                var textInvitationList = stuff.textInvitationList;
            }

            participantsToSave.push(myParticipantObj);

            Promise.all(participantsToSave).then((participants) => {
                teeup.save();
                saveWhen(userId, teeup, when, (newWhen) => {
                    saveWhere(userId, teeup, where, (newWhere) => {
                        if (users) sendInvitations(emailInvitationList, textInvitationList, req.user.username, teeup);
                        teeup.participants = participants;
                        if (newWhen) teeup.when = newWhen;
                        if (newWhere) teeup.where = newWhere;

                        messageSender.invitedUsers(teeupId, userId, participants, emailInvitationList, textInvitationList);

                        return res.status(200).send({status: 200, message: "Success", teeup: teeup});
                    })
                })

            }).catch((e) => {
                return res.status(400).send({status: 400, err: e, message: "Error saving participants"});
            })
        });
    });

    /**
     * Get all teeups for the coordinating page
     */
    router.get('/', function (req, res) {
        var userId = req.user.id;
        Participant.orderBy({index: r.desc("inviteDate")}).filter({userId: userId}).getJoin({
            teeup: {
                creator: {
                    _apply: function (creator) {
                        return creator.viewable();
                    }
                },
                gamePlanWhen: true,
                gamePlanWhere: true,
                participants: true
            }
        }).filter((participant) => {
            return participant("status").gt(0).and(participant("status").lt(7)).and(participant("teeup")("status").lt(3))
        }).orderBy(r.desc(r.row('teeup')('updatedAt'))).limit(PAGINATION_LIMIT).run().then((participants) => {
            var teeups = [];

            participants.forEach(participant => {
                if (participant.teeup != null)
                    teeups.push(participant.teeup);
            });

            if (teeups.length >= 10) {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ADDRESS + "/api/teeups/next/10"
                });
            } else {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ""
                });
            }
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeups not found."});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });

    /**
     * Get all teeups to which you're invited for invites tab
     */
    router.get('/invites', function (req, res) {
        var userId = req.user.id;

        Participant.orderBy({index: r.desc('inviteDate')}).filter({
            userId: userId,
            status: 0
        }).getJoin({
            teeup: {
                creator: {
                    _apply: function (creator) {
                        return creator.viewable();
                    }
                },
                gamePlanWhen: true,
                gamePlanWhere: true,
                participants: true
            }
        }).orderBy(r.desc(r.row('teeup')('updatedAt'))).limit(PAGINATION_LIMIT).run().then((participants) => {
            var teeups = [];

            participants.forEach(participant => {
                if (participant.teeup != null)
                    teeups.push(participant.teeup);
            })

            if (teeups.length >= 10) {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ADDRESS + "/api/teeups/invites/next/10"
                });
            } else {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ""
                });
            }

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeups not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });
    /**
     * Get all the teeups that have the status of ended
     */
    router.get('/past', function (req, res) {
        var userId = req.user.id;

        Participant.orderBy({index: r.desc('inviteDate')}).filter({userId: userId}).getJoin({
            teeup: {
                creator: {
                    _apply: function (creator) {
                        return creator.viewable();
                    }
                },
                gamePlanWhen: true,
                gamePlanWhere: true,
                participants: true
            }
        }).filter((participant) => {
            return participant("status").lt(7).and(participant("teeup")("status")).gt(2).and(participant("teeup")("status").lt(5))
        }).orderBy(r.desc(r.row('teeup')('updatedAt'))).limit(PAGINATION_LIMIT).run().then((participants) => {
            var teeups = [];

            participants.forEach(participant => {
                if (participant.teeup != null)
                    teeups.push(participant.teeup);
            })

            if (teeups.length >= 10) {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ADDRESS + "/api/teeups/past/next/10"
                });
            } else {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ""
                });
            }

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeups not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });
    /**
     * Get all teeups to which you're invited for invites tab
     */
    router.get('/past/next/:skip', function (req, res) {
        var userId = req.user.id;
        var skip = parseInt(req.params.skip);
        var end = skip + PAGINATION_LIMIT;

        Participant.orderBy({index: r.desc('inviteDate')}).filter({userId: userId}).getJoin({
            teeup: {
                creator: {
                    _apply: function (creator) {
                        return creator.viewable();
                    }
                },
                gamePlanWhen: true,
                gamePlanWhere: true,
                participants: true
            }
        }).filter((participant) => {
            return participant("status").lt(7).and(participant("teeup")("status").gt(2).and(participant("teeup")("status").lt(5)))
        }).orderBy(r.desc(r.row('teeup')('updatedAt')))
            .slice(skip, end).run().then((participants) => {
            var teeups = [];

            participants.forEach(participant => {
                if (participant.teeup != null)
                    teeups.push(participant.teeup);
            })

            if (teeups.length >= 10) {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ADDRESS + "/api/teeups/past/next/" + end
                });
            } else {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ""
                });
            }

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeups not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });
    /**
     * Get all teeups to which you're invited for invites tab
     */
    router.get('/invites/next/:skip', function (req, res) {
        var userId = req.user.id;
        var skip = parseInt(req.params.skip);
        var end = skip + PAGINATION_LIMIT;

        Participant.orderBy({index: r.desc('inviteDate')}).filter({
            userId: userId,
            status: 0
        }).getJoin({
            teeup: {
                creator: {
                    _apply: function (creator) {
                        return creator.viewable();
                    }
                },
                gamePlanWhen: true,
                gamePlanWhere: true,
                participants: true
            }
        }).orderBy(r.desc(r.row('teeup')('updatedAt'))).slice(skip, end).run().then((participants) => {
            var teeups = [];

            participants.forEach(participant => {
                if (participant.teeup != null)
                    teeups.push(participant.teeup);
            })

            if (teeups.length >= 10) {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ADDRESS + "/api/teeups/invites/next/" + end
                });
            } else {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ""
                });
            }

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeups not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });

    //Pagined get with next with the amount to skip.
    router.get('/next/:skip', function (req, res) {
        var skip = parseInt(req.params.skip);
        var end = skip + PAGINATION_LIMIT;
        var userId = req.user.id
        Participant.orderBy({index: r.desc('inviteDate')}).filter({userId: userId}).getJoin({
            teeup: {
                creator: {
                    _apply: function (creator) {
                        return creator.viewable();
                    }
                },
                gamePlanWhen: true,
                gamePlanWhere: true,
                participants: true
            }
        }).filter((participant) => {
            return participant("status").gt(0).and(participant("status").lt(7)).and(participant("teeup")("status").lt(3))
        }).orderBy(r.desc(r.row('teeup')('updatedAt'))).slice(skip, end).run().then((participants) => {
            var teeups = [];

            participants.forEach(participant => {
                if (participant.teeup != null)
                    teeups.push(participant.teeup);
            })

            if (teeups.length >= 10) {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ADDRESS + "/api/teeups/next/" + end
                });
            } else {
                return res.status(200).send({
                    status: 200,
                    message: "Successfully retrieved teeups",
                    teeups: teeups,
                    next: ""
                });
            }
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeups not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });

    });
    /***
     * @param teeupId - the id of the teeup
     *
     * Get a teeup by id
     * also gets the participants and the gameplan when and where
     */
    router.get('/:teeupId', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }
        Teeup.get(teeupId).getJoin({
            participants: {
                userInfo: {
                    _apply: function (userInfo) {
                        return userInfo.viewable();
                    }
                }
            },
            whenSuggestions: true,
            whereSuggestions: true,
            gamePlanWhen: true,
            gamePlanWhere: true
        }).run().then(function (teeup) {
            if (!teeup) {
                return res.status(404).send({status: 404, message: "Teeup not found."});
            }

            //if the teeup is public then show the teeup
            if (teeup.settings.isPublic) {
                return res.status(200).send({status: 200, teeup: teeup});
            }

            if (teeupUtil.isUserParticipating(teeup, userId)) {
                return res.status(200).send({status: 200, teeup: teeup});
            } else {

                //the user is not participating in the teeup don't show the teeup
                return res.status(400).send({
                    status: 400,
                    message: "You're not participating in the teeup and it's not public."
                });
            }

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        });
    });

    /**
     * route that lets you rename a teeup
     * TODO revisit this route
     * */
    router.post('/:teeupId/rename', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;
        var newTitle = req.body.newTitle;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        if (!newTitle) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        } else if (newTitle.length > 50) {
            return res.status(400).send({status: 400, message: "The title can not be longer than 50 characters"});
        }

        Teeup.get(teeupId).run().then(function (teeup) {
            if (!teeup) {
                return res.status(404).send({status: 404, message: "Teeup not found."});
            }
            var oldTitle = teeup.title;
            teeup.title = newTitle;
            teeup.save().then(function (savedteeup) {
                messageSender.titleChange(teeupId, userId, oldTitle, newTitle);
                return res.status(200).send({status: 200, message: "Teeup renamed.", newTitle: savedteeup.title});
            });

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        });
    });

    /**
     * Update teeup status
     * in the request body the new status must be defined
     * the status must be a number from 0 to 4
     *
     * 0 = Planning,
     * 1 = its on,
     * 2 = Happening,
     * 3 = it's Ended,
     * 4 = Cancelled
     *
     * @param teeupId - the id of the teeup to modify
     * postBody - @ex {status:2}
     */
    router.post('/:teeupId/updateStatus', function (req, res) {
        var teeupId = req.params.teeupId;
        var newStatus = req.body.status;
        var userId = req.user.id;
        //
        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }
        if (newStatus > 4 || newStatus < 0 || !newStatus) {
            return res.status(400).send({status: 400, message: "Please specify a teeup status between 0 and 4."});
        }

        Teeup.get(teeupId).getJoin({
            participants: true
        }).run().then(function (teeup) {
            if (!teeup) {
                return res.status(404).send({status: 404, message: "Teeup not found."});
            }

            teeupUtil.canUserEdit(teeup, userId, function (isCreator, isAdmin, isOrganizer, isParticipant) {
                if (!isCreator) {
                    //not the creator, but an organizer can change the status
                    if (isAdmin || isOrganizer) {
                        //make the change
                    } else {
                        //go fuck yourself, you can't make that change to the teeup
                        return res.status(400).send({
                            status: 400,
                            message: "You must be the creator, admin or an organizer to change the teeup status"
                        });
                    }
                } else {
                    //make the update
                }
                teeup.updatedAt = Date.now();
                teeup.status = newStatus;
                teeup.save().then(function (savedTeeup) {
                    //
                    messageSender.teeupStatusChange(teeupId, userId, savedTeeup.status)

                    return res.status(200).send({
                        status: 200,
                        message: "Successfully updated status",
                        newTeeupStatus: savedTeeup.status,
                    })
                });
            });

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });
    });

    //TODO: Add an endpoint for LEAVE TEEUP.

    /**
     * Update user status
     * in the request body the new status must be defined
     * the status must be a number from 0 to 4
     *
     * 0 = I'm Going,
     * 1 = Might Go,
     * 2 = Interested,
     * 3 = Not Going,
     * 4 = On My Way
     * 5 = Arrived
     * @param teeupId - the id of the teeup to modify
     * postBody - @ex {status:2}
     */
    router.post('/:teeupId/updateUserStatus', function (req, res) {
        var teeupId = req.params.teeupId;
        var newStatus = req.body.status;
        var userId = req.user.id;
        //
        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }
        if (newStatus > 7 || newStatus < 0 || !newStatus) {
            return res.status(400).send({status: 400, message: "Please specify a teeup status between 0 and 7."});
        }

        Teeup.get(teeupId).getJoin({
            participants: true
        }).run().then(function (teeup) {
            if (!teeup) {
                return res.status(404).send({status: 404, message: "Teeup not found."});
            }
            var participants = teeup.participants;
            var myParticipantObject;
            var goingCount = 0;
            participants.forEach((participant) => {
                if (participant.userId == userId) myParticipantObject = participant;
                if (participant.role == 2) goingCount++;
            });

            if (!myParticipantObject) return res.status(404).send({
                status: 404,
                message: "You are not a participant in this teeup."
            });

            //if the new status is the same as the old one don't do anything...
            if (myParticipantObject.status == newStatus) {
                return res.status(200).send({status: 200, message: "That's already your status"});
            }
            myParticipantObject.status = newStatus;
            myParticipantObject.save().then(participant => {
                teeup.updatedAt = Date.now();
                //AUTO CHANGE IF ITS ON MINIMUM IS SET AND
                if ((teeup.autoChangeSettings.itsOnMin <= goingCount) && (teeup.status == 0 || teeup.status == 2)) {
                    teeup.status = 1;
                    messageSender.teeupItsOnMinAutoChange(teeupId, 1);
                }


                teeup.save();
                messageSender.userStatusChange(teeupId, userId, newStatus);
                return res.status(200).send({
                    status: 200,
                    message: "User status updated successfully",
                    newStatus: participant.status
                });
            })

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });
    });

    /**
     * Update teeup settings
     *
     * only the creator of the teeup can do this
     */
    router.put('/:teeupId/settings', function (req, res) {
        var teeupId = req.params.teeupId;
        var isPublic = req.body.isPublic;
        var join = req.body.join;
        var invite = req.body.invite;
        var suggest = req.body.suggest;
        var decideGamePlan = req.body.decideGamePlan;
        var modifyRow = req.body.modifyRow;

        var userId = req.user.id;

        for (i in req.body) {
            if (!(req.body[i] == "true" || req.body[i] == "false")) {
                return res.status(400).send({
                    status: 400,
                    message: "Invalid field parameters, takes boolean fields isPublic, join, invite, suggest, decideGamePlan, and modifyRow."
                });
            }
        }

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        Teeup.get(teeupId).getJoin({participants: true}).run().then((teeup) => {
            if (!teeup) {
                return res.status(404).send({status: 404, message: "Teeup not found"});
            }
            // NEW CHECK
            var isParticipting = false;
            teeup.participants.forEach(participant => {
                if (participant.userId == userId) {
                    if (participant.status < 7) isParticipating = true;
                    if (participant.role == 2) return res.status(400).send({status: 400, message: "Unauthorized"});
                }
            })
            if (!isParticipating) return res.status(400).send({status: 400, message: "Not participant of teeup."})
            // OLD CHECK
            // if (teeup.createdBy != userId) {
            //     return res.status(400).send({status: 400, message: "Unauthorized"});
            // }

            if (isPublic)
                teeup.settings.isPublic = (isPublic == 'true');
            if (join)
                teeup.settings.join = (join == 'true');
            if (invite)
                teeup.settings.invite = (invite == 'true');
            if (suggest)
                teeup.settings.suggest = (suggest == 'true');
            if (decideGamePlan)
                teeup.settings.decideGamePlan = (decideGamePlan == 'true');
            if (modifyRow)
                teeup.settings.modifyRow = (modifyRow == 'true');

            teeup.updatedAt = Date.now();

            teeup.save().then((newTeeup) => {

                messageSender.teeupSettingsUpdate(teeupId, teeup.settings, userId)

                return res.status(200).send({
                    status: 200,
                    message: "Successfully updated settings!",
                    settings: newTeeup.settings
                });
            });

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Teeup not found"})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });
    });

    /**
     * route for getting the gameplan and the list of suggestions
     * */
    router.get('/:teeupId/gameplan', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        Teeup.get(teeupId).getJoin({
            gamePlanWhen: {
                creator: {
                    _apply: function (userInfo) {
                        return userInfo.viewable();
                    }
                }
            },
            gamePlanWhere: {
                creator: {
                    _apply: function (userInfo) {
                        return userInfo.viewable();
                    }
                }
            },
            whenSuggestions: {
                creator: {
                    _apply: function (userInfo) {
                        return userInfo.viewable();
                    }
                }
            },
            whereSuggestions: {
                creator: {
                    _apply: function (userInfo) {
                        return userInfo.viewable();
                    }
                }
            }
        }).run().then(function (teeup) {
            var when = {};
            when = teeup.gamePlanWhen;
            var where = {};
            where = teeup.gamePlanWhere;

            var whenSuggestions = teeup.whenSuggestions;
            var whereSuggestions = teeup.whereSuggestions;


            return res.status(200).send({
                status: 200, // teeup: teeup,
                message: "Successfully retrieved gameplan",
                gamePlanWhen: when,
                gamePlanWhere: where,
                whenSuggestions: whenSuggestions,
                whereSuggestions: whereSuggestions
            });
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: err})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });
    });

    /***
     * @param teeupId - the id of the teeup
     *
     * Gets the participants for the teeup
     */
    router.get('/:teeupId/participants', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        Participant.filter({teeupId: teeupId}).getJoin({
            userInfo: {
                _apply: function (userInfo) {
                    return userInfo.viewable();
                }
            },
            invitedByUserInfo: {
                _apply: function (userInfo) {
                    return userInfo.viewable();
                }
            }
        }).run().then(function (participants) {
          return  res.status(200).send({status: 200, participants: participants});
        });
    });

    /**
     * gets all when suggestions
     *
     * @param teeupId - the id of the teeup
     *
     * gets all the when suggestions for a teeup
     *
     * */
    router.get('/:teeupId/when', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        //TODO check to see if the teeup is accessible by the user
        Teeup.get(teeupId).getJoin({whenSuggestions: true, gamePlanWhen: true}).run().then(function (teeup) {

            return res.status(200).send({
                status: 200,
                gamePlanWhen: teeup.gamePlanWhen,
                whenSuggestions: teeup.whenSuggestions
            });
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: err})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });

    /**
     * gets all where suggestions
     *
     * @param teeupId - the id of the teeup
     *
     * gets all the where suggestions for a teeup
     *
     * */
    router.get('/:teeupId/where', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        //TODO check to see if the teeup is accessible by the user
        Teeup.get(teeupId).getJoin({whereSuggestions: true, gamePlanWhere: true}).run().then(function (teeup) {

            return res.status(200).send({
                status: 200,
                gamePlanWhere: teeup.gamePlanWhere,
                whereSuggestions: teeup.whereSuggestions
            });
        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: err})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });
    });

    /**
     * invites the emails/phones provided
     *
     * @param teeupId - the id of the teeup
     *
     * invites all the users by the emails[] and phones[] provided
     *
     * */
    router.post('/:teeupId/inviteUsers', function (req, res) {
        var teeupId = req.params.teeupId;
        var userId = req.user.id;
        var users = req.body.inviteUsers;

        if (!users) return res.status(400).send({status: 400, message: "No users provided"});
        var resObj = invitedUsersValidation(users);
        if (resObj.status != 200) return res.status(400).send(resObj);

        if (!teeupId || !users) return res.status(400).send({
            status: 400,
            message: "Missing teeup id or inviteUsers: []"
        });

        Teeup.get(teeupId).getJoin({participants: true}).run().then((teeup) => {
            teeupUtil.canUserEdit(teeup, userId, (isCreator, isAdmin, isOrganizer, isParticipant) => {
                if (!isParticipant) return res.status(400).send({
                    status: 400,
                    message: "You're not a participant of this teeup"
                });
                if (!teeup.settings.invite) {
                    if (!isAdmin && !isOrganizer) return res.status(400).send({
                        status: 400,
                        message: "You must be admin or organizer"
                    });
                }
                var findUsersPromises = getFindUsersPromises(users);

                Promise.all(findUsersPromises).then((emailsAndPhones) => {
                    emailsAndPhones.forEach((arr) => {
                        arr.forEach((item) => {
                            users = associateUserId(item, users);
                        })
                    });

                    var stuff = getParticipantsToSave(users, userId, teeupId, teeup.participants);


                    var participantsToSave = stuff.participantsToSave;
                    var emailInvitationList = stuff.emailInvitationList;
                    var textInvitationList = stuff.textInvitationList;
                    if (!participantsToSave.length) return res.status(400).send({
                        status: 400,
                        message: "Those users have already been invited."
                    });

                    Promise.all(participantsToSave).then((participants) => {
                        teeup.updatedAt = Date.now();
                        teeup.save();
                        teeup.participants = teeup.participants.concat(participants);

                        //TODO SEND MESSAGE TO CHAT]
                        messageSender.invitedUsers(teeupId, userId, participants, emailInvitationList, textInvitationList);
                        sendInvitations(emailInvitationList, textInvitationList, req.user.username, teeup);

                        return res.status(200).send({status: 200, message: "Success", teeup: teeup});
                    }).catch((e) => {
                        return res.status(400).send({status: 400, err: e, message: "Error saving participants"});
                    })
                }).catch(error => {
                    return res.status(400).send({status: 400, message: "Error finding teeup"});
                });


            });
        }).catch((e) => {
            return res.status(400).send({status: 400, message: "You must be admin or organizer"});
        });


    });
    /**
     * Sets a participant to organizer status
     *
     * @param partcipantId
     *
     * */
    router.get('/setOrganizer/:participantId', function (req, res) {

        var userId = req.user.id;
        var participantId = req.params.participantId;

        Participant.get(participantId).getJoin({teeup: {participants: true}}).then((participant) => {
            var teeup = participant.teeup;

            // NEW CHECK
            if (participant.userId == userId) return res.status(400).send({
                status: 400,
                message: "Can't change your own role"
            })
            teeup.participants.forEach(participant => {
                if (participant.userId == userId) {
                    if ((participant.role != 0) && (participant.status < 7)) return res.status(400).send({
                        status: 400,
                        message: "Unauthorized"
                    });
                }
            })
            // OLD CHECK
            // if(teeup.createdBy != userId) return res.status(400).send({status: 400, message: "Not the creator of teeup."})

            participant.role = 1;

            participant.save().then((participant) => {
                teeup.updatedAt = Date.now();
                teeup.save();
                messageSender.organizerSet(teeupId, userId, participantId, newRole)

                return res.status(200).send({
                    status: 200,
                    message: "Succesfully updated the role of the participant.",
                    newRole: participant.role
                })
            })

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Participant not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });
    /**
     * Unsets a participant to organizer status
     *
     * @param partcipantId
     *
     * */
    router.get('/unsetOrganizer/:participantId', function (req, res) {

        var userId = req.user.id;
        var participantId = req.params.participantId;

        Participant.get(participantId).getJoin({teeup: {participants: true}}).then((participant) => {
            var teeup = participant.teeup;

            // NEW CHECK
            if (participant.userId == userId) return res.status(400).send({
                status: 400,
                message: "Can't change your own role"
            })
            teeup.participants.forEach(participant => {
                if (participant.userId == userId) {
                    if ((participant.role != 0) && (participant.status < 7)) return res.status(400).send({
                        status: 400,
                        message: "Unauthorized"
                    });
                }
            })

            participant.role = 2;

            participant.save().then((participant) => {
                teeup.updatedAt = Date.now();
                teeup.save();
                messageSender.organizerUnset(participant.teeupId, userId, participant.id, participant.role)
                return res.status(200).send({
                    status: 200,
                    message: "Succesfully updated the role of the participant.",
                    newRole: participant.role
                })
            })

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Participant not found."})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });
    });
    /**
     * Decide when
     *
     * @param teeupId
     * @param whenId
     *
     * */
    router.get('/decideWhen/:teeupId/:whenId', function (req, res) {
        var whenId = req.params.whenId;
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        Teeup.get(teeupId).then((teeup) => {
            //TODO add a check to see if they're participants AND if their role is 0 or 1 (organizer or creator)
            if ((teeup.gamePlanWhenId == whenId) && teeup.whenDecided) {
                return res.status(200).send({status: 200, message: "This is already decided."})
            }
            if (teeup.gamePlanWhenId != whenId) {
                return res.status(400).send({status: 400, message: "Must be current gameplan to make decided."})
            }

            teeup.whenDecided = true;
            teeup.save().then(teeup => {
                messageSender.gamePlanWhenDecided(teeupId, userId, whenId);
                return res.status(200).send({status: 200, message: "Success"})
            })

        })
    });
    /**
     * Undecide when
     *
     * @param teeupId
     * @param whenId
     *
     * */
    router.get('/undecideWhen/:teeupId/:whenId', function (req, res) {
        var whenId = req.params.whenId;
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        Teeup.get(teeupId).then((teeup) => {
            //TODO add a check to see if they're participants AND if their role is 0 or 1 (organizer or creator)
            if (!teeup.whenDecided) {
                return res.status(200).send({status: 200, message: "There is no gameplan decided."})
            }
            if (teeup.gamePlanWhenId != whenId) {
                return res.status(400).send({status: 400, message: "Must be current gameplan to make undecided."})
            }

            teeup.whenDecided = false;
            teeup.save().then(teeup => {
                messageSender.gamePlanWhenUndecided(teeupId, userId, whenId);
                return res.status(200).send({status: 200, message: "Success"})
            })

        })

    });
    /**
     * Decide where
     *
     * @param teeupId
     * @param whereId
     *
     * */
    router.get('/decideWhere/:teeupId/:whereId', function (req, res) {
        var whereId = req.params.whereId;
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        Teeup.get(teeupId).then((teeup) => {
            //TODO add a check to see if they're participants AND if their role is 0 or 1 (organizer or creator)
            if ((teeup.gamePlanWhereId == whereId) && teeup.whereDecided) {
                return res.status(200).send({status: 200, message: "This is already decided."})
            }
            if (teeup.gamePlanWhereId != whereId) {
                return res.status(400).send({status: 400, message: "Must be current gameplan to make decided."})
            }
            teeup.whereDecided = true;
            teeup.save().then(teeup => {
                messageSender.gamePlanWhereDecided(teeupId, userId, whereId);
                return res.status(200).send({status: 200, message: "Success"})
            })
        })
    });
    /**
     * Undecide where
     *
     * @param teeupId
     * @param whereId
     *
     * */
    router.get('/undecideWhere/:teeupId/:whereId', function (req, res) {
        var whereId = req.params.whereId;
        var teeupId = req.params.teeupId;
        var userId = req.user.id;

        Teeup.get(teeupId).then((teeup) => {
            //TODO add a check to see if they're participants AND if their role is 0 or 1 (organizer or creator)
            if (!teeup.whereDecided) {
                return res.status(400).send({status: 400, message: "No gameplan has been decided."})
            }
            if (teeup.gamePlanWhereId != whereId) {
                return res.status(400).send({status: 400, message: "Not the current decided gameplanwhere"})
            }

            teeup.whereDecided = false;
            teeup.save().then(teeup => {
                messageSender.gamePlanWhereUndecided(teeupId, userId, whereId);
                return res.status(200).send({status: 200, message: "Success"})
            })

        })
    });


    return router;
};
