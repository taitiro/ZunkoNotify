const mdns = require('mdns-js'),
      request = require('request'),
      fs = require('fs'),
      Client = require('castv2-client').Client,
      DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver,
      browser = mdns.createBrowser(mdns.tcp('googlecast')),
      zunkoAddress = 'http://192.168.86.20:7180/'
      deviceAddress;

var device = function(name) {
  device = name;
  return this;
};

var ip = function(ip) {
  deviceAddress = ip;
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
  request.post({url : zunkoAddress + 'SAVE/ZUNKO', encoding: null,  form : {TALKTEXT:text},headers:{"charset":"UTF-8"}},(err,res,body) =>{
    fs.writeFileSync('voice.wav', body, 'binary');
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
    console.error('Error: %s', err.message);
    client.close();
    callback('error');
  });
};

exports.ip = ip;
exports.device = device;
exports.notify = notify;
exports.play = play;
