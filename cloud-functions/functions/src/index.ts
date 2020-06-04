import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const getTemp = functions.https.onRequest(async (request, response) => {
    try {
        const db = admin.firestore();
        const temps = db.collection('temperature');
        const query = temps
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

import * as dialogflowActions from 'actions-on-google';

import * as intl from 'intl'
import * as moment from 'moment-timezone';
moment.locale('sv-SE');

const app = dialogflowActions.dialogflow({debug: true});
app.intent('Default Welcome Intent', conv => {
  conv.add(`Välkommen till bastun!`)
});
app.intent('Default Fallback Intent', conv => {
  conv.add(`Fattar inte, försök igen!?`);
});
app.intent('check_temp', async conv => {
  try {
      const db = admin.firestore();
      const temps = db.collection('temperature');
      const query = temps
          .orderBy('timestamp', 'desc')
          .limit(1);
      
      const data = await query.get();
      if(data && data.empty) {
          conv.add('Jag har ingen sensordata just nu.')
      } else {
          const temperature = Number(data.docs[0].get('temp'))
          const tempFormat = intl.NumberFormat("sv-SE", {maximumFractionDigits: 1})
          const temperatureString = tempFormat.format(temperature)
          const date = moment(data.docs[0].get('timestamp'));
          const time = date.tz('Europe/Stockholm').format("LT")
          const dateTime = date.tz('Europe/Stockholm').format("D MMMM LT")
          if(temperature > 35) {
              conv.add(`Det var ${temperatureString} grader i bastun klockan ${time}.`)
              conv.add(new dialogflowActions.BasicCard({
                title: `${temperatureString} °C`,     
                subtitle: `${dateTime}`,
                text: `Kom in i värmen!`
                }
              ));  
          } else {
              conv.add(`Det var bara ${temperatureString} grader i bastun klockan ${time}.`)
              conv.add(new dialogflowActions.BasicCard({
                  title: `${temperatureString} °C`,     
                  subtitle: `${dateTime}`,
                  text: `Återkom gärna senare.`
                }
              ));
          }  
      }
      
  } catch (e) {
      conv.add('Något gick fel');
      console.error(e.stack);
  } finally {
    conv.close()
  }
});

exports.dialogflowFulfillment = functions.https.onRequest(app)