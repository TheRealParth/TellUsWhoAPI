var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var Sociability = thinky.createModel("Sociability", {
    id: type.string().default(r.uuid()),
    //0 means unset 1-5 should be accept values
    likePeople: type.number().default(0),
    mixSocially: type.number().default(0),
    preferOthers: type.number().default(0),
    peopleStimulating: type.number().default(0),
    makingContacts: type.number().default(0),
    sociallyAwkward: type.number().default(0),
    talkToStrangers: type.number().default(0),
    tenseWithStrangers: type.number().default(0),
    tenseWithPeople: type.number().default(0),
    nervousAuthority: type.number().default(0),
    uncomfortableParties: type.number().default(0),
    oppositeSex: type.number().default(0),

    profileId: type.string(),
    createdBy: type.string(),
    createdAt: type.date().default(r.now())
});

Sociability.ensureIndex("id");
Sociability.ensureIndex("createdBy");
Sociability.ensureIndex("profileId");
module.exports = Sociability;
