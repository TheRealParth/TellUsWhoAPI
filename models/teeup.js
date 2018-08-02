var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Teeup = thinky.createModel("Teeup", {
    id: type.string().default(r.uuid()),
    title: type.string().required(),
    message: type.string(),
    gamePlanWhenId: type.string(),
    gamePlanWhereId: type.string(),
    //this is the status of the teeup not the status of the participant inside the teeup
    status: type.number().default(0).required(), //0 = Planning, 1 = its on, 2 = Happening, 3 = it's Ended, 4 = Cancelled
    whenDecided: type.boolean().default(false),
    whereDecided: type.boolean().default(false),
    settings: type.object().schema({
        isPublic: type.boolean().default(false).required(), // can anyone look at the teeup?
        join: type.boolean().default(false).required(), // can anyone join?
        invite: type.boolean().default(true).required(), // can anyone invite?
        suggest: type.boolean().default(true).required(), // can anyone make a suggestion?
        decideGamePlan: type.boolean().default(false).required(), // can anyone choose the gameplay?
        modifyRow: type.boolean().default(false).required() //can anyone modify the gameplan rows?
    }).default({}),
    autoChangeSettings: type.object().schema({
        itsOnMin: type.number().default(0), // minimum number of users to auto set teeup to its on status (0 means none set)
        happeningIfWhenIsReached: type.boolean().default(false), //Exact date/time required
        requireWhenBeDecided: type.boolean().default(false), // sub option to the happeningIfWhenIsReached (must be true to set)
        requireItsOnBeSet: type.boolean().default(false),
        remindParticipants: type.number().default(0).required(), // default  0-> means use toDate MUST BE SET
        remindParticipantsWithNudge: type.number().default(0), // The amount of time BEFORE the state auto changes to "happening" to remind users via nudge
        itsEndedTime: type.date(), // custom time at which to set ended at
                                   //its ended options
        itsEndedOption: type.number().default(0), // Option to select when to autoset teeup status to its ended
                                                  // 0 = Set to its ended at the end of the same day it "happens"
                                                  // 1 = Set to its ended at the toDate from the decided gameplan
                                                  // 2 = Use itsEndedTime to set the date to itsEnded
        itsEndedJobId: type.number().default(-1),
        happeningJobId: type.number().default(-1),
    }).default({}),
    updatedAt: type.date().default(r.now()),
    createdAt: type.date().default(r.now()),
    createdBy: type.string().required()
});
Teeup.ensureIndex("id");
Teeup.ensureIndex("updatedAt");
Teeup.defineStatic("viewable", function() {
    return this.without(['settings', 'organizers', 'status', 'whenSuggestions', 'whereSuggestions']);
});
module.exports = Teeup;

var When = require('./when.js');
var Where = require('./where.js');
var User = require('./user.js');
var Participant = require('./participant.js');

Teeup.hasMany(Participant, "participants", "id", "teeupId");
Teeup.hasOne(User, "creator", "createdBy", "id");
Teeup.hasMany(When, "whenSuggestions", "id", "teeupId");
Teeup.hasMany(Where, "whereSuggestions", "id", "teeupId");
Teeup.hasOne(When, "gamePlanWhen", "gamePlanWhenId", "id");
Teeup.hasOne(Where, "gamePlanWhere", "gamePlanWhereId", "id");
