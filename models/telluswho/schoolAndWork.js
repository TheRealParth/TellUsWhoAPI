var thinky = require('../../util/telluswhoDB.js');

var type = thinky.type;
var r = thinky.r;

var SchoolAndWork = thinky.createModel("SchoolAndWork", {
    id: type.string().default(r.uuid()),

    organizations: type.array().schema(type.string()),
    internationalStudentStatus: type.boolean().default(0),
    majors: type.array().schema(type.string()),
    graduate: type.number(),// 0 unset 1 is true 2 is false
    studentType: type.number(), //1 is fullTime 2 is part time
    doesWork: type.number(),// 0 unset 1 is true 2 is false
    doesVolunteer: type.number(),// 0 unset 1 is true 2 is false
    workField: type.string(),
    workPlace: type.string(),
    volunteerField: type.string(),
    volunteerPlace: type.string(),
    firstYear: type.number(),// 0 unset 1 is true 2 is false
    lengthOfStayAtNJIT: type.string(),

    profileId: type.string(),
    createdBy: type.string(),
    createdAt: type.date().default(r.now())
});

SchoolAndWork.ensureIndex("id");
SchoolAndWork.ensureIndex("createdBy");
SchoolAndWork.ensureIndex("profileId");
module.exports = SchoolAndWork;
