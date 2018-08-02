var redis = require("redis")
var client = redis.createClient(null, null, { detect_buffers: true })

module.exports = client;
