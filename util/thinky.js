/**
 * utility class for importing thinky
 * USE THIS TO IMPORT THINKY!! DO NOT USE THE OTHER IMPORT STATEMENT!!
 * */
var dbconfig = process.env.ADDRESS ? require('../config/config.js')['serverRethinkdb'] : require('../config/config.js')['rethinkdb'];
var thinky = require('thinky')(dbconfig);

module.exports = thinky;
