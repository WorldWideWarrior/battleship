/* eslint-disable no-new */
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');

const Lobby = require('./lobby.js');

app.use(serveStatic('../static'));

http.listen(3000, () => {
    console.log('listening on *:3000');
    new Lobby(io);
});
