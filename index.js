'use strict';
console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();


var Alexa = require("alexa-sdk");
var appId = 'amzn1.ask.skill.dd40a592-f723-409c-b5e8-95d40c542513'; // This is Sean's id
//var appId = 'amzn1.ask.skill.5a257a2a-1762-48c3-80c9-cc30b0d548fb'; // This is Will's id
var recipeTable;
var tables = dynamo.scan({TableName: "Recipes"}, onScan);
var recipeArray = "dummy text";
var recipeList = ""

function toLower(x) {
    return x.toLowerCase();
}
function onScan(err, data) {
    if (err) {
        console.error("failed")
        this.emit(':tell', "something went wrong");
    } else {
        console.log("success");
        recipeTable = data;
        recipeArray = [];
        recipeTable.Items.forEach(function (recipe) {
            recipeArray.push(recipe.RecipeName);
        });
        recipeArray = recipeArray.map(toLower);
        recipeList = JSON.stringify(recipeArray);
    }
}


exports.handler = function (event, context, callback) {
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
    'NewSession': function () {
        if (Object.keys(this.attributes).length === 0) {
            this.attributes['currentRecipe'] = "";
        }
        this.handler.state = states.MAINMODE;
        //this.emit(':ask', recipeArray);
        this.emit(':ask', 'recipe assistant, what recipe would you like to make? You can say' + recipeList);
    },
    "AMAZON.StopIntent": function () {
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
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
    'MainIntent': function () {
        var user_res = this.event.request.intent.slots.item.value;
        console.log('user chose: ' + user_res);
        if (user_res === "what can I say") {
            this.emit(':ask', 'you can say' + recipeList);
            //list of other items we can say at this point?
        } else {
            this.emit('NotANum');
        }
    },
    'FoodIntent': function () {
        var food = this.event.request.intent.slots.food.value;
        for (var i = 0; i < recipeArray.length; i++) {
            if (recipeArray[i] === food) {
                this.attributes['currentRecipe'] = food.toString();
                this.attributes['ingredientList'] = null;
                this.attributes['currentIngredientIndex'] = 0;
                this.attributes['directionList'] = null;
                this.attributes['currentDirectionIndex'] = 0;
                this.handler.state = states.INGREDIENTMODE;
                this.emit(':ask', 'you can say what are the ingredients');
            } else {
                this.emit('ask', 'sorry, what you want to make is not in our list of recipes');
            }
        }
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', 'you can say sushi rolls, sandwiches');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
        this.emit(':tell', "Goodbye!");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        var message = 'We do not have this recipe, please say one of' + recipeList;
        this.emit(':ask', message, message);
    }
});

var ingredientHandlers = Alexa.CreateStateHandler(states.INGREDIENTMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'IngredientIntent': function () {
        var user_res = this.event.request.intent.slots.ing_command.value;
        // this.emit("")
        if (!this.attributes["ingredientList"]) {
            var curRepIngredients;
            var ingredientsArray;
            var curRep = this.attributes['currentRecipe'].toLowerCase();
            recipeTable.Items.forEach(function (recipe) {
                if (curRep === recipe.RecipeName.toLowerCase()) {
                    curRepIngredients = recipe.Ingredients;
                    ingredientsArray = curRepIngredients.split("\n");
                }
            });
            this.attributes["ingredientList"] = ingredientsArray;
        }
        var curIndex = this.attributes['currentIngredientIndex'];
        var alexaIngred;
        if (user_res === "next ingredient" || user_res === "ingredients" || user_res === "what are the ingredients") {
            alexaIngred = this.attributes['ingredientList'][curIndex];
            if (curIndex == (this.attributes['ingredientList'].length - 1)) {
                this.handler.state = states.DIRECTIONMODE;
                this.emit(":ask", alexaIngred + " is the last ingredient, now going to directions");
            }
            this.attributes['currentIngredientIndex'] = curIndex + 1;
            this.emit(":ask", alexaIngred);
        } else if (user_res === "last ingredient") {
            if (curIndex <= 0) {
                curIndex = 1;
                this.emit(":ask", alexaIngred + "is the first ingredient, please say next ingredient");
            }
            alexaIngred = this.attributes['ingredientList'][curIndex - 1];
            // this.attributes['currentIngredientIndex'] = curIndex;
            this.emit(":ask", "the last mentioned ingredient is " + alexaIngred);
        } else if (user_res === "start again") {
            this.attributes['currentIngredientIndex'] = 0;
            curIndex = this.attributes['currentIngredientIndex'];
            alexaIngred = this.attributes['ingredientList'][curIndex];

            if (curIndex == (this.attributes['ingredientList'].length - 1)) {
                this.handler.state = states.DIRECTIONMODE;
                this.emit(":ask", alexaIngred + " is the last ingredient, now going to directions. Say read recipe.");
            }
            this.attributes['currentIngredientIndex'] = curIndex + 1;
            this.emit(":ask", alexaIngred);
        } else if (user_res === "main menu") {
            this.handler.state = states.MAINMODE;
            this.emit(":ask", "going back to main menu. You can say what recipe you want." );
        } else {
            this.emit(":ask", "please say next ingredient, last ingredient");
        }
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', 'You can say next ingredient, ingredients, what are the ingredients, last ingredient and start again', 'Try saying next ingredient');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        this.emit(':ask', 'inside ingredient');
    }
});

