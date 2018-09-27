const mdns = require('mdns-js'),
  request = require('request'),
  fs = require('fs'),
  Client = require('castv2-client').Client,
  DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver,
  fileName = 'voice.wav';
let localAddress = null,
  zunkoAddress = null;

const init = (_localAddress, _zunkoAddress) =>  {
  localAddress = _localAddress;
  zunkoAddress = _zunkoAddress;
};

const notify = (_ip, _message, _callback) => {
  request.post({
    url: zunkoAddress + 'SAVE/1700',
    encoding: null,
    headers: {
      "Content-type": "application/json",
    },
    json: {
      talktext: _message,
      speed: 1.0,
      volume:2.0,
      pitch:1.0,
      intonation:1.0
    }
  }, (_err, _res, _body) => {
    if(_err){
      console.error(_err);
      callback(`ERROR: ${_err}`)
    }else{
      fs.writeFileSync('data/' + fileName, _body, 'binary');
      play(_ip, localAddress + fileName , function(_res) {
        _callback(_res)
      });
    }
  });
};

const play = (_ip, _url, _callback) => {
  deviceAddressArray.forEach((_deviceAddress) => {  
    let client = new Client();
    client.connect(_deviceAddress, function() {
      client.launch(DefaultMediaReceiver, function(err, player) {
        var media = {
          contentId: _url,
          contentType: 'audio/mp3',
          streamType: 'BUFFERED' // or LIVE
        };
        player.load(media, {
          autoplay: true
        }, function(err, status) {
          client.close();
          _callback(_url);
        });
      });
    });

    client.on('error', (_err) => {
      console.error('Error: %s', _err.message);
      client.close();
      _callback('error');
    });
  });
};

exports.init = init;
exports.play = play;
exports.notify = notify;
