const path = require('path');
const express = require('express');

const app = express();

app.listen(8080);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use(express.static('public'));