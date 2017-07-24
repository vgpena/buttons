const path = require('path');
const express = require('express');

const app = express();
// const server = require('http').Server(app);
// const io = require('socket.io')(server);

// ========================

app.listen(8080);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use(express.static('public'));

// ========================

// function sendClientsCount() {
//   users.clients((err, clients) => {
//     if (err) {
//       throw new Error(err);
//     }
//     users.emit('updateClientCount', clients.length);
//     viewer.emit('updateClientCount', clients.length);
//   });
// }

// function addSocketEvents(socket) {
//   socket.on('click', (data) => {
//     viewer.emit('click', data);
//   });

//   socket.on('disconnect', () => {
//     sendClientsCount();
//   });
// }