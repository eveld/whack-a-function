// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const http = require('request');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function consul(agent) {
    var percent = request.body.queryResult.parameters.canary;

    if (percent > 100 || percent < 0) {
        agent.add("Are you sure you know how percentages work?");
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
        agent.add('Ok done. So is voice ops the new git ops then? How are you planning to version control your voice? Storing MP3 in github?');
    });
  }

  function whack(agent) {
    agent.ask(new MediaObject({
      name: 'Jazz in Paris',
      url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg"',
      description: 'A funky Jazz tune'
    }));
  }

  function done(agent) {
    const mediaStatus = agent.arguments.get('MEDIA_STATUS');
    let response = 'Unknown media status received.';
    if (mediaStatus && mediaStatus.status === 'FINISHED') {
      response = 'Hope you enjoyed the tunes!';
    }
    agent.ask(response);
  }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Configure traffic split', consul);
    intentMap.set('Whack-a-pod', whack);
    intentMap.set('actions.intent.MEDIA_STATUS', done);
    agent.handleRequest(intentMap);
});
