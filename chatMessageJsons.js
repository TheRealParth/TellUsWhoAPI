var ACTION_TYPE = {
  "USER_STATUS_CHANGE" : "User has changed status",
  "WHEN_SUGGESTION" : "User has changed status",
  "WHERE_SUGGESTION" : "User has changed status",
  "WHEN_VOTE_UP" : "User has changed status",
  "WHEN_VOTE_DOWN" : "User has changed status",
  "WHERE_VOTE_UP" : "User has changed status",
  "WHERE_VOTE_DOWN" : "User has changed status",
  "INVITED_USERS" : "User has changed status",
  "TITLE_CHANGE" : "User has changed status",
  "GAMEPLAN_SET" : "User has changed status",
  "ORGANIZER_SET" : "Set a participant to be organizer role",
  "ORGANIZER_UNSET" : "Set a participant to be participant role",
  "GAMEPLAN_WHEN_SET": "Set a gameplan when",
  "GAMEPLAN_WHERE_SET": "Set a new gampplan where"
}



{
  actionType: "USER_STATUS_CHANGE",
  userId: "asdfasdfasdfadsfsadf",
  newStatus: 3,
}

{
  actionType: "TITLE_CHANGE",
  userId: "LKSJDFLKJSDKLFJSLDKF",
  newTitle: "New title dog"
}

{
  actionType: "ORGANIZER_SET",
  userId: "SDFJLSJF",
  participantId: "LAJFKLADJF",
  newRole: 1
}

{
    actionType: "ORGANIZER_UNSET",
    userId: "SDFJLSJF",
    participantId: "LAJFKLADJF",
    newRole: 2
}

{
  actionType: "WHEN_VOTE_UP",
  when: {
    id: "IDGOESHERE",
    fromDate: "FROM DATE ( COMES AS INT in milliseconds)",
    toDate: "TO DATE ( COMES AS INT in milliseconds)",
    thumbsUp: ["ARRAY OF USER ID"],
    thumbsDown: ["ARRAY OF USER ID"],
    createdBy: "User id"
  }
  userId: "lskdjfklajsdklfjlk"
}

{
  actionType: "WHEN_VOTE_DOWN",
  when: {
    id: "IDGOESHERE",
    fromDate: "FROM DATE ( COMES AS INT in milliseconds)",
    toDate: "TO DATE ( COMES AS INT in milliseconds)",
    thumbsUp: ["ARRAY OF USER ID"],
    thumbsDown: ["ARRAY OF USER ID"],
    createdBy: "User id"
  }
  userId: "lskdjfklajsdklfjlk"
}

{
  actionType: "WHERE_VOTE_UP",
  whereId: "SDJFOISJEFOJSEOIFJ",
  userId: "lskdjfklajsdklfjlk"
}

{
  actionType: "WHERE_VOTE_DOWN",
  whereId: "SDJFOISJEFOJSEOIFJ",
  userId: "lskdjfklajsdklfjlk"
}


{
  actionType: "INVITED_USERS",
  invitedUsers: ["USERID1", "USERID2"],
  invitedEmails: ["EMAIL1", "EMAIL2"],
  invitedPhones: ["PHONE1", "PHONE2"],
  userId: "lskdjfklajsdklfjlk"
}
