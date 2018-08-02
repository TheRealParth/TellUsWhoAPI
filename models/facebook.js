var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;


var Facebook = thinky.createModel("Facebook", {
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

Facebook.ensureIndex("id");
Facebook.ensureIndex("emails");
module.exports = Facebook;

var User = require('./user');
Facebook.hasOne(User, 'user', 'userId', 'id')
