var thinky = require('../util/telluswhoDB.js');
var type = thinky.type;
var r = thinky.r;


var Contact = thinky.createModel("Contact", {
    id: type.string().default(r.uuid()),
    userId: type.string(),
    firstName: type.string(),
    lastName: type.string(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string(),
    emails: type.array().schema(type.string()),
    phones: type.array().schema(type.string()),


    selected: type.virtual().default(function(){
      return false;
    }),

    close: type.number().default(0), // 0 is unset 1 is least and 4 or 5 however many options there happen to be is the max.
    meet: type.number().default(0), // 0 is unset 1 is least and 4 or 5 however many options there happen to be is the max.
    known: type.number().default(0),
    communication: type.number().default(0),
    country: type.number().default(0),
    language: type.number().default(0),
    gender: type.number().default(0),
    major: type.number().default(0),
    technology: type.number().default(0),
    introducedBySomeone: type.number().default(0),

    supportFriend: type.boolean().default(false),
    emergencyFriend: type.boolean().default(false),
    notFacebookFriend: type.boolean().default(false),


    tags: type.array().default(function(){
      return [];
    }).schema(type.object()),
    //These are variables for the People section of Cooe and Social section of telluswho
    positions: type.array().default(function(){
      return [];
    }).schema(type.object().schema({
      x: type.number(),
      y: type.number()
    })),
    groups: type.array().default(function(){
      return [];
    }).schema(type.object()),
});
Contact.ensureIndex('cardCount');
Contact.ensureIndex('firstName');
Contact.ensureIndex("id");
Contact.ensureIndex("createdBy");
module.exports = Contact;

var Image = require('./image.js');
var Phone = require('./phone.js');
var Email = require('./email.js');
var Interest = require('./telluswho/interest.js')
Contact.hasMany(Interest, "interests", "id", "profileId");
var Interest = require('./telluswho/interest.js')
