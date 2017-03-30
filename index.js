/**
 * Created by giggsoff on 30.03.2017.
 */
var ttn = require('ttn');
var region = 'eu';
var appId = 'sgb-test';
var accessKey = 'ttn-account-v2.iNJOxpLhF76UpvGNpXEFt8ilwN9ZkIAaJOfYOwzVefA';

var client = new ttn.Client(region, appId, accessKey);

client.on('connect', function(connack) {
    console.log('[DEBUG]', 'Connect:', connack);
});

client.on('error', function(err) {
    console.error('[ERROR]', err.message);
});
client.on('message', function(deviceId, data) {
    console.info('[INFO] ', 'Message:', deviceId, JSON.stringify(data, null, 2));
});