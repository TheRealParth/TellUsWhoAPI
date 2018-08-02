var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var Wellbeing = thinky.createModel("Wellbeing", {
    id: type.string().default(r.uuid()),

    //0 means unset 1-5 should be accept values
    physicalHealth: type.number().default(0),
    happyAtNjit: type.number().default(0),
    stayAtNjit: type.number().default(0),
    lackCompanionShip: type.number().default(0),
    feelLeftOut: type.number().default(0),
    feelIsolated: type.number().default(0),
    feelFailure: type.number().default(0),
    highSelfEsteem: type.number().default(0),
    lifeIdeal: type.number().default(0),
    lifeExcellent: type.number().default(0),
    lifeSatisfied: type.number().default(0),
    doNotHaveProud: type.number().default(0),

    profileId: type.string(),
    createdBy: type.string(),
    createdAt: type.date().default(r.now())
});

Wellbeing.ensureIndex("id");
Wellbeing.ensureIndex("createdBy");
Wellbeing.ensureIndex("profileId");
module.exports = Wellbeing;
