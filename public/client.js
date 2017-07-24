const socket = io.connect('10.0.0.145:3000/');
const myButtonID = 9;
const fileUrl = 'buttons.mp3';

const track = new Pizzicato.Sound(fileUrl);
let currTrackTime = 0;
let currTime = Pizzicato.context.currentTime;
let loops = [];
let currLoop = {
    start: 0,
    stop: 0,
};

function loop() {
    if (!track.playing) {
        return;
    }
    setTrackTime();
    // create new loop
    if (currLoop.start === currLoop.stop) {
        currLoop.start = currTrackTime;
    } else {
        currLoop.stop = currTrackTime;
        loops.push({ ...currLoop });
        currLoop = {
            start: 0,
            stop: 0,
        }
        console.log(JSON.stringify(loops));
    }
}

function setTrackTime() {
    currTrackTime += Pizzicato.context.currentTime - currTime;
}

// // ===== interaction / button events
function parseButtonData(data) {
    if (data.b0) {
        track.play();
        currTime = Pizzicato.context.currentTime;
    } else if (data.b1) {
        track.pause();
        currTime = Pizzicato.context.currentTime;
    } else if (data.b2) {
        loop();
    }
}

socket.on('buttonUpdate', (data) => {
    if (data.id === 9) {
        parseButtonData(data);
    }
});