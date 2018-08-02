var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var User = thinky.createModel("User", {
    id: type.string().default(r.uuid()),
    username: type.string().required(),
    password: type.string(),
    firstName: type.string(),
    lastName: type.string(),
    fullName: type.virtual().default(function () {
        return this.firstName + " " + this.lastName;
    }),
    hasCompletedSurvey: type.boolean().default(false),
    primaryEmail: type.string(),
    primaryPhone: type.string(),
    forgotCode: type.number(),
    forgotExpires: type.date(),
    pushTokens: type.array().schema(type.string()).default([]),
    profilePicId: type.string(),
    profilePicPath: type.string().default(""),
    facebookProfilePicUrl: type.string(),
    googleProfilePicUrl: type.string(),
    facebookId: type.string(),
    googleId: type.string(),
    hasContacts: type.boolean().default(false),
    profile: type.object().schema({
        Bio: type.string(),
        Dob: type.date(),
        gender: type.number(), //0 = male, 1 = female I think TODO: Check and confirm with Quentin
        nationality: type.number(), //TODO: Make a list associated with the various types of nationalities
        nativeLanguage: type.number(), // TODO: Same as above
        hometown: type.string(), // TODO: Check if it should be a place object instead?
        school: type.string(), // TODO: should it be a place or a predefined list with associated numbers?
        studentType: type.number(), // 0 = full time, 1= part time
        internationalStudentStatus: type.boolean(), // 1 = intenational student
        majors: type.array().schema(type.string()), //TODO: Should it be a predefined list of items with associated number?
        campusOrganizations: type.array().schema(type.string()) //TODO: same as above.
    }).default({}), //asdf
    privacy: type.object().schema({
        Bio: type.number().default(0), // 0 = anyone can see, 1 = "mates" can see, 2 = only me
        Dob: type.number().default(0),
        gender: type.number().default(0),
        nationality: type.number().default(0),
        nativeLanguage: type.number().default(0),
        hometown: type.number().default(0),
        school: type.number().default(0),
        studentType: type.number().default(0),
        internationalStudentStatus: type.number().default(0),
        majors: type.number().default(0),
        campusOrganizations: type.number().default(0)
    }).default({}),
    settings: type.object().schema({
        notifications: type.boolean().default(true),
        loginMethod: type.number().default(0)
    }).default({}),
    createdAt: type.date().default(r.now())
});

User.ensureIndex("username");
User.ensureIndex("facebookId");
User.ensureIndex("googleId");
User.ensureIndex("id");
User.defineStatic("noPass", function () {
    return this.without('password');
});
//TODO make this method work, it doesn't filter out all the attributes
User.defineStatic("viewable", function () {
    return this.without([
        'password',
        'phone',
        'contacts',
        'profile',
        'privacy',
        'forgotCode',
        'forgotExpires',
        'settings'
    ]);
});
User.defineStatic("fullName", function () {
    return this.firstName + " " + this.lastName;
});
User.defineStatic('uniqueResult', function () {
    return this.nth(0).default(r.error("Document not found"))
});
User.defineStatic('simple', function (user) {
    return this.without([
        'password',
        'phone',
        'contacts',
        'profile',
        'privacy',
        'forgotCode',
        'forgotExpires',
        'settings'
    ]);
});
module.exports = User;
var Teeup = require('./teeup.js');
var Email = require('./email.js');
var Image = require('./image.js');
var Feedback = require('./feedback.js');
var Phone = require('./phone.js');
var Profile = require('./telluswho/profile.js');
var Google = require('./google.js');
var Facebook = require('./facebook.js');

User.hasMany(Google, "google", "id", "userId");
User.hasMany(Facebook, "facebook", "id", "userId");
User.hasMany(Email, "emails", "id", "userId");
User.hasMany(Phone, "phones", "id", "userId");

User.hasOne(Image, "profilePic", "profilePicId", "id");
User.hasOne(Profile, "telluswho", "profileId", "id");
// User.hasMany(Image, "userImages", "id", "createdBy");
User.hasMany(Teeup, "myTeeups", "id", "createdBy");
// User.hasMany(Contact, "myContacts", "id", "createdBy");
//User.belongsTo(Teeup, "myTeeups", "id", "createdBy");
User.hasMany(Feedback, "feedback", "id", "createdBy");
