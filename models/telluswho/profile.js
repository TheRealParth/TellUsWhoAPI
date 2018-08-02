var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var Profile = thinky.createModel("Profile", {
    id: type.string().default(r.uuid()),
    userId: type.string().required(),
    senseOfCommunityId: type.string(),
    sociabilityId: type.string(),
    wellbeingId: type.string(),
    schoolAndWorkId: type.string(),
    backgroundInfoId: type.string(),
    hasInterests: type.boolean().default(false),
    hasPassion: type.boolean().default(false),
		hasExpertise: type.boolean().default(false),
		hasTeach: type.boolean().default(false),
    hasTaught: type.boolean().default(false),
		hasGroup: type.boolean().default(false),
		hasGroupMethod: type.boolean().default(false),
		hasOthers: type.boolean().default(false),
		hasPlaces: type.boolean().default(false),
    hasTags: type.boolean().default(false),
    doneTagsQuestions: type.boolean().default(false), //doneTags
    doneGroupContacts: type.boolean().default(false), //doneGroup
    doneSortContacts: type.boolean().default(false), //doneContacts
    doneBucketQuestions: type.boolean().default(false), //doneContactsQuestions
    doneSelectContacts: type.boolean().default(false), //doneSelect
    doneSocial: type.boolean().default(false),
    tagsQuestionsProgress: type.number().default(0),
    bucketQuestionsProgress: type.number().default(0),
    selectContactsProgress: type.number().default(0),
    tags: type.array().default(function(){
      return [];
    }).schema(type.object()),
    groups: type.array().default(function(){
      return [];
    }).schema(type.object()),
    hasReviewedProfile: type.boolean().default(false),
    createdAt: type.date().default(r.now())
});

Profile.ensureIndex("id");
Profile.ensureIndex("userId");

module.exports = Profile;

var SenseOfCommunity = require('./senseOfCommunity.js')
var Wellbeing = require('./wellbeing.js')
var SchoolAndWork = require('./schoolAndWork.js')
var Sociability = require('./sociability.js')
var BackgroundInfo = require('./backgroundInfo.js')
var Interest = require('./interest.js')


Profile.hasOne(SenseOfCommunity, "senseOfCommunity", "senseOfCommunityId", "id");
Profile.hasOne(Wellbeing, "wellbeing", "wellbeingId", "id");
Profile.hasOne(Sociability, "sociability", "sociabilityId", "id");
Profile.hasOne(SchoolAndWork, "schoolAndWork", "schoolAndWorkId", "id");
Profile.hasOne(BackgroundInfo, "backgroundInfo", "backgroundInfoId", "id");
Profile.hasMany(Interest, "interests", "id", "profileId");
