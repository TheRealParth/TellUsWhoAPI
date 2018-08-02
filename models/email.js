var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Email = thinky.createModel("Email", {
    id: type.string(), //must be an email
    contactId: type.string(),
    isValidated: type.boolean().default(false),
    validationCode: type.number().default(function(){
        return Math.floor((Math.random() * 8999) + 1000);
    }),
    userId: type.string(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string()
});
Email.ensureIndex("id");
module.exports = Email;
var User = require('./user');

Email.hasOne(User, 'user', 'userId', 'id')
