// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion} = require('dialogflow-fulfillment');
const {
  dialogflow,
  BasicCard,
  BrowseCarousel,
  BrowseCarouselItem,
  Button,
  Carousel,
  LinkOutSuggestion,
  List,
  MediaObject,
  Suggestions,
  SimpleResponse,
 } = require('actions-on-google');
const http = require('request');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

//console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
//console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

function consul(conv) {
  console.log('Consul '+conv);
  var percent = request.body.queryResult.parameters.canary;

  if (percent > 100 || percent < 0) {
      conv.close("Are you sure you know how percentages work?");
      return;
  }

  var payload = {
      "Kind": "service-splitter",
      "Name": "api",
      "Splits": [
          {
              "Weight": 100 - percent,
              "Service": "api",
              "ServiceSubset": "v1"
          },
          {
              "Weight": percent,
              "Service": "api",
              "ServiceSubset": "v2"
          }
      ]
  };

  return new Promise(resolve => {
      http({
          url: 'http://consul.google.demo.gs/v1/config',
          method: 'PUT',
          json: payload
      }, function (error, response, body) {
          console.log(error);
          if (!error) {
              resolve(body);
          }
      });
  }).then(value => {
      // process value here
      conv.close('Ok done. So is voice ops the new git ops then? How are you planning to version control your voice? Storing MP3 in github?');
  });
}

function whack(conv) {
  console.log('whack');
  conv.ask('Starting game');
  conv.ask(
    new MediaObject('https://storage.googleapis.com/consul-files/tick.ogg')
  );
}

function done(conv) {
  console.log('done' + conv);
  conv.close('done');
  /*
  const mediaStatus = conv.arguments.get('MEDIA_STATUS');
  let response = 'Unknown media status received.';
  if (mediaStatus && mediaStatus.status === 'FINISHED') {
    response = 'Hope you enjoyed the tunes!';
  }
  conv.close(response);
  */
}


const app = dialogflow({debug: true});
app.intent('Traffic split', consul);
app.intent('Test', whack);
app.intent('Done', done);

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)
