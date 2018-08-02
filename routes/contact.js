var User = require('../models/user');
var Contact = require('../models/contact');
var Phone = require('../models/phone');
var Email = require('../models/email');
var Image = require('../models/image');
var express = require('express');
var router = express.Router();
var thinky = require('../util/thinky.js');
var dbconfig = require('../config/config.js')['rethinkdb'];
var r = thinky.r;
var Promise = require('bluebird')

module.exports = function(passport) {
    //Function to return a promise
    function promisify(emails, phones){
      return Promise.join(
       Promise.resolve(Phone.getAll(r.args(phones), {index: 'id'}).run()),
       Promise.resolve(Email.getAll(r.args(emails), {index: 'id'}).run())
     );
    }
    //Get all your contacts
    router.get('/', function(req, res){
      if(!req.user.hasContacts) return res.status(400).send({status: 400, message: "You currently don't have any contacts"})
      Contact.filter({createdBy: req.user.id}).orderBy(r.asc("firstName")).run().then((contacts)=>{
        return res.status(200).send({status: 200, message: "Successfully retrieved contacts", contacts: contacts})
      })
    })
    //get a Contact
    router.get('/:id', function(req, res) {
        Contact.get(req.params.id).getJoin({emails: true, phones: true}).run().then((contact) => {
            if (contact.createdBy == req.user.id) {
                return res.status(200).send({status: 200, contact: contact})
            } else {
                return res.status(404).send({status: 404, message: "Contact not found."})
            }
        }).error((error) => {
            return res.status(400).send({status: 400, message: error})
        })
    })
    //delete a Contact
    router.delete('/:id', function(req, res) {
        Contact.get(req.params.id).run().then((contact) => {
            if (contact.createdBy == req.user.id) {
                contact.delete().then((result) => {
                    return res.status(200).send({status: 200, message: "Contact deleted"});
                })
            } else {
                return res.status(404).send({status: 404, message: "Contact not found."})
            }
        }).error((err) => {
            return res.status(400).send({status: 400, message: err})
        })

    })
    //update a Contact
    router.put('/:id', function(req, res) {})

    router.post('/single', (req, res)=>{
      var contact = req.body.contact;
      if(!contact) return res.status(400).send({status: 400, message: "No contact provided"})
      if(!contact.firstName) return res.status(400).send({status: 400, message: "Missing fields"})
      var newContact = new Contact({
        firstName: contact.firstName,
        lastName: contact.lastName ? contact.lastName : "",
        phones: contact.phones,
        emails: contact.emails,
        createdBy: req.user.id
      }).save().then((contact)=>{
        return res.status(200).send({status: 200, message: "Contact saved successfully", contact: contact})
      }).error(err=>{
        return res.status(400).send({status: 400, message: err})
      })
    })
    //upload bulk contacts
    router.post('/bulk', function(req, res) {
        var promises = []
        var rawContacts = req.body.contacts;
        var unsavedEmails = [];
        var unsavedPhones = [];

        var emails = [];
        var phones = [];

        if(!rawContacts ) return res.status(400).send({status: 400, message: "No contacts provided"})
        if(req.user.hasContacts) return res.status(400).send({status: 200, message: "Already have contacts"})

        Contact.getAll(req.user.id, {index: 'createdBy'}).delete().run().then((result)=>{

        rawContacts.forEach((contact)=>{
            if(contact.emails)
            contact.emails.forEach((email)=>{
                emails.push(email);
            })
            if(contact.phones)
            contact.phones.forEach((phone)=>{
                phones.push(phone);
            })

            return contact
        })
        promisify(emails, phones).then((things)=>{
            var foundEmails = things[1];
            var foundPhones = things[0];
            var contactsToSave = [];
            var fEmails = [];
            var fPhones = [];
            foundEmails.forEach((e)=>fEmails.push(e.id));
            foundPhones.forEach((p)=>fPhones.push(p.id));
            var emailsToSave=[];
            var phonesToSave=[];

            rawContacts.forEach((contact)=>{
                if(!contact.emails) contact.emails = [];
                if(!contact.phones) contact.phones = [];
                contact.emails.forEach((email)=>{
                    var index = fEmails.indexOf(email);
                    if(index > -1){

                        if(foundEmails[index].userId){
                            contact.userId = foundEmails[index].userId;
                        }
                    }
                })

                if(!contact.userId){
                    contact.phones.forEach((phone)=>{
                        var index = fPhones.indexOf(phone);
                        if(index > -1){
                            if(foundPhones[index].userId){
                                contact.userId = foundPhones[index].userId;
                            }
                        }
                    })
                }

                var contactSave = new Contact({
                    phones: contact.phones,
                    emails: contact.emails,
                    userId: contact.userId,
                    createdBy: req.user.id
                });

                if(contact.firstName) contactSave.firstName = contact.firstName;
                if(contact.lastName)  contactSave.lastName = contact.lastName;
                if(contact.profilePic){
                  if(contact.profilePic.imageData || contact.profilePic.imageType ) {
                    if(!contact.profilePic.imageData || !contact.profilePic.imageType) res.status(400).send({status:400, message: "Missing image type or data"});
                    contactSave.profilePic = new Image({
                      imageData: contact.profilePic.imageData,
                      type: contact.profilePic.imageType,
                      createdBy: req.user.id,
                    })
                        contactsToSave.push(Promise.resolve(contactSave.saveAll({profilePic: true})));
                  }
                } else {
                  contactsToSave.push(Promise.resolve(contactSave.save()));
                }


            })
            Promise.all(contactsToSave).then((contacts)=>{
                // var reSaveContacts = [];
                var miniContacts = []

                req.user.hasContacts = true;
                req.user.save().then((user)=>{

                  return res.status(200).send({
                      status:  200,
                      message: "Saved contacts successfully",
                      contacts: contacts
                  })
                })

            })
        });
      })
    })
    //search your contacts by email
    router.get('/find/email/:email', function(req, res) {})
    //search your contacts by phone
    router.get('/find/phone/:phone', function(req, res) {})
    return router;
}
