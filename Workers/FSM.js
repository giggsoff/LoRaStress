/**
 * Created by giggsoff on 30.03.2017.
 */
var StateMachine = require('javascript-state-machine');

var serialWorker = {};

var port = null;
var timerId = null;
var handler = null;

var longToByteString = function(/*long*/long) {
    // we want to represent the input as a 8-bytes array
    var byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

    for ( var index = 0; index < byteArray.length; index ++ ) {
        var byte = long & 0xff;
        byteArray [ index ] = byte;
        long = (long - byte) / 256 ;
    }
    return byteArray.map(function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};

serialWorker.init = function(_port,repeat){

    port = _port;

    var fsm = StateMachine.create({
        initial: 'init',
        error: function(eventName, from, to, args, errorCode, errorMessage, originalException) {
            return 'event ' + eventName + ' was naughty :- ' + errorMessage;
        },
        events: [
            { name: 'sysgetver', from: 'init', to: 'version' },
            { name: 'gosetting', from: 'version', to: 'setting' },
            { name: 'gowork', from: 'setting', to: 'work' },
            { name: 'error', from: ['connected','version','setting','work'], to: 'error' },
            { name: 'send', from: 'work', to: 'ready' },
            { name: 'resend', from: 'ready', to: 'work' },
            { name: 'senderror', from: 'work', to: 'error' },
            { name: 'repair', from: 'error', to: 'work' }
        ],

        callbacks: {
            onleaveinit: function() {
                console.log('onleaveconnect');
                var timerId = setTimeout(function() {
                    console.log('error');
                    fsm.transition();
                    fsm.error();
                }, 3000);
                handler = function(data){
                    console.log('Data 1: ' + data);
                    clearTimeout(timerId);
                    fsm.transition();
                    fsm.gosetting();
                };
                // write errors will be emitted on the port since there is no callback to write
                port.write('sys get ver\r\n', function(err) {
                    if (err) {
                        return console.log('Error on write: ', err.message);
                    }
                    console.log('message written');
                });
                return StateMachine.ASYNC;
            },
            onenterversion: function() {
                console.log('onenterversion');
                fsm.gosetting();
                clearTimeout(timerId);
            },
            onleaveversion: function() {
                console.log('onleaveversion');
                var timerId = setTimeout(function() {
                    console.log('error');
                    fsm.transition();
                    fsm.error();
                }, 3000);
                handler = function(data){
                    console.log('Data 2: ' + data);
                    clearTimeout(timerId);
                    if(data.indexOf('accepted')>-1) {
                        fsm.transition();
                        fsm.gowork();
                    }
                };
                // write errors will be emitted on the port since there is no callback to write
                port.write('mac join abp\r\n', function(err) {
                    if (err) {
                        return console.log('Error on write: ', err.message);
                    }
                    console.log('mac join abp');
                });
                return StateMachine.ASYNC;
            },
            onenterwork: function() {
                console.log('onenterwork');
                fsm.send();
            },
            onleavework: function() {
                console.log('onleavework');
                var timerId = setTimeout(function() {
                    console.log('error');
                    fsm.transition();
                    fsm.error();
                }, 3000);
                handler = function(data){
                    console.log('Data 3: ' + data);
                    clearTimeout(timerId);
                    /*if(data.indexOf('mac_rx')>-1) { // FOR CNF
                        fsm.transition();
                    }*/
                    if(data.indexOf('mac_tx_ok')>-1) {
                        fsm.transition();
                    }else if(data.indexOf('no_free_ch')>-1){
                        console.log('wait for free');
                        setTimeout(function() {
                            fsm.transition();
                        }, 1000);
                    }
                };
                // write errors will be emitted on the port since there is no callback to write
                var time = new Date().getTime();
                console.log(time);
                var bt = longToByteString(time);
                var str = bt;
                if(repeat>1){
                    for(var i=1;i<repeat;i++){
                        str = str + bt;
                    }
                }
                var towrite = 'mac tx uncnf 1 '+str;
                port.write(towrite+'\r\n', function(err) {
                    if (err) {
                        return console.log('Error on write: ', err.message);
                    }
                    console.log(towrite);
                });
                return StateMachine.ASYNC;
            },
            onenterready: function() {
                console.log('onenterready');
                fsm.resend();
            }
        }
    });

    port.on('data', function (data) {
        if(handler!=null){
            handler(data);
        }
    });
    fsm.sysgetver();

};

module.exports = serialWorker;