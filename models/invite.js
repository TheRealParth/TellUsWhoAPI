var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Invite = thinky.createModel("Invite", {
    id: type.string().default(r.uuid()), //We'll use IDs to make links to specific invites
    firstName: type.string().default(''), // first name of the invitor
    lastName: type.string().default(''),
    username: type.string().default(''),
    userId: type.string(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string()
});

Invite.ensureIndex("id");
module.exports = Invite;

var User = require('./user');
Invite.hasOne(User, 'user', 'userId', 'id')
