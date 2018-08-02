var express = require('express');
var router = express.Router();
var thinky = require('../util/thinky.js');
var r = thinky.r;
var User = require('../models/user');
var Invite = require('../models/invite');
var messageSender = require('../util/messageSender');
var arrayUtil = require('../util/arrayUtil');
var _ = require('lodash');

module.exports = function (passport) {

    router.post('/create', (req, res) => {
        var userId = req.user.id
        var contact = req.body.contact
        if(_.isEmpty(contact) || (_.isEmpty(contact.emails) && _.isEmpty(contact.phones)))
            return res.status(400).send({status: 400, message: "No contact provided"});

        // TODO Search all the emails and phones given and make sure there are no existing users associate with them
        // TODO if there are return fail
        // TODO else create the invite object and then SEND EMAIL/TEXT with link to sign up


    });


    return router;
};
