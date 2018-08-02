var thinky = require('../util/thinky.js');
var User = require('./user.js');
var type = thinky.type;
var r = thinky.r;

var Feedback = thinky.createModel("Feedback", {
    id: type.string().default(r.uuid()),
    feel: type.number().required(), // 0 = sad, 1 = happy
    reason: type.string(),
    description: type.string(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string().required()
});
Feedback.ensureIndex("id");
module.exports = Feedback;
