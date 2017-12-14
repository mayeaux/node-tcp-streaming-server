var http = require('http');
var net = require('net');
var path = require('path');
var express = require('express');
var app = express();
var WebSocketServer = require('websocket').server;
var fs = require('fs-extra');
var probe = require('node-ffprobe');
const exec = require('child_process').exec;
const concat = require('concat');
const randomstring = require('randomstring');

const Promise = require('bluebird');

var options = {
    root: path.resolve(__dirname, '../client/'),
    httpPort: 8080,
    tcpPort: 9090
};

process.on('unhandledRejection', console.log);

// Send static files with express
app.use(express.static(options.root)); 

/** All ws clients */
var wsClients = [];

/**
 * Send index.html over http
 */
app.get('/', function(req, res){
  res.sendFile('index.html', options);
});

/** HTTP server */
var server = http.createServer(app);
server.listen(options.httpPort);


/** Websocet */
var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
    maxReceivedFrameSize : 9999999999,
    maxReceivedMessageSize: 99999999
});

let index = 1;

(async function() {

  const randomString = await randomstring.generate(7);

  wsServer.on('request', function (request) {
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    // add client to ws users collection
    wsClients.push(connection);


    // send user beginning of stream if there's already a last twenty seconds
    if (false) {

      console.log('sending first blob');

      wsClients.map(function (client, index) {

        client.sendBytes(lastTwentySeconds);
      });


    }

    /** RECEIVE DATA FROM BROWSER **/
    connection.on('message', async function (message) {

      console.log(`writing file: ${randomString}/${index}`);

      await fs.ensureDir(`./${randomString}`);

      await fs.writeFile(`./${randomString}/${index}.webm`, message.binaryData);

      index++

    });

    connection.on('close', function (reasonCode, description) {
      console.log(reasonCode);

      console.log(description);

      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });

  console.log('listening on port 8080');

})();