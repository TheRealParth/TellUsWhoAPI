var redis = require('redis');
var redisConfig = require('./config.js')['redis'];

module.exports = redis.createClient({port: 6379, host: redisConfig.host, db: 1})
