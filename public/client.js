// const socket = io.connect('10.0.0.145:3000/');
const myButtonID = 9;
const fileUrl = 'buttons.mp3';
const keys = [
    {
        key: " ",
        name: "Space",
        function: "playOrPause",
        functionName: "Play/Pause"
    }
];
const context = new AudioContext();
let buffer = null;
const source = context.createBufferSource();

let tracks = [source];
let playing = false;
let reverse = false;
let newLoop = true;

let startTime = 0;
let currentTrackTime = 0;

let currLoop = {};

function loop() {
    if (!playing) {
        return;
    }
    if (newLoop) {
        currLoop.start = context.currentTime - startTime;
        newLoop = false;
    } else {
        currLoop.stop = context.currentTime - startTime;
        newLoop = true;
        const src = context.createBufferSource();
        src.buffer = cloneAudioBuffer(buffer);
        if (reverse) {
            Array.prototype.reverse.call(src.buffer.getChannelData(0));
            Array.prototype.reverse.call(src.buffer.getChannelData(1));
            currLoop.start = src.buffer.duration - currLoop.start;
            currLoop.stop = src.buffer.duration - currLoop.stop;
        }
        src.loop = true;
        src.loopStart = currLoop.start;
        src.loopEnd = currLoop.stop;
        console.log(src);
        src.start(0, context.currentTime - startTime);

        tracks.push(src);
        play();
    }
}

function toggleRev() {
    reverse = !reverse;
}

// https://stackoverflow.com/questions/12484052/how-can-i-reverse-playback-in-web-audio-api-but-keep-a-forward-version-as-well
function cloneAudioBuffer(audioBuffer){
    // console.log(start, stop);
    var channels = [],
        numChannels = audioBuffer.numberOfChannels;

    //clone the underlying Float32Arrays
    for (var i = 0; i < numChannels; i++){
        channels[i] = new Float32Array(audioBuffer.getChannelData(i));
    }

    //create the new AudioBuffer (assuming AudioContext variable is in scope)
    var newBuffer = context.createBuffer(
                        audioBuffer.numberOfChannels,
                        audioBuffer.length,
                        audioBuffer.sampleRate
                    );

    //copy the cloned arrays to the new AudioBuffer
    for (var i = 0; i < numChannels; i++){
        newBuffer.getChannelData(i).set(channels[i]);
    }

    return newBuffer;
}

// // ===== interaction / button events
// function parseButtonData(data) {
//     if (data.b0) {
//         if (!playing) {
//             play();
//         } else {
//             pause();
//         }
//     } else if (data.b1) {
//         loop();
//     } else if (data.b2) {
//         toggleRev();
//     }
// }

// ======== first-order functions;
// ==== i.e., ones directly executed via keypress
function playOrPause() {
    if (!playing) {
        play();
        return;
    }
    pause();
}

// ======== second-order functions;
// ==== i.e, ones executed by first-order functions
function play() {
    playing = true;
    startTime = context.currentTime;
    tracks.forEach((src) => {
        src.connect(context.destination);
    });
}

function pause() {
    playing = false;
    tracks.forEach((src) => {
        src.disconnect(context.destination);
    });
}

// setup
window.fetch(fileUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        buffer = audioBuffer;
        source.buffer = buffer;
        source.loop = true;
        source.start();
    });

document.addEventListener('keydown', (e) => {
    const index = keys.find((key) => key.key === e.key);
    if (index) {
        window[index.function]();
    }
});