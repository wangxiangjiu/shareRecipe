'use strict';
var Alexa = require("alexa-sdk");
var appId = 'amzn1.ask.skill.dd40a592-f723-409c-b5e8-95d40c542513'; // This is Sean's id
//var appId = 'amzn1.ask.skill.5a257a2a-1762-48c3-80c9-cc30b0d548fb'; // This is Will's id

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'rightRecipes';  

    // change necessary handlers names
    alexa.registerHandlers(newSessionHandlers, ingredientHandlers, mainHandlers, directionHandlers);
    alexa.execute();
};

var states = {
    INGREDIENTMODE: '_INGREDIENTMODE', // User is going through ingredients.
    MAINMODE: '_MAINMODE',  // Prompt the user to find a recipe.
    DIRECTIONMODE: '_DIRECTIONMODE'
};

var newSessionHandlers = {
    'NewSession': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['currentMode'] = "";
            this.attributes['currentRecipe'] = "";
        }
        this.handler.state = states.MAINMODE;
        this.emit(':ask', 'recipe assistant, what recipe would you like to make?');
    },
    "AMAZON.StopIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        //this.attributes['endedSessionCount'] += 1;
        this.emit(":tell", "Goodbye!");
    }
};

var mainHandlers = Alexa.CreateStateHandler(states.MAINMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'MainIntent': function() {
        var user_res = this.event.request.intent.slots.Item.value;
        console.log('user chose: ' + user_res);

        if(user_res === "What can I say" ){
	    this.attributes['currentRecipe'] = "Sushi";
            this.emit(':ask', 'you can say ingredients, directions');
	   	    // need to use JQuery
        } else if( user_res === "Sandwich"){
            this.attributes['currentRecipe'] = "Sandwich";
        } else if (user_res === "Sushi Roll"){
	    this.emit(':tell', "You can say sushi roll, sandwich");
        } else {
            this.emit('NotANum');
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'you can say sushi rolls, sandwiches');
    },
    "AMAZON.StopIntent": function() {
      console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function() {
      console.log("CANCELINTENT");
      this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        var message = 'Say yes to continue, or no to end the game.';
        this.emit(':ask', message, message);
    }
});

var ingredientHandlers = Alexa.CreateStateHandler(states.INGREDIENTMODE, {
     'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    // 'NumberGuessIntent': function() {
    //     var guessNum = parseInt(this.event.request.intent.slots.number.value);
    //     var targetNum = this.attributes["guessNumber"];
    //     console.log('user guessed: ' + guessNum);

    //     if(guessNum > targetNum){
    //         this.emit('TooHigh', guessNum);
    //     } else if( guessNum < targetNum){
    //         this.emit('TooLow', guessNum);
    //     } else if (guessNum === targetNum){
    //         // With a callback, use the arrow function to preserve the correct 'this' context
    //         this.emit('JustRight', () => {
    //             this.emit(':ask', guessNum.toString() + 'is correct! Would you like to play a new game?',
    //             'Say yes to start a new game, or no to end the game.');
    //     })
    //     } else {
    //         this.emit('NotANum');
    //     }
    // },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I am thinking of a number between zero and one hundred, try to guess and I will tell you' +
            ' if it is higher or lower.', 'Try saying a number.');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
})

var directionHandlers = Alexa.CreateStateHandler(states.DIRECTIONMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'NumberGuessIntent': function() {
        var guessNum = parseInt(this.event.request.intent.slots.number.value);
        var targetNum = this.attributes["guessNumber"];
        console.log('user guessed: ' + guessNum);

        if(guessNum > targetNum){
            this.emit('TooHigh', guessNum);
        } else if( guessNum < targetNum){
            this.emit('TooLow', guessNum);
        // } else if (guessNum === targetNum){
        //     // With a callback, use the arrow function to preserve the correct 'this' context
        //     this.emit('JustRight', () => {
        //         this.emit(':ask', guessNum.toString() + 'is correct! Would you like to play a new game?',
        //         'Say yes to start a new game, or no to end the game.');
        // })
        } else {
            this.emit('NotANum');
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I am thinking of a number between zero and one hundred, try to guess and I will tell you' +
            ' if it is higher or lower.', 'Try saying a number.');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
});

// These handlers are not bound to a state
var guessAttemptHandlers = {
    'TooHigh': function(val) {
        this.emit(':ask', val.toString() + ' is too high.', 'Try saying a smaller number.');
    },
    'TooLow': function(val) {
        this.emit(':ask', val.toString() + ' is too low.', 'Try saying a larger number.');
    },
    'JustRight': function(callback) {
        this.handler.state = states.STARTMODE;
        this.attributes['gamesPlayed']++;
        callback();
    },
    'NotANum': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
};
