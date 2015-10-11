/* jshint node: true */
"use strict";

var carelink = require('./carelink'),
  nightscout = require('./nightscout');

function readEnv(key, defaultVal) {
  var val = process.env[key] ||
    process.env[key.toLowerCase()] ||
    // Azure prefixes environment variables with this
    process.env['CUSTOMCONNSTR_' + key] ||
    process.env['CUSTOMCONNSTR_' + key.toLowerCase()];
  return val !== undefined ? val : defaultVal;
}

var config = {
  username: readEnv('CARELINK_USERNAME'),
  password: readEnv('CARELINK_PASSWORD'),
  nsHost: readEnv('WEBSITE_HOSTNAME'),
  nsBaseUrl: readEnv('NS'),
  nsSecret: readEnv('API_SECRET'),
  interval: parseInt(readEnv('CARELINK_REQUEST_INTERVAL', 60 * 1000)),
  sgvLimit: parseInt(readEnv('CARELINK_SGV_LIMIT', 24))
};

var client = carelink.Client({username: config.username, password: config.password});
var endpoint = (config.nsBaseUrl ? config.nsBaseUrl : 'https://' + config.nsHost) + '/api/v1/entries.json';

(function requestLoop() {
  client.fetch(function(data) {
    var entries = nightscout.transform(data, config.sgvLimit);
    nightscout.upload(entries, endpoint, config.nsSecret, function(response) {
      setTimeout(requestLoop, config.interval);
    });
  });
})();
