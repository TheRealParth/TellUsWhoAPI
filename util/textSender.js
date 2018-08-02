

var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";
var ADDRESS = "http://" + addr + ":" + port;
var client = require('twilio')('AC6fe5cd83c412e08a5199c7256f8cd1b7', '8e0ea58c2452db73a23bf807ae7c511d');

var sendTextToUser = function(phone, text, callback) {
     //Send an SMS text message
     client.sendMessage({

         to: phone, // Any number Twilio can deliver to
         from: '+15416393977', // A number you bought from Twilio and can use for outbound communication
         body: text // body of the SMS message

     }, function(err, responseData) { //this function is executed when a response is received from Twilio

         if (!err) { // "err" is an error received during the request, if any

             // "responseData" is a JavaScript object containing data received from Twilio.
             // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
             // http://www.twilio.com/docs/api/rest/sendingsms#example1

             ; // outputs "+14506667788"
             ; // outputs "word to your mother."

         }

         callback(err, responseData);
     });
 };
exports.sendVerificationText = function(phone, cb){
  sendTextToUser(phone.id, "Your verification code is " + phone.validationCode,  cb)
}
exports.sendInvitationText = function(phones, username, teeup, cb){
  sendTextToUser(phones, "You have been invited to teeup by " + username + ". \n \"" + teeup.title + ": " + teeup.message + "\" ",  cb)
}
