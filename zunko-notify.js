const mdns = require('mdns-js'),
  request = require('request'),
  fs = require('fs'),
  Client = require('castv2-client').Client,
  DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver,
  browser = mdns.createBrowser(mdns.tcp('googlecast')),
  fileName = 'data/voice.wav';
let deviceAddress,
  localAddress,
  zunkoAddress;

var device = function(_name, _localAddress, _zunkoAddress) {
  device = _name;
  localAddress = _localAddress;
  zunkoAddress = _zunkoAddress;
  return this;
};

var ip = function(_ip, _localAddress, _zunkoAddress) {
  deviceAddress = _ip;
  localAddress = _localAddress;
  zunkoAddress = _zunkoAddress;
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

var getSpeechUrl = function(message, host, callback) {
  request.post({
    url: zunkoAddress + 'SAVE/ZUNKO_EX',
    encoding: null,
    form: {
      TALKTEXT: message,
      VOLUME: "2.00"
    },
    headers: {
      "charset": "UTF-8"
    }
  }, (err, res, body) => {
    fs.writeFileSync(fileName, body, 'binary');
    //onDeviceUp(host, localAddress + fileName , function(res) {
      callback(res)
    //});
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
