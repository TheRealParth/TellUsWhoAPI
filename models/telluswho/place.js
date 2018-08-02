var thinky = require('../../util/telluswhoDB.js');
var type = thinky.type;
var r = thinky.r;

var Place = thinky.createModel("Place", {
    id: type.string().default(r.uuid()),
    placesId: type.string().required(),
    fullAddress: type.string(),
    locationName: type.string(),
    interestId: type.string().required(),
    createdAt: type.date().default(r.now()),
    createdBy: type.string()
});
Place.ensureIndex("id");
module.exports = Place;