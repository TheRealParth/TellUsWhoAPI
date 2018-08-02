/**
 * Created by deep on 7/11/17.
 */

var express = require('express');
var router = express.Router();
var thinky = require('../util/thinky.js');
var r = thinky.r;

var Message = require('../models/message');
var User = require('../models/user');
var messageSender = require('../util/messageSender');
var arrayUtil = require('../util/arrayUtil');

module.exports = function (passport) {

    /**
     * for sending a message in the conversation of the teeup
     * */
    router.post('/', (req, res) => {
        var teeupId = req.body.teeupId;
        var message = req.body.message;
        var userId = req.user.id;

        if (!teeupId && !message) {
            return res.status(400).send({status: 400, message: "Missing fields, please include teeupId and message."});
        }

        messageSender.notifyMessageSent(teeupId, userId, message, (message) => {
            return res.status(200).send({status: 200, message: "created!", newMessage: message});
        });

    });

    /**
     * Route that registers a firebase push token
     * */
    router.post('/registerToken', (req, res) => {
        var pushToken = req.body.pushToken;

        if (!pushToken) return res.status(400).send({status: 400, message: "Please specify a pushId"});

        User.get(req.user.id).run().then((user) => {
            arrayUtil.addElement(user.pushTokens, pushToken);
            user.save();
            return res.status(200).send({status: 200, message: "updated token!"});
        }).catch((e) => {
            return res.status(400).send({status: 400, message: "Session error"});
        });
    });

    /**
     * Route that unregisters a firebase push token
     * */
    router.post('/unregisterToken', (req, res) => {
        var pushToken = req.body.pushToken;

        if (!pushToken) {
            return res.status(400).send({status: 400, message: "Please specify a pushId"});
        }

        User.get(req.user.id).run().then((user) => {
            arrayUtil.removeElement(user.pushTokens, pushToken);
            user.save();
            return res.status(200).send({status: 200, message: "Token removed!"});
        });
    });

    /**
     * gets the list of messages based on a give teeup id, it can also get the messages based on a message id
     * */
    router.get('/', (req, res) => {
        var teeupId = req.query.teeupId;
        var id = req.query.id;

        var limit = req.query.limit;
        var skip = req.query.skip;
        var sortOrder = r.asc("createdAt");

        if (req.query.sortOrder != null) {
            if (req.query.sortOrder == "asc") {
                sortOrder = r.asc("createdAt");
            } else if (req.query.sortOrder == "desc") {
                sortOrder = r.desc("createdAt");
            }
        }

        var params = {};

        if (!teeupId && !id) {
            return res.status(400).send({
                status: 400,
                message: "Missing fields, please include teeupId or id with optional limit, skip, or sort."
            });
        } else if (teeupId) {
            params.teeupId = teeupId;
        } else if (id) {
            params.id = id;
        }

        return Message.filter(params).orderBy(sortOrder)
            .limit(limit != null ? parseInt(limit) : 10).skip(skip != null ? parseInt(skip) : 0)
            .getJoin({
                creator: {
                    _apply: function (doc) {
                        return doc.simple();
                    }
                },
                when: true,
                where: true,
                participant: {
                    userInfo: true
                }
            })
            // .concatMap(function(message) {
            //     return message//('creator').without('username');
            // })
            .run().then((messages) => {

                return res.status(200).send({
                    status: 200,
                    message: "Success!",
                    messages: messages
                });
            }).error((err) => {
                ;
                return res.status(500).send({status: 500, err: err});
            });
    });

    return router;
};