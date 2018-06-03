var express = require('express');
var googlehome = require('./zunko-notify.js');
var http = require("http");
var app = express();
const serverPort = 8080; // default port
var ip = '192.168.86.27';
var text = "はろーわーるど";

var server = http.createServer(app).listen(serverPort,
  function() {
    console.log("server stating on " + serverPort + " ...");
  }
);

app.use(express.static('./'));

app.get('/', function(req, res) {
  googlehome.ip(ip,'http://192.168.86.45:8080/','http://192.168.86.24:7180/');
  googlehome.notify(text, function(notifyRes) {
    console.log("exit");
    res.status(200).send(ip + ' will say: ' + text + '\n');
  });
});
