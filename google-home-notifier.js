const mdns = require('mdns-js');
var request = require('request');
var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var browser = mdns.createBrowser(mdns.tcp('googlecast'));
var deviceAddress;
var language;
const googleEndpoint = 'https://us-central1-hotarunotify.cloudfunctions.net/function-1';
const tempFileName = 'temp.mp3'

var device = function(name, lang = 'en-US') {
  device = name;
  language = lang;
  return this;
};

var ip = function(ip, lang = 'en-US') {
  deviceAddress = ip;
  language = lang;
  return this;
}

var notify = function(message, callback) {
  if (!deviceAddress) {
    browser.on('ready', function() {
      browser.discover();
    });
    browser.on('update', function(service) {
      console.log('Device "%s" at %s:%d', service.fullname, service.addresses[0], service.port);
      if (service.fullname.includes(device.replace(' ', '-'))) {
        deviceAddress = service.addresses[0];
        getSpeechUrl(message, deviceAddress, function(res) {
          callback(res);
        });
        browser.stop();
      }
    });
  } else {
    getSpeechUrl(message, deviceAddress, function(res) {
      callback(res);
    });
  }
};

var play = function(mp3_url, callback) {
  if (!deviceAddress) {
    browser.on('ready', function() {
      browser.discover();
    });
    browser.on('update', function(service) {
      console.log('Device "%s" at %s:%d', service.fullname, service.addresses[0], service.port);
      if (service.fullname.includes(device.replace(' ', '-'))) {
        deviceAddress = service.addresses[0];
        getPlayUrl(mp3_url, deviceAddress, function(res) {
          callback(res);
        });
        browser.stop();
      }
    });
  } else {
    getPlayUrl(mp3_url, deviceAddress, function(res) {
      callback(res);
    });
  }
};

var getSpeechUrl = function(text, host, callback) {

  var dataString = '{\'message\':\'' + text + '\'}';

  var options = {
    uri: googleEndpoint,
    method: 'POST',
    body: dataString
  };

  function callback(error, response, body) {
    if (!error && typeof response.statusCode != undefined && response.statusCode == 200) {
      console.log(body);
    }
  }

  request(options, function(error, response, body) {
    if (!error && typeof response.statusCode != undefined &&response.statusCode == 200) {
      console.log('Audio content written to file: ' + tempFileUrl);
      onDeviceUp(host, path + tempFileUrl, function(res) {
        callback(res)
      });
    } else {

      console.error('ERROR:', error);
      callback(false);
    }
  });
};

var getPlayUrl = function(url, host, callback) {
  onDeviceUp(host, url, function(res) {
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
      player.load(media, {
        autoplay: true
      }, function(err, status) {
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
