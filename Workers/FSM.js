/**
 * Created by giggsoff on 30.03.2017.
 */
var StateMachine = require('javascript-state-machine');
var fsm = StateMachine.create({

    initial: 'init',

    events: [
        { name: 'connect', from: 'init', to: 'work' },
        { name: 'connecterror', from: 'init', to: 'error' },
        { name: 'send', from: 'work', to: 'ready' },
        { name: 'senderror', from: 'work', to: 'error' },
        { name: 'repair', from: 'error', to: 'work' }
    ],

    callbacks: {

        onenterwork: function() { },
        onentererror: function() { }/*,

        onleavemenu: function() {
            $('#menu').fadeOut('fast', function() {
                fsm.transition();
            });
            return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in fadeOut callback above)
        },

        onleavegame: function() {
            $('#game').slideUp('slow', function() {
                fsm.transition();
            });
            return StateMachine.ASYNC; // tell StateMachine to defer next state until we call transition (in slideUp callback above)
        }*/

    }
});