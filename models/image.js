var thinky = require('../util/thinky.js');
var type = thinky.type;
var r = thinky.r;

var Image = thinky.createModel("Image", {
    id: type.string().default(r.uuid()),
    imageData: type.string(), //TODO: Debate and change how this will be done, maybe add imageURL?
    height: type.number(),
    width: type.number(),
    type: type.string(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string(),
    contactId: type.string()
});
Image.ensureIndex("id");
module.exports = Image;
