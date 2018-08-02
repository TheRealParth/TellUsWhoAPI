var User = require('../models/user');
var Email = require('../models/email');
var Phone = require('../models/phone');
var Google = require('../models/google');
var Facebook = require('../models/facebook');
var Profile = require('../models/telluswho/profile');
var Image = require('../models/image');
var Participant = require('../models/participant');
var arrayUtil = require('../util/arrayUtil');

var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var configAuth = require('./config');
var thinky = require('../util/thinky.js');
var Promise = require('bluebird');
var r = thinky.r;
var Errors = thinky.Errors;
var regexPhone = configAuth['regexPhone'];
var regexEmail = configAuth['regexEmail'];
var fbAuth = {
    clientID: configAuth['facebookAuth']['clientID'],
    clientSecret: configAuth['facebookAuth']['clientSecret'],
    callbackURL: configAuth['facebookAuth']['callbackURL']
}
var gglAuth = {
    clientID: configAuth['googleAuth']['clientID'],
    clientSecret: configAuth['googleAuth']['clientSecret'],
    callbackURL: configAuth['googleAuth']['callbackURL']
}
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var FacebookTokenStrategy = require('passport-facebook-token');
var GoogleTokenStrategy = require('passport-google-token').Strategy;

var smsSender = require('../util/textSender')
var emailSender = require('../util/emailSender');
var chatUtil = require('../util/chat-util');
var authUtil = require('../util/auth-util');

