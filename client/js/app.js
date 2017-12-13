(function(){
'use strict';

var codecString = '';
/**
 *  Set to whatever codec you are using
 */

// codecString = 'video/mp4; codecs="avc1.42C028"';
// codecString = 'video/webm; codecs="vp8"';
// codecString = 'video/webm; codecs="vp9"';
// codecString = 'video/mp4; codecs="avc1.42C028, mp4a.40.2"';

codecString = 'video/webm; codecs="opus,vp8"';





  var video = document.getElementById('video');
var mediaSource = new MediaSource();
video.src = window.URL.createObjectURL(mediaSource);
var buffer = null;
var queue = [];

var bufferArray = [];

function updateBuffer(){
    if (queue.length > 0 && !buffer.updating) {
        buffer.appendBuffer(queue.shift());
    }
}

/**
 * Mediasource
 */
function sourceBufferHandle(){
    buffer = mediaSource.addSourceBuffer(codecString);
    buffer.mode = 'sequence';

    buffer.addEventListener('update', function() { // Note: Have tried 'updateend'
        console.log('update');
        updateBuffer();
    });

    buffer.addEventListener('updateend', function() {
        console.log('updateend');
        updateBuffer();
    });

    initWS();
}

mediaSource.addEventListener('sourceopen', sourceBufferHandle)

function initWS(){
    var webSocketString = 'ws://' + window.location.hostname + ':' + window.location.port;

    console.log(webSocketString)

    var ws = new WebSocket(webSocketString, 'echo-protocol');
    ws.binaryType = "arraybuffer";

    ws.onopen = function(){
        console.info('WebSocket connection initialized');
    };

    ws.onmessage = function (event) {
        console.info('Recived WS message.', event);

        if(typeof event.data === 'object'){
            if (buffer.updating || queue.length > 0) {

                console.log('adding to queue');

                console.log(event.data);

                queue.push(event.data);
            } else {

                console.log(event.data);

                console.log('appending right now')

              console.log(event.data);

                buffer.appendBuffer(event.data);
                video.play();
            }
        }
    };

}


})();