var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;


var Google = thinky.createModel("Google", {
  id: type.string(),
  emails: type.array().schema(type.object().schema({
    value: type.string(),
    type: type.string()
  })),
  photos: type.array().schema(type.object().schema({
    value: type.string()
  })),
  userId: type.string(),
  displayName: type.string()
});

Google.ensureIndex("id");
Google.ensureIndex("emails");
module.exports = Google;

var User = require('./user');
Google.hasOne(User, 'user', 'userId', 'id')
