var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var BackgroundInfo = thinky.createModel("BackgroundInfo", {
    id: type.string().default(r.uuid()),

    dob: type.date(),
    gender: type.string(),
    nationality: type.array().schema(type.string()),
    nativeLanguage: type.string(),
    otherLanguages: type.array().schema(type.string()),
    sexualIdentification: type.string(),
    relationshipStatus: type.string(),
    currentCountry: type.string(),
    currentCity: type.string(),
    currentState: type.string(),
    grownCountry: type.string(),
    grownCity: type.string(),
    grownState: type.string(),
    grownNonUSA: type.string(),
    lengthOfStayInUSA: type.string(), 
    liveWith: type.string(),
    onCampus: type.number(),// 0 unset 1 is true 2 is false
    campusHousing: type.string(),

    profileId: type.string(),
    createdBy: type.string(),
    createdAt: type.date().default(r.now())
});

BackgroundInfo.ensureIndex("id");
BackgroundInfo.ensureIndex("createdBy");
BackgroundInfo.ensureIndex("profileId");
module.exports = BackgroundInfo;
