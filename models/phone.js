var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Phone = thinky.createModel("Phone", {
    id: type.string(), //must be phone number
    contactId: type.string(),
    isValidated: type.boolean().default(false),
    validationCode: type.number().default(function(){
        return Math.floor((Math.random() * 8999) + 1000);
    }),
    userId: type.string(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string()
});
Phone.ensureIndex("id");
module.exports = Phone;
var Contact = require('./contact');
var User = require('./user');

Phone.belongsTo(User, "user", "userId", "id");
