/**
 * Created by deep on 1/4/17.
 */
var When = require('../models/when');
var Teeup = require('../models/teeup');
var Participant = require('../models/participant');
var teeupUtil = require('../util/teeup-util');

var express = require('express');
var router = express.Router();
var thinky = require('../util/thinky.js');
var r = thinky.r;
var Errors = thinky.Errors;
var teeupUtil = require('../util/teeup-util');
var messageSender = require('../util/messageSender.js');

module.exports = function (passport) {

    /**
     * method used to remove a string from an array
     * @param array - the array
     * @param userId - the user Id string to remove from the array
     * */
    function removeFromArray(array, userId) {
        if (!array) {
            return [];
        }
        var i = array.indexOf(userId);
        if (i != -1) {
            array.splice(i, 1);
        }

        return array;
    }

    /**
     * @param needle      the object to find in the array
     * @param haystack    the array to search
     * */
    function inArray(needle, haystack) {
        if (!haystack) {
            return false;
        }
        var count = haystack.length;
        for (var i = 0; i < count; i++) {
            if (haystack[i] === needle) {
                return true;
            }
        }
        return false;
    }

    /**
     * create a when suggestion endpoint
     *
     * required in the body
     * @param teeupId - the id of the teeup you want to suggest
     * @param whenTo - the when to
     * @param whenFrom - the when from
     * */
    router.post('/', function (req, res) {
        var teeupId = req.body.teeupId;
        var userId = req.user.id;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        var whenFrom = req.body.whenFrom;
        var whenTo = req.body.whenTo;
        var dateText = req.body.dateText;
        var timeText = req.body.timeText;

        if (!dateText || !timeText) {
            return res.status(400).send({
                status: 400,
                message: "Please include dateText and timeText"
            });
        }
        whenFrom = parseInt(whenFrom);
        whenTo = parseInt(whenTo);

        //return res.status(200).send({status: 200, from: fromDate.toTimeString(), to: toDate.toTimeString()});

        //checks to see if the teeup is accessible by the user
        Teeup.get(teeupId).getJoin({participants: true}).run().then(function (teeup) {
            //return res.status(200).send({status: 200, from: fromDate.toTimeString(), to: toDate.toTimeString(), teeup: teeup});
            //;
            if (!teeup) {
                return res.status(404).send({status: 404, message: "Teeup not found."});
            }

            //return res.status(200).send({status: 200, teeup: teeup});

            var isCreator = teeup.createdBy == req.user.id;
            var canSuggest = teeup.settings.suggest == true;

            if (isCreator) {
                //The user created the teeup they can do whatever they want... continue...
            } else {
                var isParticipant = teeupUtil.isUserParticipatingSync(teeup, userId);
                if (canSuggest && isParticipant) {
                    //the user is a participant and the settings let anyone suggest... continue...
                } else {
                    return res.status(400).send({status: 400, message: "Unauthorized."});
                }
            }

            var newWhen = new When({
                teeupId: teeup.id,
                thumbsUp: [userId],
                thumbsDown: [],
                createdBy: userId
            });
            newWhen.fromDate = new Date(whenFrom);
            if (whenTo > 0) {
                newWhen.toDate = new Date(whenTo);
            }

            newWhen.dateText = dateText;
            newWhen.timeText = timeText;
            newWhen.save().then(function (when) {
                teeup.updatedAt = Date.now();
                teeup.save();

                messageSender.whenSuggestion(teeupId, userId, when);

                return res.status(201).send({status: 201, message: "Successfully created suggestion!", when: when});
            }).error((err) => {
                return res.status(500).send({status: 500, message: "Server error.", err: err});
            });

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: err})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });
    });

    /**
     * gets a particular when suggestion
     *
     * Only returns the when suggestion if the user is participating in the teeup or the teeup is public
     *
     * @param teeupId - the id of the teeup
     * @param whenId  - the id of the when suggestion
     *
     * */
    router.get('/:whenId', function (req, res) {
        var whenId = req.params.whenId;
        var userId = req.user.id;
        
        //ms.sendTestMessage();
        
        if (!whenId) {
            return res.status(400).send({status: 400, message: "Please specify a when Id"});
        }

        When.get(whenId).getJoin({
            creator: {
                _apply: function (creator) {
                    return creator.viewable();
                }
            }
        }).run().then(function (when) {
            if (!when) {
                return res.status(404).send({status: 404, message: "When suggestion not found."});
            }

            return res.status(200).send({status: 200, message: "Successfully retrieved when suggestion", when: when});

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "When suggestion not found."});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });

    /**
     * get's the when suggestion and adds a dislike to it
     *
     * @param teeupId - the id of the teeup
     * @param whenId  - the id of the when suggestion
     *
     * */
    router.get('/:whenId/like', function (req, res) {
        var whenId = req.params.whenId;
        var userId = req.user.id;

        if (!whenId) {
            return res.status(400).send({status: 400, message: "Please specify a when Id"});
        }

        When.get(whenId).run().then(function (when) {
            if (!when) {
                return res.status(404).send({status: 404, message: "When suggestion not found."});
            }

            var likes = when.thumbsUp;
            if (!likes) {
                likes = [];
            }

            if (inArray(userId, likes)) {
                return res.status(200).send({
                    status: 200,
                    message: "You already like this"
                });
            }

            when.thumbsUp = removeFromArray(when.thumbsUp, userId);
            when.thumbsDown = removeFromArray(when.thumbsDown, userId);

            likes.push(userId);
            when.thumbsUp = likes;

            when.save().then(function (newWhen) {
                messageSender.whenVoteUp(newWhen.teeupId, userId, newWhen);
                //Update the teeup UPDATED NOW date
                teeupUtil.updateTeeupUpdatedAt(newWhen.teeupId);

                return res.status(200).send({
                    status: 200,
                    message: "Successfully liked!",
                    thumbsUp: newWhen.thumbsUp,
                    thumbsDown: newWhen.thumbsDown,
                    thumbsUpCount: newWhen.thumbsUpCount,
                    thumbsDownCount: newWhen.thumbsDownCount
                });
            })

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "When suggestion not found."});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });

    /**
     * get's the when suggestion and adds a dislike to it
     *
     * @param teeupId - the id of the teeup
     * @param whenId  - the id of the when suggestion
     *
     * */
    router.get('/:whenId/dislike', function (req, res) {
        var whenId = req.params.whenId;
        var userId = req.user.id;

        if (!whenId) {
            return res.status(400).send({status: 400, message: "Please specify a when Id"});
        }

        When.get(whenId).run().then(function (when) {
            if (!when) {
                return res.status(404).send({status: 404, message: "When suggestion not found."});
            }

            var dislikes = when.thumbsDown;
            if (!dislikes) {
                dislikes = [];
            }

            if (inArray(userId, dislikes)) {
                return res.status(200).send({
                    status: 200,
                    message: "You already dislike this"
                });
            }

            when.thumbsUp = removeFromArray(when.thumbsUp, userId);
            when.thumbsDown = removeFromArray(when.thumbsDown, userId);

            dislikes.push(userId);
            when.thumbsDown = dislikes;

            when.save().then(function (newWhen) {

                messageSender.whenVoteDown(newWhen.teeupId, userId, newWhen);
                //Update the teeup UPDATED NOW date
                teeupUtil.updateTeeupUpdatedAt(newWhen.teeupId);

                return res.status(200).send({
                    status: 200,
                    message: "Successfully disliked!",
                    thumbsUp: newWhen.thumbsUp,
                    thumbsDown: newWhen.thumbsDown,
                    thumbsUpCount: newWhen.thumbsUpCount,
                    thumbsDownCount: newWhen.thumbsDownCount

                });
            })

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "When suggestion not found."});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });

    /**
     * deletes the when suggestion
     *
     * @param teeupId - the id of the teeup
     * @param whenId  - the id of the when suggestion
     *
     * if the user is not an organizer or creator they are not allowed to delete a when suggestion
     * The user can delete a when suggestion only if they are the creator of it
     *
     * */
    router.delete('/:whenId', function (req, res) {
        //var teeupId = req.params.teeupId;
        var whenId = req.params.whenId;

        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        } else if (!whenId) {
            return res.status(400).send({status: 400, message: "Please specify a when Id"});
        }

        When.get(whenId).run().then(function (when) {
            if (!when) {
                return res.status(404).send({status: 404, message: "When suggestion not found."});
            }

            var teeupId = when.teeupId;

            Teeup.get(teeupId).run().then(function (teeup) {
                if (!teeup) {
                    return res.status(404).send({status: 404, message: "Teeup not found."});
                }

                //return res.status(200).send({status: 200, message: "You can delete the when suggestion...", teeup: teeup});

                //check if the user created the teeup
                if (teeup.createdBy == req.user.id) {
                    //delete the when
                } else if (when.createdBy == req.user.id) {
                    //delete the when
                } else {
                    //otherwise the user cannot do anything because they're unauthorized
                    //you can't delete the when because the user is not the organizer or the
                    return res.status(400).send({status: 400, message: "Unauthorized."});
                }

                when.delete().then(function (deletedWhen) {

                    //check if the deleted when is in the gameplan
                    if (teeup.gamePlanWhenId == deletedWhen.id) {
                        delete teeup.gamePlanWhenId;
                        teeup.save().then(function (savedTeeup) {
                            return res.status(200).send({
                                status: 200,
                                message: "Successfully deleted when suggestion.",
                                when: deletedWhen,
                                teeup: savedTeeup
                            });
                        });
                    } else {
                        return res.status(200).send({
                            status: 200,
                            message: "Successfully deleted when suggestion.",
                            when: deletedWhen
                        });
                    }
                }).error(function (err) {
                    return res.status(500).send({status: 500, message: err});
                });

            }).catch(Errors.DocumentNotFound, function (err) {
                return res.status(404).send({status: 404, message: err})
            }).error(function (err) {
                return res.status(500).send({status: 500, message: err});
            });

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: err})
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });

    /**
     * route to make and put a when suggestion in the gameplan
     *
     * @param teeupId - the id of the teeup
     * @param whenId - the id of the when suggestion
     *
     * only the admin and the organizer can change the gameplan
     * */
    router.get('/:whenId/makeGamePlan', function (req, res) {
        var whenId = req.params.whenId;
        var userId = req.user.id;

        if (!whenId) {
            return res.status(400).send({status: 400, message: "Please specify a when Id"});
        }

        When.get(whenId).getJoin({teeup: true}).run().then(function (when) {
            if (!when) {
                return res.status(404).send({status: 404, message: "When suggestion not found."});
            }
            if (when.id == when.teeup.gamePlanWhenId) {
                return res.status(400).send({status: 400, message: "This when object is already the game plan"})
            }
            if (when.teeup.whenDecided) {
                return res.status(400).send({status: 400, message: "When must be undecided to change gameplan"})
            }

            var teeupId = when.teeup.id;

            Participant.filter({
                userId: userId,
                teeupId: teeupId
            }).getJoin({teeup: true}).run().then(function (participants) {
                var participant = participants[0];
                if (participant) {
                    var role = participant.role;
                    //if the user is an creator or an organizer
                    if (role == 0 || role == 1) {
                        Teeup.get(teeupId).run().then(function (teeup) {
                            teeup.gamePlanWhenId = when.id;
                            //Update the teeup UPDATED NOW date
                            teeup.updatedAt = Date.now();

                            teeup.save().then(function (newTeeup) {
                                delete when.teeup;

                                if (when.toDate) messageWhen.toDate = Date.parse(when.toDate);

                                messageSender.gamePlanWhenSet(teeupId, userId, when.id)

                                return res.status(200).send({
                                    status: 200,
                                    message: "Successfully updated gameplan",
                                    when: when
                                });
                            });
                        });

                    } else {
                        return res.status(400).send({status: 400, message: "You're not the creator or organizer."});
                    }
                } else {
                    return res.status(400).send({status: 400, message: "You're not participating in the teeup."});
                }

            }).catch(Errors.DocumentNotFound, function (err) {
                return res.status(404).send({status: 404, message: "You're not participating in the teeup."});
            }).error(function (err) {
                return res.status(500).send({status: 500, message: "Server error", err: err});
            });

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "When suggestion not found.", err: err});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });

    });


    return router;
};
