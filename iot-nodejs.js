/**
 * Copyright 2018 8IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var fs = require('fs');
var mqtt = require('mqtt');
var config = require("./config"); // to get our credentials and the attention word from the config.js files
var cpustat = require('./cpustat');

function sineVal(minValue, maxValue, duration, count) {
	var sineValue = Math.sin(2.0 * Math.PI * count / duration) * (maxValue - minValue) / 2.0;

	return sineValue.toFixed(2);
}


/*********************************************************************
* Step #1: Connect to IoT Foundation
**********************************************************************/

function getCA() {
  // Split certificates so that IoTFoundation.pem has multiple certificates
  var certs = fs.readFileSync('IoTFoundation.pem');
  var caCerts = [];
  var chains = certs.toString().split('-----END CERTIFICATE-----');

  for (var idx in chains) {
    var chain = chains[idx].trim();

    if (chain !== '') {
      caCerts.push(chain + '\n-----END CERTIFICATE-----');          
    }
  }

  return caCerts;
}

// Client ID
var clientId = 'd:' + config.org + ':' + config.deviceType + ':' + config.deviceId

// initialize the MQTT connection
var options = {
  'clientId': clientId,
  'username': 'use-token-auth',
  'password': config.authToken,
  'ca': getCA()
};


function publishListenEvent(client, text) {
  var topic = 'iot-2/evt/listen/fmt/json';

  client.publish(topic, JSON.stringify({
    'd': { 
      'text': text
    }
  }));
  console.log('Sent')
}

var isConnected = false;

// Connect to server
var msproxyUrl = 'ssl://' + config.org + '.messaging.internetofthings.ibmcloud.com:8883';
var client = mqtt.connect(msproxyUrl, options);

var publishTopic = 'iot-2/evt/status/fmt/json';
var count = 1, intervalId;

client.on('connect', function() {
  isConnected = true;

  // subscribe command topics
  client.subscribe('iot-2/cmd/lighting/fmt/json');
  client.subscribe('iot-2/cmd/speak/fmt/json');
  client.subscribe('iot-2/cmd/servo/fmt/json');

  console.log('CONNECT');

  var count = 1, intervalId;

  // 
  intervalId = setInterval(async function() {
    var cputemp = await cpustat.getCPUTemp()
    var cpuload = await cpustat.getCPULoad()
    
    client.publish(publishTopic, JSON.stringify({
      'd': { 
        'myName': 'iot-nodejs',
        'cputemp': cputemp, 
        'cpuload': cpuload,
        'sine': sineVal(-1.0, 1.0, 16, count++)
      }
    }));
  }, 1000); // 1secs
  // 
});

client.on('reconnect', function() {
  isConnected = true;

  console.log('RECONNECT');
  clearInterval(intervalId);
});

client.on('close', function() {
  isConnected = false;

  console.log('CLOSE');
});

client.on('offline', function() {
  isConnected = false;

  console.log('OFFLINE');
});

client.on('error', function(error) {
  isConnected = false;
  console.error(error);
  process.exit(1);
}); 

client.on('message', function(topic, message) {

  console.log('MESSAGE');
  console.log('topic: ' + topic);
  console.log('message: ' + message );

  var cmd = JSON.parse(message);

  // lighting
  if (topic == 'iot-2/cmd/lighting/fmt/json') {
      console.log('lighting:'+cmd.code);
      publishListenEvent(client, 'lighting')
  }

  // speak
  if (topic == 'iot-2/cmd/speak/fmt/json') {
      console.log('speak:'+cmd.text);
      publishListenEvent(client, 'speak')
  }

  // servo
  if (topic == 'iot-2/cmd/servo/fmt/json') {
      console.log('servo:'+cmd.duty);
      publishListenEvent(client, 'duty')
  }

});
