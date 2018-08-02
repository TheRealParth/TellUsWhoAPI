var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var Interest = thinky.createModel("Interest", {
    id: type.string().default(r.uuid()),
    title: type.string(),
    category: type.string(),
    subcategory: type.string(),
     //0 means unset, 1 is base and can go up to n (depending on option for each one)
    levelOfPassion: type.number().default(0),
    levelOfExpertise: type.number().default(0),
    willingToTeach: type.number().default(0),
    willingToBeTaught: type.number().default(0),
    doingInGroup: type.number().default(0),
    methodInGroup: type.array(type.string()).default(function(){
        return [];
    }),
    lookingForOthers: type.boolean().default(false), //0 is unset 1 is true 2 is false

    profileId: type.string(),
    createdBy: type.string(),
    createdAt: type.date().default(r.now())
});

Interest.ensureIndex("id");
Interest.ensureIndex("createdBy");
Interest.ensureIndex("profileId");

module.exports = Interest;

var Profile = require('./profile.js');
var Place = require('./place.js');

Interest.hasMany(Place, "places", "id", "interestId")
Interest.belongsTo(Profile, "profile", "profileId", "id");
