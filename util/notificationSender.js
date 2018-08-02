var settings = require('../config/pns');
const PushNotifications = new require('node-pushnotifications');
const push = new PushNotifications(settings);

// Single destination
const registrationIds = 'INSERT_YOUR_DEVICE_ID';

// Multiple destinations
const registrationIds = [];
registrationIds.push('INSERT_YOUR_DEVICE_ID');
registrationIds.push('INSERT_OTHER_DEVICE_ID');