var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport('smtps://letsteeupguys%40gmail.com:labr0xhomie@smtp.gmail.com')
var addr = process.env.ADDRESS || "localhost";
var port = process.env.PORT || "8080";
var ADDRESS = "http://" + addr + ":" + port;

exports.sendVerificationEmail = function(emails, username, cb){
  emails.forEach((email)=>{
    var subject = "Coo-e Email Verification"
    var body = '<b> Verify your account ' + username + ', via this link.  <br> </b> <br> ' + ADDRESS + '/api/email/' + email.id  + '/'+ email.validationCode ; // html body
    var mailOptions = {
        from: '"Cooe" <donotreply@cooe.com>', // sender address
        to: email.id, // list of receivers
        subject: subject, // Subject line
        text: '', // plaintext body
        html: body
    };
    transporter.sendMail(mailOptions, cb);
  })
}

exports.sendTelluswhoVerificationEmail = function(emails, username, cb){
  emails.forEach((email)=>{
    var subject = "TellUsWho Email Verification"
    var body = '<b> Verify your account ' + username + ', via this link.  <br> </b> <br> ' + ADDRESS + '/api/email/' + email.id  + '/'+ email.validationCode ; // html body
    var mailOptions = {
        from: '"TellUsWho" <donotreply@telluswho.com>', // sender address
        to: email.id, // list of receivers
        subject: subject, // Subject line
        text: '', // plaintext body
        html: body
    };
    transporter.sendMail(mailOptions, cb);
  })
}

exports.sendInvitationEmails = function(emails, username, teeup, cb){
  var subject = "Coo-e Teeup Invitation"
  var body = '<b> You have been invited to teeup by ' + username + ','; // html body
  var mailOptions = {
      from: '"Cooe" <donotreply@cooe.com>', // sender address
      to: emails, // list of receivers
      subject: subject, // Subject line
      text: '', // plaintext body
      html: body
  };
  transporter.sendMail(mailOptions, cb);
}

exports.sendForgotPasswordEmail = function(email, username, code, cb) {
  var subject = "TellUsWho Password Reset"
  var body = '<b> Password reset for ' + username + ', Here is the link to reset your password: <br> </b> <br> ' + 'http://' + addr + ':3000' + '/SetPassword/' + email + '/'+ code +'<br>' +
    'If you did not request this, please ignore this email.';
  var mailOptions = {
      from: '"Cooe" <donotreply@cooe.com>', // sender address
      to: email, // list of receivers
      subject: subject, // Subject line
      text: '', // plaintext body
      html: body
  };
    transporter.sendMail(mailOptions, cb);
}
