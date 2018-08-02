var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var SenseOfCommunity = thinky.createModel("SenseOfCommunity", {
    id: type.string().default(r.uuid()),
    //0 means unset 1-5 should be accept values
    studentsCare: type.number().default(0),
    facultyCare: type.number().default(0),
    connected: type.number().default(0),
    community: type.number().default(0),
    likeFamily: type.number().default(0),
    isolated: type.number().default(0),
    friendSupport: type.number().default(0),
    satisfied: type.number().default(0),
    loan: type.number().default(0),
    advice: type.number().default(0),

    profileId: type.string(),
    createdBy: type.string(),
    createdAt: type.date().default(r.now())
});

SenseOfCommunity.ensureIndex("id");
SenseOfCommunity.ensureIndex("createdBy");
SenseOfCommunity.ensureIndex("profileId");
module.exports = SenseOfCommunity;
