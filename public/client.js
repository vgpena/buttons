const socket = io.connect('10.0.0.145:3000/');
const myButtonID = 9;
const fileUrl = 'buttons.mp3';

const track = new Pizzicato.Sound(fileUrl);

// // ===== interaction / button events
function parseButtonData(data) {
    if (data.b0) {
        track.play(0, 5);
    } else if (data.b1) {
        track.pause();
    } else if (data.b2) {
        var tremolo = new Pizzicato.Effects.Tremolo({
            speed: 20,
            depth: 0.8,
            mix: 0.8
        });

        track.addEffect(tremolo);
    }
}

socket.on('buttonUpdate', (data) => {
    if (data.id === 9) {
        parseButtonData(data);
    }
});