module.exports = function (passport) {

    // Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function (user, done) {
        return done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        User.get(user.id).run().then( (user)=> {
            if (!user) {
                return done("Couldn't deserialize user... FML", null);
            }
           return done(null, user);

        }).error((err) => {
            return done(null, null);
        });
    });

    passport.use('login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },  (req, username, password, done) => {

        if (!username || !password) {
            return done(null, false, 'Missing Fields');
        }
        //
        User.getAll(r.args([req.body.username.toLowerCase()]), {index: 'username'}).getJoin({phones: true, emails: true}).run().then(function (user) {
            var user = user[0];
            if (!isValidPassword(user, password)) {
                return done(null, false, 'Invalid password.'); // redirect back to login page
            } else {
                //add the push token if the user has one
                var pushToken = req.body.pushToken;
                if (pushToken) {
                    arrayUtil.addElement(user.pushTokens, pushToken);
                    user.save();
                }
                // User and password both match, return user from done method
                // which will be treated like success
                return done(null, authUtil.viewableUser(user), 'Signed in succesfully!');
            }
        }).catch( (e)=> {
            return done(null, false, "Invalid credentials or user does not exist");
        })
    }));

    passport.use('facebookLogin', new FacebookTokenStrategy( {
        clientID: fbAuth.clientID,
        clientSecret: fbAuth.clientSecret,
    }, ( token, refresh, profile, done ) => {
        return done(null, profile)
    }))


    passport.use('googleLogin', new GoogleTokenStrategy({
            clientID: gglAuth.clientID,
            clientSecret: gglAuth.clientSecret,
    }, ( token, refresh, profile, done ) => {
        return done(null, profile)
    }))

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use('signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, username, password, done) {
        // Check if all the required fields are gotten
        //TODO: lowercase the username, and email fields.
        var facebook = req.facebook ? req.facebook : false;
        var google = req.google ? req.google : false;
        var firstName = req.body.firstName;
        var lastName = req.body.lastName ? req.body.lastName : "";
        var username = req.body.username ? req.body.username.toLowerCase() : false;
        var password = req.body.password;
        var reqPhone = req.body.phone;
        var reqEmails = req.body.email? [req.body.email.toLowerCase()] : [];
        var primaryEmail = reqEmails[0];
        var tellUsWho = (req.params.type === 'telluswho') ? true : false;


        if(facebook){
          facebook.emails.forEach((email)=>{
            if((reqEmails.indexOf(email.value) == -1) && email.value.length) reqEmails.push(email.value);
          })
        }

        if(google){
          google.emails.forEach((email)=>{
            if((reqEmails.indexOf(email.value) == -1) && email.value.length)reqEmails.push(email.value)
          })
        }


        if(tellUsWho){
            if(!req.body.ucid) return done(null, false, 'No UCID provided');
            var njitEmail = req.body.ucid + "@njit.edu";
            if(reqEmails.indexOf(njitEmail) == -1) reqEmails.push(njitEmail);
        }

        var profilePic = req.body.profilePic ? req.body.profilePic : false;


        if (!username || !password || !reqPhone || !reqEmails[0] || typeof reqEmails[0] !== "string" || !reqEmails.length || !firstName) {
            return done(null, false, 'Missing Fields');
        }
        if(typeof reqPhone !== "string"){
          return done(null, false, 'Phone number is badly formatted')
        }

        reqEmails = reqEmails.map((reqEmail, i)=>{
            return reqEmail.toLowerCase();
        })

        var emailsToFind = reqEmails;
        //===============REGEX CHECK===============//
        //check if phone number is valid
        if(!reqPhone.match(regexPhone)) return done(null, false, 'Invalid Phone');
        //check if email is valid
        // reqEmails.forEach((reqEmail)=>{
        //   if(!reqEmail.match(regexEmail)) return done(null, false, 'Invalid Email');
        // })


        //============PROFILE PIC CHECK============//
        //if we have a custom profile pic, handle it appropriately
        if(profilePic){
            if(!profilePic.imageData
                // || !profilePic.height || !profilePic.width || !profilePic.type
            ) return done(null, false, "Missing information for profilePic");
        }


        //=========CHECK IF USER EXISTS WITH GIVEN USERNAME/EMAIL/PHONE =========//
        authUtil.getEmailAndPhone(username, emailsToFind, reqPhone, facebook, google).then((objects)=>{
            var fbObjects, gglObjects, emailObjects, phoneObject;
            //check if we have any found objects using phone and email to search. Handle the responses appropriately

            var error = '';

            objects.forEach((objArr)=>{
              if(error.length) return;
                objArr.forEach((obj)=>{
                  if(error.length) return;
                    if(Email === obj.getModel()){
                        if(obj.userId) error = 'Email is already in use.';
                        emailObjects.push(obj);
                        emailsToFind.splice(emailsToFind.indexOf(obj.id), 1);
                    } else if(Phone === obj.getModel()){
                        if(obj.userId) error = 'Phone is already in use.';
                        phoneObject = obj;
                    } else if(Facebook === obj.getModel()){
                        if(obj.userId) error = 'This Facebook account is already linked to another user.';
                        fbObjects.push(obj);
                    } else if(Google === obj.getModel()){
                        if(obj.userId) error = 'This Google account is already linked to another user.';
                        gglObjects.push(obj);
                    } else if(User === obj.getModel()){
                      error = 'Username is already taken.';
                    }

                })
            })

            if(error.length) {
              return done(null, false, error);
            } else {
            var password1 = createHash(password);
            var newUser = new User({
                username: username,
                password: password1,
                firstName: firstName,
                lastName: lastName,
                primaryEmailId: primaryEmail,
                primaryPhoneId: reqPhone
            });
            newUser.save().then((user)=>{
                    var thingsToSave = [];
                    var userId = user.id;

                    //save the remaining unfound emails
                    emailsToFind.forEach((email)=>{
                        thingsToSave.push(Promise.resolve(
                            new Email({
                                id: email,
                                userId: userId,
                                createdBy: userId
                            }).save()
                        ))
                    })
                    // save all of the emails if they don't exist in db with our userId
                    if(emailObjects){
                        emailObjects.forEach((emailObject)=>{
                            emailObject.userId = userId;
                            emailObject.createdBy = emailObject.createdBy ? emailObject.createdBy : userId;
                            thingsToSave.push(Promise.resolve(emailObject.save()));
                        });
                    }

                    //if we found a phone object, claim it, if not create one.
                    if(phoneObject){
                        phoneObject.userId = userId;
                        phoneObject.createdBy = phoneObject.createdBy ? phoneObject.createdBy : userId;
                        thingsToSave.push(Promise.resolve(phoneObject.save()));
                    } else {
                        phoneObject = new Phone({
                            id: reqPhone,
                            userId: userId,
                            createdBy: userId
                        });
                        thingsToSave.push(Promise.resolve(
                            phoneObject.save()
                        ));
                    }

                    // Create a new Tell us who profile
                    thingsToSave.push(Promise.resolve(new Profile({
                        userId: userId,
                    }).save()));

                    // create the facebook profile if we got it
                    if(facebook){
                      thingsToSave.push(Promise.resolve(
                        new Facebook({
                          id: facebook.id,
                          displayName: facebook.displayName,
                          emails: facebook.emails,
                          photos: facebook.photos,
                          userId: userId
                        }).save()
                      )
                      )
                    }

                    //create the google profile if we got it
                    if(google){
                      thingsToSave.push(Promise.resolve(
                        new Google({
                          id: google.id,
                          displayName: google.displayName,
                          emails: google.emails,
                          photos: google.photos,
                          userId: userId
                        }).save()
                      )
                      )
                    }
                     //If the user submitted their profile pic
                    if(profilePic){
                       thingsToSave.push(Promise.resolve(
                           new Image({
                               imageData: profilePic.imageData,
                               height: profilePic.height,
                               width: profilePic.width,
                               type: profilePic.type,
                               userId: userId,
                               createdBy: userId,
                           }).save()
                       ))
                    }
                    var telluswhoProfile = {};
                //Save all of them at once async
                    Promise.all(thingsToSave).then((things)=>{
                        var userData = Object.assign({},user);
                        userData.phones = [];
                        userData.emails = [];

                        things.forEach((thing)=>{
                            if (Email === thing.getModel()){
                                userData.emails.push(thing);
                            } else if (Phone === thing.getModel()){
                                userData.phones.push(thing);
                            } else if (Image === thing.getModel()){
                                user.profilePicId = thing.id;
                                userData.profilePicId = thing.id;
                            } else if (Profile === thing.getModel()){
                                user.profileId = thing.id;
                                // userData.telluswho = thing;
                                userData.profileId = thing.id;
                                telluswhoProfile = thing;
                            } else if (Facebook === thing.getModel()){
                                userData.facebook = thing
                            } else if (Google === thing.getModel()){
                                userData.google = thing
                            }
                        })

                        user.save().then((user)=>{
                            var userId = user.id;
                            var emailobjs = [];
                            var emails = userData.emails;
                            var emailStrings = []
                            //grab email object to create verification email.
                            emails.map((email)=>{
                                if(reqEmails.indexOf(email.id) != -1) emailobjs.push(email);
                                emailStrings.push(email.id);
                                return email.id;
                            });
                            //censor data`
                            userData.password = "";

                            // userData.emails = emailStrings;
                            //send verification stuff
                            smsSender.sendVerificationText(userData.phones[0], (err, resData)=>{
                                if(err) console.log(err);
                            })
                            // userData.phones = [userData.phones[0].id]

                            if(tellUsWho){
                              emailSender.sendTelluswhoVerificationEmail(emailobjs, username, (err)=>{
                                  if(err) console.log(err);
                              })
                            } else {
                              emailSender.sendVerificationEmail(emailobjs, username, (err)=>{
                                  if(err) console.log(err);
                              })
                            }


                            //finds your teeups and associates them to you
                            //TODO: Test this
                            authUtil.findMyTeeups(emailStrings, [reqPhone], userId);

                            //TODO: test this with ejab
                            //Make an account for the chat
                            chatUtil.registerUser(userData.username, userData.id);
                            if(tellUsWho){
                               return done(null, authUtil.viewableUser(userData), telluswhoProfile )
                            } else{
                              return done(null, authUtil.viewableUser(userData), "User created successfully.");
                            }

                        }).error((e)=>{
                          things.forEach(thing=>{
                            thing.delete();
                          })
                          user.delete();
                          return done(null, false, "Error saving emails and phones")
                        })

                    }).error((e)=>{
                      user.delete();
                      return done(null, false, "Error saving emails and phones")
                    })

            }).catch((e)=>{

                return done(null, false, "2");
            });

          }
        }).catch((e)=>{
            //REVERSE EVERYTHING

            return done(null, false, "User already exists.");
        });
    }));


    // compares passwords using bcrypt
    var isValidPassword = function (user, password) {
        return bCrypt.compareSync(password, user.password);
    };

    // Generates hash using bCrypt
    var createHash = function (password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };
};
