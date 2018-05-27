const mdns = require('mdns-js');
const fs = require('fs');
var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
const textToSpeech = require('@google-cloud/text-to-speech');
var browser = mdns.createBrowser(mdns.tcp('googlecast'));
var deviceAddress;
var language;
var tempFileUrl;
const tempFileName = 'temp.mp3'

// Creates a client
const TTSClient = new textToSpeech.TextToSpeechClient();

var device = function(name, lang = 'en-US', path = "https://taitiro.synology.me:8080/") {
    device = name;
    language = lang;
    tempFileUrl = path + tempFileName;
    return this;
};

var ip = function(ip, lang = 'en-US', path = "") {
  deviceAddress = ip;
  language = lang;
  tempFileUrl = path + tempFileName;
  return this;
}

var notify = function(message, callback) {
  if (!deviceAddress){
    browser.on('ready', function () {
	    browser.discover();
		});
    browser.on('update', function(service) {
      console.log('Device "%s" at %s:%d', service.fullname, service.addresses[0], service.port);
      if (service.fullname.includes(device.replace(' ', '-'))){
        deviceAddress = service.addresses[0];
        getSpeechUrl(message, deviceAddress, function(res) {
          callback(res);
        });
      browser.stop();
      }
    });
  }else {
    getSpeechUrl(message, deviceAddress, function(res) {
      callback(res);
    });
  }
};

var play = function(mp3_url, callback) {
  if (!deviceAddress){
    browser.on('ready', function () {
	    browser.discover();
		});
    browser.on('update', function(service) {
      console.log('Device "%s" at %s:%d', service.fullname, service.addresses[0], service.port);
      if (service.fullname.includes(device.replace(' ', '-'))){
        deviceAddress = service.addresses[0];
        getPlayUrl(mp3_url, deviceAddress, function(res) {
          callback(res);
        });
        browser.stop();
      }
    });
  }else {
    getPlayUrl(mp3_url, deviceAddress, function(res) {
      callback(res);
    });
  }
};

var getSpeechUrl = function(text, host, callback) {
  var TTSRequest = {
    input: {text: text},
    voice: {languageCode: language, ssmlGender: 'WOMEN'},
    audioConfig: {audioEncoding: 'MP3'},
  };
  TTSClient.synthesizeSpeech(TTSRequest, (err, response) => {
    if (err) {
      console.error('ERROR:', err);
      callback(false);
    }

    // Write the binary audio content to a local file
    fs.writeFile(tempFileName, response.audioContent, 'binary', err => {
      if (err) {
        console.error('ERROR:', err);
        callback(false);
      }
      onDeviceUp(host, path + tempFileUrl, function(res){
        callback(res)
      });
      console.log('Audio content written to file: ' + tempFileUrl);
    });
  });
};

var getPlayUrl = function(url, host, callback) {
    onDeviceUp(host, url, function(res){
      callback(res)
    });
};

var onDeviceUp = function(host, url, callback) {
  var client = new Client();
  client.connect(host, function() {
    client.launch(DefaultMediaReceiver, function(err, player) {
      var media = {
        contentId: url,
        contentType: 'audio/mp3',
        streamType: 'BUFFERED' // or LIVE
      };
      player.load(media, { autoplay: true }, function(err, status) {
        client.close();
        callback('Device notified');
      });
    });
  });

  client.on('error', function(err) {
    console.log('Error: %s', err.message);
    client.close();
    callback('error');
  });
};

exports.ip = ip;
exports.device = device;
exports.notify = notify;
exports.play = play;
