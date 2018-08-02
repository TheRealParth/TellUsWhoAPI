var thinky = require('../util/thinky.js');

var type = thinky.type;
var r = thinky.r;

var Message = thinky.createModel("Message", {
    id: type.string().default(r.uuid()),
    actionType: {
        _type: String,
        enum: [
            "MESSAGE",
            "TEEUP_CREATED", "TEEUP_STATUS_CHANGE",
            "WHERE_SUGGESTION", "WHEN_SUGGESTION",
            "USER_STATUS_CHANGE",
            "WHEN_VOTE_UP", "WHEN_VOTE_DOWN", "WHERE_VOTE_UP", "WHERE_VOTE_DOWN",
            "INVITED_USERS",
            "TITLE_CHANGE",
            "GAMEPLAN_WHEN_SET", "GAMEPLAN_WHERE_SET",
            "GAMEPLAN_WHEN_DECIDED", "GAMEPLAN_WHERE_DECIDED", "GAMEPLAN_WHEN_UNDECIDED", "GAMEPLAN_WHERE_UNDECIDED",
            "ORGANIZER_SET", "ORGANIZER_UNSET"
        ]
    },
    message: type.string(),
    whenId: type.string(),
    whereId: type.string(),
    newTitle: type.string(),
    oldTitle: type.string(),
    newRole: type.string(),
    newUserStatus: type.string(),
    newTeeupStatus: type.string(),
    participantId: type.string(),
    invitedUsers: type.array().schema(type.object().schema({})),
    teeupId: type.string().required(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string().required()
});
Message.ensureIndex("id");
Message.ensureIndex("teeupId");
module.exports = Message;

var When = require('./when.js');
var Where = require('./where.js');
var User = require('./user.js');
var Participant = require('./participant.js');

Message.hasOne(When, "when", "whenId", "id");
Message.hasOne(Where, "where", "whereId", "id");
Message.hasOne(User, "creator", "createdBy", "id");
Message.hasOne(Participant, "participant", "participantId", "id");
