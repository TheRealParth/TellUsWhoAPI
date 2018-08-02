var Io = require('./index.js');

exports.client = new Io(parseInt(8082) + parseInt(process.env.NODE_APP_INSTANCE));
