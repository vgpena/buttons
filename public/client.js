// const socket = io.connect('10.0.0.145:3000/');
const myButtonID = 9;
const fileUrl = 'buttons.mp3';
const keys = [
    {
        key: " ",
        name: "Space",
        function: "playOrPause",
        functionName: "Play/Pause"
    },
    {
        key: "m",
        name: "m",
        function: "muteOrUnmute",
        functionName: "Mute/Unmute",
    },
    {
        key: "ArrowLeft",
        name: "Left Arrow",
        function: "restart",
        functionName: "Restart",
    },
    {
        key: "Enter",
        name: "Enter",
        function: "defineLoopEndpoint",
        functionName: "Start/End Loop",
    },
    {
        key: "Backspace",
        name: "Backspace",
        function: "eraseLastLoop",
        functionName: "Erase Last Loop",
    },
    {
        key: "Shift",
        name: "Shift",
        function: "toggleRev",
        functionName: "Toggle Reverse",
    },
];
const context = new AudioContext();
let buffer = null;
let source = context.createBufferSource();
const gainNode = context.createGain();
const analyserNode = context.createAnalyser();
const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth * 2;
canvas.height = 300 * 2;
const ctx = canvas.getContext('2d');
const numChunks = 124;
const chunks = new Array(numChunks);

let tracks = [source];
let playing = false;
let muted = false;
let reverse = false;
let newLoop = true;

let startTime = 0;
let currentTrackTime = 0;

let currLoop = {};

// ======== first-order functions;
// ==== i.e., ones directly executed via keypress
function playOrPause() {
    if (!playing) {
        play();
        return;
    }
    pause();
}

function muteOrUnmute() {
    if (!playing) {
        return;
    }
    if (!muted) {
        mute();
        return;
    }
    unmute();
}

function restart() {
    tracks[0].stop();
    tracks[0].disconnect(context.destination);
    const newSource = context.createBufferSource();
    newSource.buffer = cloneAudioBuffer(buffer);
    tracks[0] = newSource;
    newSource.start();
    newSource.connect(gainNode);
    if (playing) {
        play();
    }
}

function defineLoopEndpoint() {
    if (!playing) {
        return;
    }
    if (newLoop) {
        currLoop.start = currentTrackTime + context.currentTime - startTime;
        newLoop = false;
        return;
    }

    currLoop.stop = currentTrackTime + context.currentTime - startTime;
    newLoop = true;
    const src = context.createBufferSource();
    src.buffer = cloneAudioBuffer(tracks[0].buffer, currLoop.start, currLoop.stop, reverse);
    src.loop = true;
    src.start();

    tracks.push(src);
    connectAllTracks();
}

function eraseLastLoop() {
    if (tracks.length === 1) {
        console.error('No loops to erase!');
        return;
    }
    tracks[tracks.length - 1].disconnect(context.destination);
    tracks.pop();
}

function toggleRev() {
    reverse = !reverse;
}

// ======== second-order functions;
// ==== i.e, ones executed by first-order functions
function play() {
    playing = true;
    startTime = context.currentTime;
    connectAllTracks();
    startVisualization();
}

function pause() {
    playing = false;
    currentTrackTime += context.currentTime - startTime;
    tracks[0].disconnect(analyserNode);
    tracks.forEach((src) => {
        src.disconnect(context.destination);
    });
}

function connectAllTracks() {
    tracks.forEach((src) => {
        src.connect(context.destination);
    });
}

function mute() {
    muted = true;
    gainNode.connect(context.destination);
    gainNode.gain.value = -1;
}

function unmute() {
    muted = false;
    gainNode.disconnect(context.destination);
    gainNode.gain.value = 1;
}

// ======== utility functions
// ==== data manipulation, etc.
// https://stackoverflow.com/questions/12484052/how-can-i-reverse-playback-in-web-audio-api-but-keep-a-forward-version-as-well
function cloneAudioBuffer(audioBuffer, start = 0, stop = audioBuffer.duration, reverseBuffer = false) {
    const channels = [];
    const numChannels = audioBuffer.numberOfChannels;

    const startIndex = Math.floor((start / audioBuffer.duration) * audioBuffer.length);    
    const stopIndex = Math.floor((stop / audioBuffer.duration) * audioBuffer.length);
    //clone the underlying Float32Arrays
    for (let i = 0; i < numChannels; i++) {
        channels[i] = new Float32Array(audioBuffer.getChannelData(i)).slice(startIndex, stopIndex);
        if (reverseBuffer) {
            channels[i].reverse();
        }
    }

    //create the new AudioBuffer (assuming AudioContext variable is in scope)
    const newBuffer = context.createBuffer(audioBuffer.numberOfChannels, stopIndex - startIndex, audioBuffer.sampleRate);

    //copy the cloned arrays to the new AudioBuffer
    for (let i = 0; i < numChannels; i++) {
        newBuffer.getChannelData(i).set(channels[i]);
    }

    return newBuffer;
}

// ======== visualization
function draw(dataArray) {
    if (!playing) {
        return;
    }
    analyserNode.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, 400);
    const width = canvas.width / dataArray.length;
    for (let i = 0; i < dataArray.length; i++) {
        const height = dataArray[i];
        ctx.fillStyle = 'yellow';
        ctx.fillRect(width * i, 0, width, height);
    }
    requestAnimationFrame(() => draw(dataArray));
}

function drawBackgroundTrack() {
    analyserNode.fftSize = 32;
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    draw(dataArray);
}

function startVisualization() {
    tracks[0].connect(analyserNode);
    drawChunks();
}

function drawChunks() {
    ctx.restore();
    ctx.fillRect(0, 0, canvas.width * ((playing ? currentTrackTime + context.currentTime - startTime : currentTrackTime) / tracks[0].buffer.duration), canvas.height);
    if (playing) {
        requestAnimationFrame(drawChunks);
    }
}

function drawEntireTrack() {
    // 1. get data from buffer
    const left = tracks[0].buffer.getChannelData(0);
    const right = tracks[0].buffer.getChannelData(1);
    // 2. chunk song
    const bytesPerChunk = Math.floor(left.length / numChunks);
    const space = 5;
    const width = (canvas.width - chunks.length * space) / chunks.length;
    const heightMultiplier = canvas.height * 2;
    for (let i = 0; i < numChunks; i++) {
        let nonZeroBytesCount = 0;
        let bytesTotal = 0;
        for (let j = 0; j < bytesPerChunk; j++) {
            const byte = Math.abs(left[i * bytesPerChunk + j]) + Math.abs(right[i * bytesPerChunk + j]);
            if (byte === 0) {
                break;
            }
            bytesTotal += byte;
            nonZeroBytesCount++;
        }
        chunks[i] = nonZeroBytesCount ? bytesTotal / nonZeroBytesCount : 0;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    for (let i = 0; i < chunks.length; i++) {
        const height = chunks[i];
        ctx.rect(width * i + space * i, canvas.height / 2 - (height * (heightMultiplier / 2)), width, height * heightMultiplier);
    }
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#0dbc6a';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.save();
    drawChunks();
}

//========================= setup
window.fetch(fileUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
        buffer = audioBuffer;
        tracks[0].buffer = buffer;
        tracks[0].loop = true;
        tracks[0].start();
        tracks[0].connect(gainNode);
        drawEntireTrack();
    });

document.addEventListener('keydown', (e) => {
    const index = keys.find((key) => key.key === e.key);
    if (!index) {
        console.error(`No function bound to key ${ e.key }`);
        return;
    }

    if (!window[index.function]) {
        console.error(`No function with name ${ index.function } exists`);
        return;
    }

    window[index.function]();
});