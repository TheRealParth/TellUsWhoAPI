var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var When = thinky.createModel("When", {
    id: type.string().default(r.uuid()),
    fromDate: type.date(),
    toDate: type.date(),
    fromTime: type.date(),
    toTime: type.date(),

    dateText: type.string(),
    timeText: type.string(),

    thumbsUp: [type.string()],
    thumbsDown: [type.string()],
    thumbsUpCount: type.virtual().default(function(){
      return this.thumbsUp.length
    }),
    thumbsDownCount: type.virtual().default(function(){
      return this.thumbsDown.length
    }),
    teeupId: type.string().required(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string()
});
When.ensureIndex("id");
module.exports = When;

var Teeup = require('./teeup.js');
var User = require('./user.js');

When.hasOne(User, "creator", "createdBy", "id");
When.hasOne(Teeup, "teeup", "teeupId", "id");
