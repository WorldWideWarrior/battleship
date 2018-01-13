/* eslint-disable no-new */

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');
const fs = require('fs');

const Lobby = require('./lobby.js');
const Highscore = require('./highscore.js');
let highscoreObject;

app.use(serveStatic('../static'));

app.get('/api/highscore', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    initHighscore();

    if(highscoreObject && highscoreObject.getHighscores()) {
        res.status(200);
        res.send(highscoreObject.getHighscores());
    } else {
        res.status(500);
        res.send(null);
    }
});

app.post('/api/highscore', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(403);
    res.send("highscore can only be set by server");
});

http.listen(3000, () => {
    console.log('listening on *:3000');
    new Lobby(fs, io);
});

function initHighscore() {
    highscoreObject = new Highscore(fs);
}