var directionHandlers = Alexa.CreateStateHandler(states.DIRECTIONMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'DirectionIntent': function() {
        var user_res = this.event.request.intent.slots.direction.value;
        // this.emit("")
        if (!this.attributes["directionList"]) {
            var curRepDirections;
            var directionsArray;
            var curRep = this.attributes['currentRecipe'].toLowerCase();
            recipeTable.Items.forEach(function (recipe) {
                if (curRep === recipe.RecipeName.toLowerCase()) {
                    curRepDirections = recipe.Directions;
                    directionsArray = curRepDirections.split("\n");
                }
            });
            this.attributes["directionList"] = directionsArray;
        }
        var curIndex = this.attributes['currentDirectionIndex'];
        var alexaDirect;
        if (user_res === "read recipe" || user_res === "start" || user_res === "next step" ) {
            alexaDirect = this.attributes['directionList'][curIndex];
            if (curIndex == (this.attributes['directionList'].length - 1)) {
                this.emit(":ask", alexaDirect + " is the last step, congratulations, you are finished. If you want to go back to main menu, say main menu.");
            }
            this.attributes['currentDirectionIndex'] = curIndex + 1;
            this.emit(":ask", alexaDirect);
        } else if (user_res === "last step") {
            if (curIndex <= 0) {
                curIndex = 1;
                this.emit(":ask", alexaDirect + "is the first step, please say next step.");
            }
            alexaDirect = this.attributes['directionList'][curIndex - 1];
            this.emit(":ask", "the last mentioned step is " + alexaDirect);
        } else if (user_res === "start again") {
            this.attributes['currentDirectionIndex'] = 0;
            curIndex = this.attributes['currentDirectionIndex'];
            alexaDirect = this.attributes['directionList'][curIndex];
            if (curIndex == (this.attributes['directionList'].length - 1)) {
                this.emit(":ask", alexaDirect + " is the last step, congratulations, you are finished. If you want to go back to main menu, say main menu.");
            }
            this.attributes['currentDirectionIndex'] = curIndex + 1;
            this.emit(":ask", alexaDirect);
        } else if (user_res === "main menu" ) {
            this.handler.state = states.MAINMODE;
            this.emit(":ask", "going back to main menu. You can say what recipe you want." );
        } else {
            this.emit(":ask", "please say next step, last step.")
        }
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', 'You can say read recipe, start, next step, last step, start again or menu.', 'Try saying read recipe.');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.emit(':tell', "Goodbye!");
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        this.emit(':ask', 'inside direction');
    }
});

// These handlers are not bound to a state
var guessAttemptHandlers = {
    'TooHigh': function (val) {
        this.emit(':ask', val.toString() + ' is too high.', 'Try saying a smaller number.');
    },
    'TooLow': function (val) {
        this.emit(':ask', val.toString() + ' is too low.', 'Try saying a larger number.');
    },
    'JustRight': function (callback) {
        this.handler.state = states.STARTMODE;
        this.attributes['gamesPlayed']++;
        callback();
    },
    'NotANum': function () {
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
};
