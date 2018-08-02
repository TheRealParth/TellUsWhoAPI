exports.backgroundInfoCheck = function(bgInfo){
  if (!bgInfo.onCampus) return {status: 400, message: "Missing field onCampus"};
  if (!bgInfo.dob) return {status: 400, message: "Missing field DOB"};
  if (!bgInfo.gender) return {status: 400, message: "Missing field gender"};
  if (!bgInfo.nationality.length) return {status: 400, message: "Missing field nationality"};
  if (!bgInfo.nativeLanguage) return {status: 400, message: "Missing field nativeLanguage"};
  if (!bgInfo.otherLanguages) return {status: 400, message: "Missing field otherLanguages"};
  if (!bgInfo.sexualIdentification) return{
      status: 400,
      message: "Missing field sexualIdentification"
  };
  if (!bgInfo.relationshipStatus) return{
      status: 400,
      message: "Missing field relationshipStatus"
  };
  if ((bgInfo.onCampus == 2) && !bgInfo.currentCountry) return{
      status: 400,
      message: "Missing field currentCountry"
  };
  if ((bgInfo.onCampus == 2) && !bgInfo.currentCity) return{
      status: 400,
      message: "Missing field currentCity"
  };
  if ((bgInfo.onCampus == 2) && !bgInfo.currentState) return{
      status: 400,
      message: "Missing field currentState"
  };
  if (!bgInfo.grownCountry && !bgInfo.grownNonUSA) return {status: 400, message: "Missing field grownCountry"};
  if (!bgInfo.grownCity && !bgInfo.grownNonUSA) return {status: 400, message: "Missing field grownCity"};
  if (!bgInfo.grownState && !bgInfo.grownNonUSA) return {status: 400, message: "Missing field grownState"};
  if (!bgInfo.liveWith) return {status: 400, message: "Missing field liveWith"};
  if ((bgInfo.onCampus == 1) && !bgInfo.campusHousing) return{
      status: 400,
      message: "Missing field campusHousing"
  };

  return false;
}


exports.schoolAndWorkCheck = function(schoolAndWork){

  if (!schoolAndWork.majors) return {status: 400, message: "Missing field majors"};

  if (!schoolAndWork.graduate) return {status: 400, message: "Missing field graduate"};
  if (!schoolAndWork.studentType) return {status: 400, message: "Missing field studentType"};
  if (!schoolAndWork.doesWork) doesWork = 2;
  if (!schoolAndWork.doesVolunteer) doesVolunteer = 2;
  if ((schoolAndWork.doesWork == 1) && !schoolAndWork.workField) return {status: 400, message: "Missing field workField"};
  if ((schoolAndWork.doesWork == 1) && !schoolAndWork.workPlace) return {status: 400, message: "Missing field workPlace"};
  if ((schoolAndWork.doesVolunteer == 1) && !schoolAndWork.volunteerField) return{
      status: 400,
      message: "Missing field volunteerField"
  };
  if ((schoolAndWork.doesVolunteer == 1) && !schoolAndWork.volunteerPlace) return{
      status: 400,
      message: "Missing field volunteerPlace"
  }
  if (schoolAndWork.graduate == 2 && !schoolAndWork.firstYear) return {status: 400, message: "Missing field firstYear"};
  if (schoolAndWork.graduate == 1 && !schoolAndWork.lengthOfStayAtNJIT) return {status: 400, message: "Missing lengh of stay at NJIT"}
  return false
}

exports.interestsCheck = function(interests){
  if(!interests) return {status: 400, message: "No interests posted."};
  if(!interests.length) return {status: 400, message: "Need at least one interest posted."};
}
