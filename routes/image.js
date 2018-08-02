var User = require('../models/user');
var express = require('express');
var router = express.Router();
var mime = require('mime');
var fs = require('fs');
var path = require('path');
var im = require('imagemagick');
var Cache = require('../util/cache-store.js');
var cache = new Cache({prefix: "images:cache", options: {db: 2}});
var thinky = require('../util/thinky.js');
var Promise = require('bluebird');
var Errors = thinky.Errors;
var imageUtil = require('../util/image-util.js');
var redis = require('redis');
var randtoken = require('rand-token');
var ReadableStream = require('stream').Readable;
var Transformer = require('stream').Transform;
var dbconfig = require('../config/config.js')['rethinkdb'];
var r = require('rethinkdbdash')(dbconfig);
var ImageStream = r.table('Image').toStream({writable: true});
//Cache image expiration in seconds
var IMAGE_TTL = 86400;

var Image = require('../models/image.js');

module.exports = function (passport) {
    router.get('/stream/:imageId', function (req, res) {
        var imageId = req.params.imageId
        // res.set({'Content-Type': 'image/jpeg'});
        r.table('Image').get(imageId).toStream()
            .on('error', console.log)
            .pipe(res)
            .on('error', console.log)
            .on('end', function () {
                r.getPool().drain();
            });


    })
    // router.post('/stream', function(req, res){
    //   var imageId = req.params.imageId
    //   res.set({'Content-Type': 'image/jpeg'});
    //   res.send(Buffer.from( new Buffer(req.body.imageData, 'base64'), 'base64'))
    //
    //
    // })
    /**
     * @deprecated
     * End point to upload an image
     */
    router.post("/", function (req, res) {
        var imgFile = req.files.file ? req.files.file : false;
        var userId = req.user.id;

        if (!imgFile) return res.status(400).send({status: 400, message: "Missing image data or file."});

        if (imgFile) {
            var data = imgFile.data.toString("base64");
            var type = imgFile.mimetype;
        } else {
            var data = req.body.imageData;
            var type = req.body.imageType;
        }

        new Image({
            imageData: data,
            type: type,
            createdBy: userId
        }).save().then((image) => {

            //cache the image object TODO adjust the TTL to whatever is appropriate
            ;
            var newObj;
            // for (var k in image){
            //   newObj[k] = image[k]
            // }
            var newImage = {
                id: image.id,
                imageData: data,
                type: image.type,
                createdBy: image.createdBy,
                createdAt: image.createdAt,
            };

            cache.set(newImage.id, newImage).then(() => {

            });
            cache.expire(newImage.id, IMAGE_TTL).then(() => {

            });
            // client.hmset(newImage.id, newImage, function(err){
            //
            // })

            // Find yourself and push the image id into your images.
            User.get(userId).then((user) => {
                user.profilePic = image.id;
                user.save();

            });
            return res.status(200).send({status: 200, message: "Successful", image: image.id});

        })

    });

    /**
     * upload an image with multipart
     * an optional query parameter can be set to set the image as the default profile picture
     * TODO images should probably be stored in an AWS S3 bucket
     * */
    router.post('/file/upload', function (req, res) {
        var user = req.user;
        var image = req.files.image;
        var setDefault = req.query.setDefault ? true : false;

        if (!image) return res.status(400).send({status: 400, message: 'Please define an image'});

        var extension = image.mimetype;
        ;

        if (!extension && (extension != 'image/jpeg' || extension != 'image/png')) {
            return res.status(400).send({status: 400, message: "Please upload a png or jpeg file"});
        }

        //generate a random 16 digit string and rename the image
        var userImagePath = __dirname + '/../images/' + user.id + "/";

        // check if the user's image file exists, otherwise, create one
        if (!fs.existsSync(userImagePath)) {
            fs.mkdirSync(userImagePath);
        }

        var fileExtension = "";
        if (extension == 'image/jpeg') {
            fileExtension = ".jpeg";
        } else if (extension == 'image/png') {
            fileExtension = ".png";
        }
        var newName = "" + (setDefault ? "profilePic" : randtoken.generate(16)) + fileExtension;
        // Use the mv() method to place the file somewhere on your server
        image.mv(userImagePath + newName, (err) => {
            if (err) {
                return res.status(500).send({status: 500, message: "Something went wrong", err: err});
            } else {
                var path = "/api/image/file/" + user.id + "/" + newName;
                if (setDefault) {
                    User.get(user.id).run().then((user) => {
                        user.profilePicPath = path;
                        user.save();
                        return res.status(200).send({status: 200, message: "Image set as default!", url: path});
                    });
                } else {
                    return res.status(200).send({status: 200, message: "Success!", url: path});
                }
            }
        });
    });

    /**
     * route to list all the names of the image files
     * */
    router.get('/file/list', function (req, res) {
        var list = [];
        var userId = req.user.id;
        const imageFolder = './images/' + userId + "/";

        fs.readdirSync(imageFolder).forEach(file => {
            list.push(file);
        });

        return res.status(200).send({status: 200, message: "Success!", files: list});
    });

    /**
     * @deprecated
     * Gets a list of the user's images
     * */
    router.get("/", function (req, res) {
        var userId = req.user.id;

        Image.filter({createdBy: userId}).pluck('id', 'type', 'createdAt').run().then(function (images) {
            return res.status(200).send({status: 200, images: images});
        });
    });

    /**
     * Post as base64 string image data
     * TODO this method shouldn't cache the image
     */
    router.post("/data", function (req, res) {
        var userId = req.user.id;
        var imageData = req.body.imageData;
        var imageType = req.body.imageType;

        if (!imageData || !imageType) return res.status(400).send({
            status: 400,
            message: "Image type or image data not provided"
        });


        new Image({
            imageData: imageData,
            type: imageType,
            createdBy: userId
        }).save().then((image) => {
            //cache the image object TODO adjust the TTL to whatever is appropriate
            ;
            var newImage = {
                id: image.id,
                imageData: imageData,
                type: image.type,
                createdBy: image.createdBy,
                createdAt: image.createdAt,
            };

            cache.set(newImage.id, newImage).then(() => {
            });
            cache.expire(newImage.id, IMAGE_TTL).then(() => {
            });
            // client.hmset(newImage.id, newImage, function(err){
            //
            // })

            // Find yourself and push the image id into your images.
            User.get(userId).then((user) => {
                user.profilePicId = image.id;
                user.save();
                //
            });
            return res.status(200).send({status: 200, message: "Successful", image: image.id});
        })

    });

    /**
     * Get an image by id, should render by mimetype
     */
    router.get("/:imageId", function (req, res) {
        var userId = req.user.id;
        var imageId = req.params.imageId;
        // User.get(userId).run().then((user)=>{
        //
        // })
        cache.get(imageId).then((image) => {
            ;
            cache.expire(image.id, IMAGE_TTL).then(() => {

            });
            return res.status(200).send({status: 200, message: "Successfully retrieved from cache", image: image})
        }).catch((err) => {
            Image.get(imageId).then((image) => {
                var newImage = {
                    id: image.id,
                    imageData: image.imageData,
                    createdBy: image.createdBy,
                    createdAt: image.createdAt
                };
                cache.set(image.id, newImage, IMAGE_TTL);
                return res.status(200).send({status: 200, message: "Successfully retrieved image", image: image})
            }).catch(Errors.DocumentNotFound, function (err) {
                return res.status(404).send({status: 404, message: "Image not found."})
            }).error(function (err) {
                return res.status(500).send({status: 500, message: "Server error", err: err});
            });


        })


    });

    /**
     * route to delete an image
     * */
    router.delete("/:imageId", function (req, res) {
        var userId = req.user.id;
        var imageId = req.params.imageId;

        Image.get(imageId).run().then((image) => {
            User.get(userId).run().then((user) => {
                if (user.profilePicId == imageId) {
                    delete user.profilePicId;
                    user.save();
                }
                image.delete().then((deletedImage) => {
                    return res.status(200).send({
                        status: 200,
                        message: "Successfully deleted image",
                        imageId: deletedImage.id
                    });
                })
            });
        });
    });

    // //Endpoint to set image as avatar by its image id
    // router.get("/setAvatar/:imageId", function(req, res){
    //
    // })
    // //Endpoint to upload an image and set it to avatar all in one go.
    // router.post("/uploadAvatar", function(req,res){
    //
    // })
    // //Get the image object
    // router.get("/imageDetail/:imageId", function(req,res){
    //
    // })
    return router;
};
