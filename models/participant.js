/**
 * Created by deep on 1/1/17.
 */
var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Participant = thinky.createModel("Participant", {
    id: type.string().required().default(r.uuid()),
    teeupId: type.string().required(),
    email: type.string(),
    phone: type.string(),
    userId: type.string(),
    status: type.number().default(0), // 0 = Invited, 1 = Might Go, 2 = I'm going, 3 = Interested, 4 = not going, 5 = on my way, 6 = arrived
    role: type.number().default(2), // 0 = creator, 1 = organizer, 2 = participant
    inviteDate: type.date().default(r.now()),
    invitedBy: type.string(),
});

Participant.ensureIndex("id");
Participant.ensureIndex("email");
Participant.ensureIndex("phone");
Participant.ensureIndex("userId");
Participant.ensureIndex("inviteDate");

module.exports = Participant;

var Teeup = require('./teeup.js');
var User = require('./user.js');

Participant.belongsTo(Teeup, "teeup", "teeupId", "id");
Participant.hasOne(User, "userInfo", "userId", "id");
Participant.hasOne(User, "invitedByUserInfo", "invitedBy", "id");
