/**
 * Created by giggsoff on 30.03.2017.
 */
var ttn = require('ttn');
var SerialPort = require('serialport');
var serialWorker = require('./Workers/FSM');
var region = 'eu';
var appId = 'sgb-test';
var accessKey = 'ttn-account-v2.iNJOxpLhF76UpvGNpXEFt8ilwN9ZkIAaJOfYOwzVefA';


var client = new ttn.Client(region, appId, accessKey);

client.on('connect', function(connack) {
    console.log('[DEBUG]', 'Connect:', connack);
});

client.on('activation', function(deviceId, data) {
    console.log('[INFO] ', 'Activation:', deviceId, JSON.stringify(data, null, 2));
});

client.on('device', null, 'down/scheduled', function(deviceId, data) {
    console.log('[INFO] ', 'Scheduled:', deviceId, JSON.stringify(data, null, 2));
});

client.on('error', function(err) {
    console.error('[ERROR]', err.message);
});

var bufferToLong = function(/*buffer*/buffer) {
    var value = 0;
    for ( var i = buffer.length - 1; i >= 0; i--) {
        value = (value * 256) + buffer[i];
    }
    return value;
};

client.on('message', function(deviceId, data) {
    //console.info('[INFO] ', 'Message:', deviceId, JSON.stringify(data, null, 2));
    if(data.payload_raw){
        var rec = bufferToLong(data.payload_raw);
        var time = new Date().getTime();
        console.log("Пришло: "+rec+"; Сейчас: "+time+"; Разница: "+(time-rec));
    }
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
        serialWorker.init(port);
    });
}