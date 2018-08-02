var User = require('../models/user');
var Email = require('../models/email');
var Phone = require('../models/phone');
var Profile = require('../models/telluswho/profile');
var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs')
var nodemailer = require('nodemailer');
var emailSender = require('../util/emailSender');
var authUtil = require('../util/auth-util');
var arrayUtil = require('../util/arrayUtil');
var Facebook = require('../models/facebook');
var Google = require('../models/google');
var Invite = require('../models/google');
var configAuth = require('../config/config');
var gglAuth = {
    clientID: configAuth['googleAuth']['clientID'],
    clientSecret: configAuth['googleAuth']['clientSecret'],
    callbackURL: configAuth['googleAuth']['callbackURL']
}
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var _ = require('lodash');
var oauth2Client = new OAuth2(
  gglAuth.clientID,
  gglAuth.clientSecret,
  gglAuth.callbackURL
);

module.exports = function (passport, isLoggedIn) {

    /**
     * request that handles the login of the user
     *
     * in the post body include the following
     *
     * username: {user's username}
     * password: {user's password}
     * */
    router.post('/login', function (req, res, next) {
        passport.authenticate('login', (err, user, info) => {
            if (err)
                return next(err);
            if (!user)
                return res.status(400).send({status: 400, message: info});

            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.status(200).send({status: 200, message: info, user: authUtil.viewableUser(user)});
            });
        })(req, res, next);
    });
    // for tell us who
    router.post('/login/telluswho', function (req, res, next) {
        passport.authenticate('login', (err, user, info) => {
            if (err)
                return next(err);
            if (!user)
                return res.status(400).send({status: 400, message: info});

            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                Profile.get(user.profileId).getJoin({wellbeing: true, sociability: true, senseOfCommunity: true,  backgroundInfo: true, schoolAndWork:true, interests: {places: true}}).run().then((profile)=>{

                    if(profile){
                        return res.status(200).send({status: 200, message: "Successful", profile: profile, user: authUtil.viewableUser(user)})
                    }
                }).error((err)=>{
                    return res.status(500).send({status: 500, message: err})
                })

            });
        })(req, res, next);
    });
    //login with email
    router.post('/emailLogin', function (req, res, next) {
        var email = req.body.email;
        var password = req.body.password;

        if(!email || !password) return res.status(400).send({status:400, message: "Missing email or password"});

        Email.get(email).getJoin({user: true}).then((email)=>{
            var username = email.user.username;
            req.body.username = username;
            req.body.password = password;

            passport.authenticate('login', (err, user, info) => {
                if (err)
                    return next(err);
                if (!user)
                    return res.status(400).send({status: 400, message: info});

                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.status(200).send({status: 200, message: info, user: authUtil.viewableUser(user)});
                });
            })(req, res, next);
        })

    });
    //login with phone
    router.post('/phoneLogin', function (req, res, next) {
        var phone = req.body.phone;
        var password = req.body.password;

        if(!phone || !password) return res.status(400).send({status:400, message: "Missing phone number or password"});

        Phone.get(phone).getJoin({user: true}).then((phone)=>{
            var username = phone.user.username;
            req.body.username = username;
            req.body.password = password;

            passport.authenticate('login', (err, user, info) => {
                if (err)
                    return next(err);
                if (!user)
                    return res.status(400).send({status: 400, message: info});

                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.status(200).send({status: 200, message: info, user: authUtil.viewableUser(user)});
                });
            })(req, res, next);
        })

    });

    /**
     * request handles signup via facebook
     *
     * */
    router.post('/signupFacebook',   (req, res, next) => {
        passport.authenticate('facebookLogin', (err, user, info)=>{
            if (err)
                return res.status(400).send({status: 400, message: err.oauthError ? JSON.parse(err.oauthError.data).error.message : err.message});
            if (!user)
                return res.status(400).send({status: 400, message: info});

            req.facebook = user;

            return next()
        })(req, res, next)
    }, (req, res, next)=>{
        passport.authenticate('signup',  (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(400).send({status: 400,  message: info});
            }

            req.logIn(user, function (err) {
                if (err) {

                    return next(err);
                }
                return res.status(201).send({status: 201, message: info, user: authUtil.viewableUser(user)});
            });
        })(req, res, next)
    });
    /**
     * request handles login via facebook
     *
     * */
    router.post('/loginFacebook', function (req, res, next) {
        passport.authenticate('facebookLogin', (err, fb, info)=>{
            if (err){
                return res.status(400).send({status: 400, message: err.oauthError ? JSON.parse(err.oauthError.data).error.message : JSON.parse(err.message).message});
            }
            if (!fb)
                return res.status(400).send({status: 400, message: 'Facebook profile not found'});

           Facebook.get(fb.id).getJoin({user: {emails: true, phones: true, facebook: true, google: true}}).then((facebook)=>{
             req.logIn(facebook.user, function (err) {
                 if (err) {
                     return res.status(400).send({status: 400, message: err})
                 }
                 return res.status(200).send({status: 200, message: info, user: authUtil.viewableUser(facebook.user)});
             });

           }).error((err)=>{
             return res.status(404).send({status: 404, message: "Could not find facebook profile"})
           })

        })(req, res, next);

    });

    router.post('/signupGoogle',   (req, res, next) => {
      if(!req.body.auth_code) return res.status(400).send({status: 400, message: "No auth code sent"})
      oauth2Client.getToken(req.body.auth_code,  (err, tokens) => {

        if (!err) {
          return res.status(400).send({status: 400, message: "error getting token", error: err})
        }

          return next()
      }),
        passport.authenticate('googleLogin', (err, user, info)=>{
            if (err)
                return res.status(400).send({status: 400, message: err.oauthError ? JSON.parse(err.oauthError.data).error.message : err.message});
            if (!user)
                return res.status(400).send({status: 400, message: info});

            req.google = user;

            return next()
        })(req, res, next)
    }, (req, res, next)=>{
        passport.authenticate('signup',  (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(400).send({status: 400,  message: info});
            }

            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return res.status(201).send({status: 201, message: info, user: authUtil.viewableUser(user)});
            });
        })(req, res, next)
    });
    /**
     * request handles login via google
     *
     * */
    router.post('/loginGoogle', function (req, res, next) {
      passport.authenticate('googleLogin', (err, ggl, info)=>{
          if (err){
              return res.status(400).send({status: 400, message: err.oauthError ? JSON.parse(err.oauthError.data).error.message : JSON.parse(err.message).message});
          }
          if (!ggl)
              return res.status(400).send({status: 400, message: 'Google profile not found'});

         Google.get(ggl.id).getJoin({user: {emails: true, phones: true, facebook: true, google: true}}).then((google)=>{
           req.logIn(google.user, function (err) {
               if (err) {
                   return res.status(400).send({status: 400, message: JSON.stringify(err)})
               }
               return res.status(200).send({status: 200, message: info, user: authUtil.viewableUser(google.user)});
           });

         }).error((err)=>{
           return res.status(404).send({status: 404, message: "Could not find google profile"})
         })

      })(req, res, next);

    });

    /**
     * request that handles the signup of the user
     *
     * in the post body include the following
     * firstName: {user's first name}
     * lastName: {user's last name}
     * email: {user's email}
     * phone: {user's phone}
     * username: {user's username}
     * password: {user's password}
     * */
    router.post('/signup/:type', function (req, res, next) {
        passport.authenticate('signup', function (err, user, info) {
            if (err) {
                return next(err);
            }
            else if (!user) {
                return res.status(400).send({status: 400,  message: info});
            }

            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                if(req.params.type == 'telluswho'){
                    return res.status(201).send({status: 201, message: "User created successfully", user: user, profile: info});
                } else {
                    return res.status(201).send({status:201, message: "User created successfully", user: user})
                }

            });
        })(req, res, next);
    });

    router.post('/signup', function (req, res, next) {
        passport.authenticate('signup', function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(400).send({status: 400,  message: info});
            }

            req.logIn(user, function (err) {
                if (err) {

                    return next(err);
                }
                return res.status(201).send({status: 201, message: info, user: authUtil.viewableUser(user)});
            });
        })(req, res, next);
    });

    router.post('/signup/withInvite/:inviteId', function (req, res, next) {
      var inviteId = req.params.inviteId;

      if(_.isEmpty(inviteId)) return res.status(400).send({status: 400, message: "Missing inviteId"})

      Invite.get(inviteId).then((invite) => {
        if(!invite.userId){
          passport.authenticate('signup', function (err, user, info) {
              if (err) {
                  return next(err);
              }
              if (!user) {
                  return res.status(400).send({status: 400,  message: info});
              }

              invite.userId = user.id;

              req.logIn(user, function (err) {
                  if (err) {

                      return next(err);
                  }
                  return res.status(201).send({status: 201, message: info, user: authUtil.viewableUser(user)});
              });
          })(req, res, next);
        } else {
          return res.status(400).send({status: 400, message: "Invite has already been used."})
        }

      }).error((e)=>{
        return res.status(400).send({status: 400, message: "Could not find invite.", error: e})
      })
    });


    router.post('/logout', function (req, res) {
        if (req.isAuthenticated()) {
            User.get(req.user.id).run().then((user) => {
                var pushToken = req.body.pushToken;
                if (pushToken) {
                    arrayUtil.removeElement(user.pushTokens, pushToken);
                    user.save();
                }
                req.logout();
                return  res.status(200).send({status: 200, message: "User logged out successfully"});
            }).catch((e) => {
                return res.status(200).send({status: 200, message: "Invalid credentials or user does not exist"});
            });
        } else {
            return res.status(401).send({status: 200, message: "Already logged out"});
        }
    });

    //phone validation
    router.get('/phone/:phone/:code', function (req, res) {
        var phone = req.params.phone;
        var validationCode = req.params.code;

        if (!phone) {
            return res.status(400).send({status: 400, message: "Please specify a valid phone number."})
        } else if (!validationCode) {
            return res.status(400).send({status: 400, message: "Please specify a validation code."})
        }

        Phone.filter({id: phone}).run().then(function (p) {
            if (p.length) {
                p = p[0];
                if (p.validationCode == parseInt(validationCode)) {

                    if (!p.isValidated) {
                        p.isValidated = true;
                        p.save().then((updated) => {
                            return res.status(200).send({status: 200, message: "Validated", phone: updated})
                        });
                    } else {
                        return res.status(202).send({status: 202, message: "Phone already validated"})
                    }
                } else {
                    return res.status(400).send({status: 400, message: "Invalid code."})
                }
            } else {
                return res.status(404).send({status: 404, message: "Phone not found"})
            }
        }).error((err) => {
            return res.status(500).send({status: 500, message: err});
        })
    });

    //email validation
    router.get('/email/:email/:code', function (req, res) {
        var email = req.params.email;
        var validationCode = req.params.code;

        if (!email) {
            return res.status(400).send({status: 400, message: "Please specify an email."})
        } else if (!validationCode) {
            return res.status(400).send({status: 400, message: "Please specify a validation code."})
        }

        Email.filter({id: email}).run().then(function (e) {
            if (e.length) {
                e = e[0];
                if (e.validationCode == parseInt(validationCode)) {

                    if (!e.isValidated) {
                        e.isValidated = true;
                        e.save().then((updated) => {
                            return res.status(200).send({status: 200, message: "Validated", email: updated})
                        });
                    } else {
                        return res.status(202).send({status: 202, message: "Email already validated"})
                    }
                } else {
                    return res.status(400).send({status: 400, message: "Invalid code."})
                }
            } else {
                return res.status(404).send({status: 404, message: "Email not found"})
            }
        }).error((err) => {
            return res.status(500).send({status: 500, message: err});
        })
    });


    router.get('/resetPassword/byEmail/:email', function (req, res) {

        var email = req.params.email;
        if (!email) return res.status(400).send({status: 400, message: "No email provided."});
        Email.get(email).run().then((email) => {
            if (!email.userId) return res.status(404).send({status: 404, message: "User not found."});
            User.get(email.userId).run().then((user) => {
                user.forgotCode = Math.floor(Math.random() * 9999999999999999);
                var future = new Date();
                future.setDate(future.getDate() + 7);
                user.forgotExpires = future;
                user.save().then((user) => {

                    var email = req.params.email;
                    emailSender.sendForgotPasswordEmail(email, user.username, user.forgotCode, function (err, info) {
                        if (err) return res.status(400).send({status: 400, message: err})
                        return res.status(200).send({status: 200, message: "Sent successfully", info});
                    })
                })
            })
        }).error((err) => {
            return res.status(404).send({status: 404, message: "Email not found."})
        })

    })

    router.post('/setNewPassword/:email/:code', function (req, res) {
        var email = req.params.email;
        var code = req.params.code;
        var password = req.body.password;
        if (!code || !email || !password) return res.status(400).send({status: 400, message: "Missing values"})

        Email.get(email).then((email)=>{
          User.get(email.userId).then((user)=>{
            if (!user) return res.status(404).send({status: 404, message: "User not found"});
            if (Date.now() > user.forgotExpires) return res.status(400).send({status: 400, message: "Expired"})
            if (code != user.forgotCode) return res.status(400).send({status: 400, message: "Code does not match"})
            user.password = bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
            user.forgotCode = Math.floor(Math.random() * 9999999999999999);
            user.forgotExpires = Date.now();
            user.save().then((user) => {
                return res.status(200).send({status: 200, message: "Successfully reset the password."})
            })
        }).error((err) => {
            return res.status(404).send({status: 404, message: "User not found."})
        })
      }).error((err) => {
          return res.status(404).send({status: 404, message: "Email not found."})
      })

    })

    /**
     * method that checks to see if the email is already is use
     * */
    router.post('/isEmailInUse', (req, res) => {
        var email = req.body.email;

        if (!email) {
            return res.status(400).send({status: 400, message: "Invalid email"});
        }

        Email.get(email).run().then((email) => {
            if (email.userId) {
                return res.status(202).send({status: 202, message: "email in use"});
            } else {
                return res.status(200).send({status: 200, message: "email not in use"});
            }
        }).error((err) => {
            return res.status(200).send({status: 200, message: "email not in use"});
        })

    });

    return router;
};
// Generates hash using bCrypt
