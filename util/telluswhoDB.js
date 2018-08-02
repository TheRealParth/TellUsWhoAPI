var dbconfig = process.env.ADDRESS ? require('../config/config.js')['serverTelluswho'] : require('../config/config.js')['telluswhoDB'];
var telluswhoDB = require('thinky')(dbconfig);

module.exports = telluswhoDB;
