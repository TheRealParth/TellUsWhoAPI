//var User = require('../models/user');
var express = require('express');
var router = express.Router();
var Email = require('../models/email')
var Token = require('../util/tokenGenerator');
var newToken = new Token();
var fs = require('fs');
module.exports = function (passport) {

    router.get('/', function(req, res){
      res.redirect('../')
    })
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
                            return res.redirect('/api/validated')
                        });
                    } else {
                        return res.redirect('/api/validated')
                    }
                } else {
                    return res.redirect('/api/invalid')
                }
            } else {
                return res.redirect('/api/invalid')
            }
        }).error((err) => {
            return res.redirect('/api/invalid')
        })
    });
    router.get('/validated', function(req, res){
      res.send("Email Validated!")
    })
    router.get('/invalid', function(req, res){
      res.send("Invalid verification link.")
    })
    router.get('/token', function(req, res) {
      newToken.checkToken().then((tok)=>{
        res.send(tok)
      })
    })
    router.get('/test', (req, res) => {
      fs.readFile(__dirname + '/../public/base64img.txt',  (err, buffer)=>{
        var data = buffer.toString()
        res.writeHead(200, {
          'Content-Type': 'image/jpeg',
        });
        res.write(Buffer.from(data, 'base64'))
        res.end();
      })

    })
    return router;
}
