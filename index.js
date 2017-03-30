/**
 * Created by giggsoff on 30.03.2017.
 */
var ttn = require('ttn');
var SerialPort = require('serialport');
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
var port = null;
if(process.platform === "win32") {
    port = new SerialPort('COM3', {autoOpen: false, baudRate: 57600});
}else if(process.platform === "linux"){
    port = new SerialPort('/dev/ttyACM0', {autoOpen: false, baudRate: 57600});
}
if(port!==null) {
    port.open(function (err) {
        if (err) {
            return console.log('Error opening port: ', err.message);
        }
        port.on('data', function (data) {
            console.log('Data: ' + data);
        });
        // write errors will be emitted on the port since there is no callback to write
        port.write('sys get ver\r\n', function(err) {
            if (err) {
                return console.log('Error on write: ', err.message);
            }
            console.log('message written');
        });
    });
}