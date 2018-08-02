var User = require('../models/user');
var thinky = require('../util/thinky.js');
var r = thinky.r;
var Promise = require('bluebird');
var Cache = require('../util/cache-store.js');
var cache = new Cache({prefix: "pushnotifications:devicetokens", options: {db: 2}});

exports.getDeviceTokenApns = (userId)=>{

    cache.get(userId).then((token) => {
    }).catch((err) => {
        cache.set(newImage.id, newImage).then(() => {
        });
        cache.expire(newImage.id, IMAGE_TTL).then(() => {
        });
        // Image.get(imageId).then((image) => {
        //     var newImage = {
        //         id: image.id,
        //         imageData: image.imageData,
        //         createdBy: image.createdBy,
        //         createdAt: image.createdAt
        //     };
        //     cache.set(image.id, newImage, IMAGE_TTL);
        //     return res.status(200).send({status: 200, message: "Successfully retrieved image", image: image})
        // }).catch(Errors.DocumentNotFound, function (err) {
        //     return res.status(404).send({status: 404, message: "Image not found."})
        // }).error(function (err) {
        //     return res.status(500).send({status: 500, message: "Server error", err: err});
        // });


    })

}

exports.setDeviceToken = (userId, token)=>{

}