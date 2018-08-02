var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Where = thinky.createModel("Where", {
    id: type.string().default(r.uuid()),
    googlePlacesId: type.string(),
    lat: type.number(),
    lon: type.number(),
    fullAddress: type.string(),
    locationName: type.string(),
    street: type.string(),
    city: type.string(),
    state: type.string(),
    zip: type.string(),
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
Where.ensureIndex("id");
module.exports = Where;

var Teeup = require('./teeup.js');
var User = require('./user.js');

Where.hasOne(User, "creator", "createdBy", "id");
Where.hasOne(Teeup, "teeup", "teeupId", "id");
