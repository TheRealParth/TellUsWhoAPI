/**
 * Created by deep on 1/4/17.
 */
var Where = require('../models/where');
var Teeup = require('../models/teeup');
var Participant = require('../models/participant');

var express = require('express');
var router = express.Router();
var thinky = require('../util/thinky.js');
var Errors = thinky.Errors;
var teeupUtil = require('../util/teeup-util.js')
var message = require('../util/messageSender');

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
     * create a where suggestion
     *
     *
     * */
    router.post('/', function (req, res) {
        var userId = req.user.id;
        var teeupId = req.body.teeupId;
        var where = req.body.where;
        if (!teeupId) {
            return res.status(400).send({status: 400, message: "Please specify a teeup Id"});
        }

        if (!where.locationName && !where.googlePlacesId) return res.status(400).send({
            status: 400,
            message: "Need either location name or Google place Id."
        });

        new Where({
            teeupId: teeupId,
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
        }).save().then((where) => {

            message.whereSuggestion(teeupId, userId, where);

            //Update the teeup UPDATED NOW date
            teeupUtil.updateTeeupUpdatedAt(teeupId);

            return res.status(200).send({
                status: 200,
                message: "Succesfully created.",
                where: where
            })
        });

    });

    /**
     * gets a particular where suggestion
     *
     *
     * @param teeupId - the id of the teeup
     * @param whereId  - the id of the where suggestion
     *
     * */
    router.get('/:whereId', function (req, res) {
        var whereId = req.params.whereId;
        var userId = req.user.id;

        if (!whereId) {
            return res.status(400).send({status: 400, message: "Please specify a where Id"});
        }

        Where.get(whereId).getJoin({
            creator: {
                _apply: function (creator) {
                    return creator.viewable();
                }
            }
        }).run().then(function (where) {
            if (!where) {
                return res.status(404).send({status: 404, message: "Where suggestion not found."});
            }

            return res.status(200).send({
                status: 200,
                message: "Successfully retrieved where suggestion",
                where: where
            });

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Where suggestion not found."});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });
    /**
     * get's the Where suggestion and adds a dislike to it
     *
     * @param teeupId - the id of the teeup
     * @param whereId  - the id of the where suggestion
     *
     * */
    router.get('/:whereId/like', function (req, res) {
        var whereId = req.params.whereId;
        var userId = req.user.id;

        if (!whereId) {
            return res.status(400).send({status: 400, message: "Please specify a where Id"});
        }

        Where.get(whereId).run().then(function (where) {
            if (!where) {
                return res.status(404).send({status: 404, message: "Where suggestion not found."});
            }

            var likes = where.thumbsUp;
            if (!likes) {
                likes = [];
            }

            if (inArray(userId, likes)) {
                return res.status(200).send({
                    status: 200,
                    message: "You already like this"
                });
            }

            where.thumbsUp = removeFromArray(where.thumbsUp, userId);
            where.thumbsDown = removeFromArray(where.thumbsDown, userId);

            likes.push(userId);
            where.thumbsUp = likes;

            where.save().then(function (newWhere) {

                message.whereVoteUp(newWhere.teeupId, userId, newWhere);

                //Update the teeup UPDATED NOW date
                teeupUtil.updateTeeupUpdatedAt(newWhere.teeupId);

                return res.status(200).send({
                    status: 200,
                    message: "Successfully liked!",
                    thumbsUp: newWhere.thumbsUp,
                    thumbsDown: newWhere.thumbsDown,
                    thumbsUpCount: newWhere.thumbsUpCount,
                    thumbsDownCount: newWhere.thumbsDownCount
                });
            })

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Where suggestion not found."});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });

    /**
     * get's the Where suggestion and adds a dislike to it
     *
     * @param teeupId - the id of the teeup
     * @param whereId  - the id of the where suggestion
     *
     * */
    router.get('/:whereId/dislike', function (req, res) {
        var whereId = req.params.whereId;
        var userId = req.user.id;

        if (!whereId) {
            return res.status(400).send({status: 400, message: "Please specify a where Id"});
        }

        Where.get(whereId).run().then(function (where) {
            if (!where) {
                return res.status(404).send({status: 404, message: "Where suggestion not found."});
            }

            var dislikes = where.thumbsDown;
            if (!dislikes) {
                dislikes = [];
            }

            if (inArray(userId, dislikes)) {
                return res.status(200).send({
                    status: 200,
                    message: "You already dislike this"
                });
            }

            where.thumbsUp = removeFromArray(where.thumbsUp, userId);
            where.thumbsDown = removeFromArray(where.thumbsDown, userId);

            dislikes.push(userId);
            where.thumbsDown = dislikes;

            where.save().then(function (newWhere) {

                message.whereVoteDown(newWhere.teeupId, userId, newWhere);
                //update the teeup's updatedAt date
                teeupUtil.updateTeeupUpdatedAt(newWhere.teeupId);

                return res.status(200).send({
                    status: 200,
                    message: "Successfully disliked!",
                    thumbsUp: newWhere.thumbsUp,
                    thumbsDown: newWhere.thumbsDown,
                    thumbsUpCount: newWhere.thumbsUpCount,
                    thumbsDownCount: newWhere.thumbsDownCount
                });
            })

        }).catch(Errors.DocumentNotFound, function (err) {
            return res.status(404).send({status: 404, message: "Where suggestion not found."});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: err});
        });

    });

    /**
     * deletes the where suggestion
     *
     * @param teeupId - the id of the teeup
     * @param whereId  - the id of the where suggestion
     *
     * The user can delete a where suggestion only if they are the creator of it
     *
     * */
    router.delete('/:whereId', function (req, res) {
        //var teeupId = req.params.teeupId;
        var whereId = req.params.whereId;

        if (!whereId) {
            return res.status(400).send({status: 400, message: "Please specify a where Id"});
        }

        Where.get(whereId).run().then(function (where) {
            if (!where) {
                return res.status(404).send({status: 404, message: "Where suggestion not found."});
            }

            var teeupId = where.teeupId;

            Teeup.get(teeupId).run().then(function (teeup) {
                if (!teeup) {
                    return res.status(404).send({status: 404, message: "Teeup not found."});
                }

                //return res.status(200).send({status: 200, message: "You can delete the where suggestion...", teeup: teeup});

                //check if the user created the teeup
                if (teeup.createdBy == req.user.id) {
                    //delete the where
                } else if (where.createdBy == req.user.id) {
                    //delete the where
                } else {
                    //otherwise the user cannot do anything because they're unauthorized
                    //you can't delete the where because the user is not the organizer or the
                    return res.status(400).send({status: 400, message: "Unauthorized."});
                }

                where.delete().then(function (deletedWhere) {

                    //check if the deleted where is in the gameplan
                    if (teeup.gamePlanWhereId == deletedWhere.id) {
                        delete teeup.gamePlanWhereId;
                        teeup.save().then(function (savedTeeup) {
                            return res.status(200).send({
                                status: 200,
                                message: "Successfully deleted where suggestion.",
                                where: deletedWhere,
                                teeup: savedTeeup
                            });
                        });
                    } else {
                        return res.status(200).send({
                            status: 200,
                            message: "Successfully deleted where suggestion.",
                            where: deletedWhere
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
     * route to make and put a where suggestion in the gameplan
     *
     * @param teeupId - the id of the teeup
     * @param whereId - the id of the where suggestion
     *
     * only the admin and the organizer can change the gameplan
     * */
    router.get('/:whereId/makeGamePlan', function (req, res) {
        var whereId = req.params.whereId;
        var userId = req.user.id;

        if (!whereId) {
            return res.status(400).send({status: 400, message: "Please specify a where Id"});
        }

        Where.get(whereId).getJoin().run().then(function (where) {
            if (!where) {
                return res.status(404).send({status: 404, message: "where suggestion not found."});
            }
            if(where.id == where.teeup.gamePlanWhereId) {
              return res.status(400).send({status: 400, message: "This where object is already the game plan"})
            }
            if (where.teeup.whereDecided){
              return res.status(400).send({status: 400, message: "Where must be undecided to change gameplan"})
            }
            var teeupId = where.teeupId;

            Participant.filter({userId: userId, teeupId: teeupId}).getJoin().run().then(function (participants) {

                var participant = participants[0];
                if (participant) {

                    var role = participant.role;
                    //if the user is an creator or an organizer
                    if (role == 0 || role == 1) {
                        Teeup.get(teeupId).run().then(function (teeup) {

                            teeup.updatedAt = Date.now();
                            teeup.gamePlanWhereId = where.id;

                            teeup.save().run().then(function (newTeeup) {

                                message.gamePlanWhereSet(teeupId, userId, whereId)
                                return res.status(200).send({
                                    status: 200,
                                    message: "Succesfully updated gameplan",
                                    where: where
                                });
                            });

                        }).catch(Errors.DocumentNotFound, function (err) {
                            return res.status(404).send({status: 404, message: "Teeup not found."});
                        }).error(function (err) {
                            return res.status(500).send({status: 500, message: "Server error", err: err});
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
            return res.status(404).send({status: 404, message: "Where suggestion not found.", err: err});
        }).error(function (err) {
            return res.status(500).send({status: 500, message: "Server error", err: err});
        });

    });

    return router;
};
