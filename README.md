Sauna-Temp
==========

### About

Read temperature with a [DS18B20](https://www.amazon.co.uk/dp/B07VG4121X/ref=pe_3187911_189395841_TE_dp_1) sensor connected to a Raspberri Pi running Node Red.

Data is then stored in Firebase Cloud Firestore and exposed with Firebase Cloud Functions. 

One cloud functions are used by a Actions on Google DialogFlow Fulfillment. This enables temperature readings from a device running Google Assistant.
