/**
 * Created by giggsoff on 30.03.2017.
 */
var ttn = require('ttn');
var SerialPort = require('serialport');
var serialWorker = require('./Workers/FSM');
var region = 'eu';
var appId = 'sgb-test';
var accessKey = 'ttn-account-v2.iNJOxpLhF76UpvGNpXEFt8ilwN9ZkIAaJOfYOwzVefA';
var moment = require('moment');
moment.locale('ru');


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
    for ( var i = 8 - 1; i >= 0; i--) {
        value = (value * 256) + buffer[i];
    }
    return value;
};

var summary = [];

var getInfo = function(){
    if(summary.length<2){
        console.log("Мало пакетов");
        return 0;
    }
    console.log("Всего пакетов: "+summary.length);
    console.log("Время работы: "+moment.duration(summary[summary.length-1].time - summary[0].time).humanize());
    console.log("Пакетов в секунду: "+Number(summary.length/(summary[summary.length-1].time - summary[0].time)*1000).toFixed(3));
    var maxt = Number.MIN_VALUE;
    var mint = Number.MAX_VALUE;
    var sumt = 0;
    var suml = 0;
    for(var i=0;i<summary.length;i++){
        var cur = summary[i];
        if(cur.time-cur.send>maxt){
            maxt = cur.time-cur.send;
        }
        if(cur.time-cur.send<mint){
            mint = cur.time-cur.send;
        }
        sumt = sumt + cur.time-cur.send;
        suml = suml + cur.length;
    }
    console.log("Среднее время доставки, мс: "+Number(sumt/summary.length).toFixed(3));
    console.log("Максимальное время доставки, мс: "+maxt);
    console.log("Минимальное время доставки, мс: "+mint);
    console.log("Средний размер нагрузки, байт: "+Number(suml/summary.length).toFixed(3));
};

client.on('message', function(deviceId, data) {
    //console.info('[INFO] ', 'Message:', deviceId, JSON.stringify(data, null, 2));
    if(data.payload_raw){
        var rec = bufferToLong(data.payload_raw);
        var time = new Date().getTime();
        summary.push({time:time,send:rec,length:data.payload_raw.length});
        console.log("Пришло: "+rec+"; Сейчас: "+time+"; Разница: "+(time-rec));
        getInfo();
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

        var timerId = setTimeout(function() {
            serialWorker.init(port,10);
        }, 3000);
    });
}