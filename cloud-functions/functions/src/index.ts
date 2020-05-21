import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const getTemp = functions.https.onRequest(async (request, response) => {
    try {
        const db = admin.firestore();
        const temps = db.collection('temperature');
        const query = temps
        //.where('timestamp', '>=', '2019-07-29T00:00:00')
          //  .where('timestamp', '<', '2019-07-30T00:00:00')
            .orderBy('timestamp', 'desc')
            .limit(1);
        const data = await query.get();
        if(data && data.empty) {
            response.send("No data.");
        } else {
            response.json({ 
                temp: data.docs[0].get('temp'),
                time: new Date(data.docs[0].get('timestamp')).toUTCString()
            });
        }
        return true;
    } catch (e) {
        const error = 'Error: ' + e + '\n';
        response.send(error);
        console.error(e.stack);
        return true;
    }
 });

 // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues

import * as dialogFlow from 'dialogflow-fulfillment';
// import { RichResponse } from 'actions-on-google';
// const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

import * as intl from 'intl'
import * as moment from 'moment-timezone';
moment.locale('sv-SE');



export const dialogflowFulfillment = functions.https.onRequest(async (request, response) => {
  const agent = new dialogFlow.WebhookClient({request: request, response: response});
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

 
  function welcome() {
    agent.add(`Välkommen till bastun!`);
  }

  async function temp() {
    try {
        const db = admin.firestore();
        const temps = db.collection('temperature');
        const query = temps
        //.where('timestamp', '>=', '2019-07-29T00:00:00')
          //  .where('timestamp', '<', '2019-07-30T00:00:00')
            .orderBy('timestamp', 'desc')
            .limit(1);
        
        const data = await query.get();
        if(data && data.empty) {
            agent.add('Jag har ingen sensordata just nu.')
        } else {
            const temperature = Number(data.docs[0].get('temp'))
            const tempFormat = intl.NumberFormat("sv-SE", {maximumFractionDigits: 1})
            const temperatureString = tempFormat.format(temperature)
            const date = moment(data.docs[0].get('timestamp'));
            const time = date.tz('Europe/Stockholm').format("LT")
            const dateTime = date.tz('Europe/Stockholm').format("D MMMM LT")
            if(temperature > 35) {
                agent.add(`Det var ${temperatureString} grader i bastun klockan ${time}.`)
                agent.add(new dialogFlow.Card({
                    title: `Bastutemperatur`,
                    text: `${temperatureString} °C i bastun, ${dateTime}`
                  }
                ));
                agent.end('Kom in i värmen!');
            } else {
                agent.add(`Det var bara ${temperatureString} grader i bastun klockan ${time}.`)
                agent.add(new dialogFlow.Card({
                    title: `Bastutemperatur`,     
                    text: `${temperatureString} °C i bastun, ${dateTime}`
                  }
                ));
                agent.end('Återkom gärna senare.');
            }  
        }
        
    } catch (e) {
        agent.end('Något gick fel');
        console.error(e.stack);
    }
  }
 
  function fallback() {
    agent.add(`Fattar inte, försök igen!?`);
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  const intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Är du redo', temp);
  intentMap.set('Default Fallback Intent', fallback);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  await agent.handleRequest(intentMap);
});

