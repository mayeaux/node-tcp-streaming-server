var http = require('http');
var net = require('net');
var path = require('path');
var express = require('express');
var app = express();
var WebSocketServer = require('websocket').server;
var fs = require('fs-extra');
var probe = require('node-ffprobe');
const exec = require('child_process').exec;
const randomstring = require('randomstring');

const Promise = require('bluebird');

const concat = Promise.promisifyAll(require('concat-files'));

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


async function createNewLatestFile(randomString, index){
  const newFile = await concat([`./${randomString}/1.webm`, `./${randomString}/${index}.webm`], `${randomString}/latestFile.webm`);

  console.log('done concat');
}

(async function() {
  //
  let index = 1;
  const randomString = await randomstring.generate(7);
  //
  // const randomString = 'X6GVWfC';
  // let index = 3;


  wsServer.on('request', async function (request) {
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');

    // console.log(connection);

    // add client to ws users collection
    wsClients.push(connection);


    let fileName;
    // send user beginning of stream if there's already a last twenty seconds
    if (index > 2) {
      let file;

      console.log('sending first latestFile');

      fileName = `./${randomString}/latestFile.webm`;

      file = await fs.readFile(fileName);

      connection.sendBytes(file);

      await Promise.delay(1000 * 15);

      file = await fs.readFile(`./${randomString}/${index + 1}.webm`);

      connection.sendBytes(file);

      await Promise.delay(1000 * 15);

      file = await fs.readFile(`./${randomString}/${index + 2}.webm`);

      connection.sendBytes(file);

      await Promise.delay(1000 * 15);

      file = await fs.readFile(`./${randomString}/${index + 3}.webm`);

      connection.sendBytes(file);


    } else if (index == 2){

      fileName = `./${randomString}/1.webm`;

      const file = await fs.readFile(fileName);

      connection.sendBytes(file);

    }

    /** RECEIVE DATA FROM BROWSER **/
    connection.on('message', async function (message) {

      console.log(`writing file: ${randomString}/${index}`);

      await fs.ensureDir(`./${randomString}`);

      await fs.writeFile(`./${randomString}/${index}.webm`, message.binaryData);

      console.log('written file first way')

      fs.writeFile(`./${randomString}/${index}-other.webm`, message.binaryData, function(err, response){
        console.log('written file second way');
      })


      if(index > 1){
        await createNewLatestFile(randomString, index);
      }

      index++;

      // wsClients.map(function (client, index) {
      //
      //   client.sendBytes(message.binaryData);
      // });

    });

    connection.on('close', function (reasonCode, description) {
      console.log(reasonCode);

      console.log(description);

      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });

  console.log('listening on port 8080');

})();