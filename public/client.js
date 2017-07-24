const socket = io.connect('10.0.0.145:3000/');
const myButtonID = 9;
const fileUrl = 'buttons.mp3';

// ==== load & play file
const context = new AudioContext();
const playButton = document.getElementById('button');
let buffer = null;
const source = context.createBufferSource();

window.fetch(fileUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        buffer = audioBuffer;
        source.buffer = buffer;
        source.start();
    });

// playButton.onclick = () => play();

function play() {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
}

function parseButtonData(data) {
    if (data.b0) {
        source.connect(context.destination);
    } else if (data.b1) {
        source.disconnect(context.destination);
    }
}

// ===== interaction / button events
socket.on('buttonUpdate', (data) => {
    if (data.id === 9) {
        parseButtonData(data);
    }
});