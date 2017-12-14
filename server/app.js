var http = require('http');
var net = require('net');
var path = require('path');
var express = require('express');
var app = express();
var WebSocketServer = require('websocket').server;
var fs = require('fs');
var probe = require('node-ffprobe');
const exec = require('child_process').exec;
const concat = require('concat');

const Promise = require('bluebird');

function isAbv(value) {
  return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
}

var firstPacket = [];

var options = {
    root: path.resolve(__dirname, '../client/'),
    httpPort: 8080,
    tcpPort: 9090
};

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

/** TCP server */
var tcpServer = net.createServer(function(socket) {
    socket.on('data', function(data){

      // console.log(data);

      /**
       * We are saving first packets of stream. These packets will be send to every new user.
       * This is hack. Video won't start without them.
       */
      if(firstPacket.length < 3){ 
        console.log('Init first packet', firstPacket.length);
        firstPacket.push(data); 
      }


      /**
       * Send stream to all clients
       */
      wsClients.map(function(client, index){
        client.sendBytes(data);
      });


    });
});

tcpServer.listen(options.tcpPort, 'localhost');

/** Websocet */
var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
    maxReceivedFrameSize : 9999999999,
    maxReceivedMessageSize: 99999999
});



function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

// async function concatFiles(latestBuffer){
//   await saveFile('./latestFile')
//   await
// }

function createLastTwentySeconds(){

}


function saveBlob(binaryData){
  fs.writeFile(`${index}.webm`, binaryData, function(err) {

    index++

    if(err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });
}

var lastTwentySeconds;

var totalBuffer;
var index = 0;

wsServer.on('request', function(request) {
  var connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');

  // add client to ws users collection
  wsClients.push(connection);

  fs.readFile('./test4.webm', function (err,data) {
    if (err) {
      return console.log(err);
    }

    console.log('file read')

    wsClients.map(async function(client, index){

      client.sendBytes(data);

      await Promise.delay(1000 * 10);

      fs.readFile('./6.webm', async function (err,data) {
        if (err) {
          return console.log(err);
        }


        console.log('file read');

        await Promise.delay(1000 * 10);

        console.log('sending');

        client.sendBytes(data);

          fs.readFile('./7.webm', async function (err,data) {
            if (err) {
              return console.log(err);
            }

            console.log('file read')

            await Promise.delay(1000 * 10);

            console.log('sending');

            client.sendBytes(data);

            fs.readFile('./8.webm', async function (err,data) {
              if (err) {
                return console.log(err);
              }

              console.log('file read')

              client.sendBytes(data);

            });

          });

      });

    });

  });


  // send user beginning of stream if there's already a last twenty seconds
  if(lastTwentySeconds){

    console.log('sending first blob');

    wsClients.map(function(client, index){

      client.sendBytes(lastTwentySeconds);
    });


  }

  /** RECEIVE DATA FROM BROWSER **/
  connection.on('message', function(message) {

    if(!totalBuffer){
      totalBuffer = message.binaryData;
    } else {
      totalBuffer = Buffer.concat([totalBuffer, message.binaryData]);
    }

    index++;

    console.log('index ' + index)

    if(index == 5){

      console.log('sending total buffer');
      // receive data from broadcaster and push to viewer (possible bug here, dont push to livestreamer)
      wsClients.map(function(client, index){

        client.sendBytes(totalBuffer);
      });
    }

    // // receive data from broadcaster and push to viewer (possible bug here, dont push to livestreamer)
    // wsClients.map(function(client, index){
    //
    //   client.sendBytes(message.binaryData);
    // });


  });

  connection.on('close', function(reasonCode, description) {
    console.log(reasonCode);

    console.log(description);

    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});

console.log('listening on port 8080');