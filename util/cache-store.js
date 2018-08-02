var redis  = require('redis');
var util   = require('util');
var Promise = require('bluebird');
var redisConfig = require('../config/config.js')['redis'];
/**
* Create a cache class
* @param config
*/
var Cache = function(config) {
  config = config || {};
  this.prefix = config.prefix ? config.prefix + ':' : 'cache:';
  var port = config.port || 6379;
  var host = config.host || redisConfig.host;

  this.client = redis.createClient(port, host,  config.options || {db: 2});
  config.auth && this.client.auth(config.auth);
};
/**
* Get an item in cache
* @param key
*/
Cache.prototype.get = function(key) {
   key = this.prefix + key;
   var client = this.client;
   return new Promise(function(resolve, reject) {
     client.hgetall(key, function(err, result) {
       err ? reject() : resolve(result);
     });
   });
};
/**
* Set an object in the cache
* @param key
* @param val
* @param ttl -- the time in seconds till expiration
**/
Cache.prototype.set = function(key, val) {
   var _this = this;
   var pkey = this.prefix + key;
   var client = this.client;
   var _val = val;
   return new Promise(function(resolve, reject) {
     client.hmset(pkey, _val, function(err) {
       err ?  reject() : resolve();
     });
   });
};
/**
* Set the expirey for a cache item by key.
* @param key
* @param ttl -- the time in seconds till expiration
*/
Cache.prototype.expire = function(key, ttl){
  var client = this.client
  return new Promise(function(resolve, reject){
    client.expire(key, ttl, function(err, reply){
      err ? reject()  : resolve();
    });
  })
};

/**
* Delete a cache item by key.
*/
Cache.prototype.delete = function(key){
  return new Promise(function(resolve, reject){
    client.del(key, function(err, reply) {
      err ? reject() : resolve();
    ;
    });
  })
};
/**
* Clear the cache
*/
Cache.prototype.clear = function() {
  var prefixMatch = this.prefix + '*';
  var client   = this.client;

  return new Promise(function(resolve, reject) {
    var multi = client.multi();
    (function scanner(cursor) {
      client.scan([+cursor, 'match', prefixMatch], function(err, scn) {
        if(err) {
          return reject();
        }
        // Add new delete candidates
        multi.del(scn[1]);
        // More? Continue scan.
        if(+scn[0] !== 0) {
          return scanner(scn[0]);
        }
        // Delete candidates, then resolve.
        multi.exec(resolve);
        })
      })(0);
    });
};

module.exports = Cache;
