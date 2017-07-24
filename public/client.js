const socket = io.connect('10.0.0.145:3000/');

socket.on('buttonUpdate', (data) => {
    console.log(data);
});

console.log('a');