var Contact = require('../models/contact');
var Email = require('../models/email');
var Phone = require('../models/phone');
var User = require('../models/user');
var thinky = require('../util/thinky.js');
var r = thinky.r;

exports.messagingFunctions = (socket) => {
  var userId = false;
  if( socket && socket.handshake && socket.handshake.session && socket.handshake.session.passport && socket.handshake.session.passport.user) {
    userId = socket.handshake.session.passport.user.id;
  }
  socket.on('emailValidationListener', (message)=>{
    if(userId){
      Email.filter({userId: userId}).changes().then((doc)=>{
        doc.each((error, doc) => {
          if(error) ;
          socket.emit('updatedEmail', doc);
        })
      })
    } else {
      socket.emit('updatedEmail', false);
    }
  })
  socket.on('phoneValidationListener', (message)=>{
    if(userId){
      Phone.filter({userId: userId}).changes().then((doc)=>{
        doc.each((error, doc) => {
          if(error) ;
          socket.emit('updatedPhone', doc);
        })
      })
    } else {
      socket.emit('updatedPhone', false)
    }
  })
  socket.on('contactsListener', () => {
      User.get(userId).changes().then((updatedUser)=>{
        if(updatedUser.hasContacts) {
          socket.emit('hasContacts', true)
        }
    })
  })
}
