const socket = io.connect('10.0.0.145:3000/');
const myButtonID = 9;
const fileUrl = 'buttons.mp3';

// const track = new Pizzicato.Sound(fileUrl);
const context = new AudioContext();
let buffer = null;
const source = context.createBufferSource();

const tracks = [source];
let playing = false;

let startTime = context.currentTime;
let currentTime = 0;

let loops = [];
let currLoop = {
    start: 0,
    stop: 0,
};

function play() {
    playing = true;
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

    if (currLoop.start === currLoop.stop) {
        currLoop.start = currentTime;
    } else {
        currLoop.stop = currentTime;
        const src = context.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = 0;
        src.loopEnd = 3;
        src.start();

        tracks.push(src);
        play();

        currLoop = {
            start: 0,
            stop: 0,
        };
    }
}

// // ===== interaction / button events
function parseButtonData(data) {
    if (data.b0) {
        play();
    } else if (data.b1) {
        pause();
    } else if (data.b2) {
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
        // console.log(audioBuffer.duration);
    });

socket.on('buttonUpdate', (data) => {
    if (data.id === 9) {
        parseButtonData(data);
    }
});