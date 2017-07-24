const socket = io.connect('10.0.0.145:3000/');
const myButtonID = 9;
const fileUrl = 'buttons.mp3';

const context = new AudioContext();
let buffer = null;
const source = context.createBufferSource();

const tracks = [source];
let playing = false;
let newLoop = true;

let startTime = 0;
let currentTrackTime = 0;

let currLoop = {};

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
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = currLoop.start;
        src.loopEnd = currLoop.stop;
        src.start(0, currLoop.start);

        tracks.push(src);
        play();
    }
}

// // ===== interaction / button events
function parseButtonData(data) {
    if (data.b0) {
        if (!playing) {
            play();
        } else {
            pause();
        }
    } else if (data.b1) {
        loop();
    }
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

socket.on('buttonUpdate', (data) => {
    if (data.id === 9) {
        parseButtonData(data);
    }
});