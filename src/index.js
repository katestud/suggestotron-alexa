var https = require('https');

var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(intentHandlers);
    alexa.execute();
};

var intentHandlers = {

    "GetVenuesIntent": function () {
      var intent = this.event.request.intent;
      var categorySlot = intent.slots.Category;
      var speechOutput = '';

      if (categorySlot && categorySlot.value) {
        var categoryName = categorySlot.value;

        var endpoint = 'https://suggestotron5000.herokuapp.com/categories/';
        var queryString = categoryName + '?_format=json';


        https.get(endpoint + queryString, (res) => {
            var suggestotronResponse = '';
            console.log('Status Code: ' + res.statusCode);

            if (res.statusCode != 200) {
              console.log('Something went wrong!')
            }

            res.on('data', (data) => {
              suggestotronResponse += data;
            });

            res.on('end', (end) => {
              var suggestotronResponseObject = JSON.parse(suggestotronResponse);
              var venues = suggestotronResponseObject.category.venues;
              var category = suggestotronResponseObject.category.name;
              var randomSort = venues.sort(function(a, b){return 0.5 - Math.random()});
              this.attributes.venues = randomSort;

              this.emit('SuggestVenueIntent');
            });

        }).on('error', function () {
          this.emit(':tell', 'Sorry, something went wrong!')
        });
      }
    else {
        var noSlotMessage = 'Sorry, you need to provide a category. Try saying what you\'re in the mood for'
        this.emit(':tell', noSlotMessage);
      }
    },

    "SuggestVenueIntent": function() {
      var venues = this.attributes.venues;
      var venue = venues.pop();
      this.attributes.venues = venues;

      var speechOutput = 'Why not try ' + venue.name;
      this.emit(':ask', speechOutput, speechOutput);
    },

    "GetDifferentVenueIntent": function() {
      if (this.attributes.venues.length == 0) {
        this.emit(':tell', 'Sorry, that\'s all the venues I have.');
        return
      }
      this.emit('SuggestVenueIntent');
    },

    "LaunchRequest": function() {
      this.emit(':ask', 'What are you in the mood for?', 'What are you in the mood for?');
    },

    "AMAZON.HelpIntent": function () {
        this.emit(':ask', 'Tell me what you\'re in the mood for', 'What are you in the mood for?');
    },

    "AMAZON.StopIntent": function () {
        this.emit(':tell', 'Thanks for using suggestotron. Bye!');
    },

    "AMAZON.CancelIntent": function () {
        this.emit(':tell', 'Bye!');
    }
};
