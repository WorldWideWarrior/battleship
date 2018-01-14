/* eslint-disable no-new */

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');

const Lobby = require('./lobby.js');
const highscore = require('./highscore.js');

app.use(serveStatic('../static'));

app.get('/api/highscore', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        const highscoreObject = highscore.getHighscores();
        res.status(200);
        res.send(highscoreObject);
    } catch (error) {
        res.status(500);
        res.send('Could not get highscore. Look into the server logs for more information');
        console.error('Could not get highscore. Reason:', error);
    }
});

app.post('/api/highscore', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(403);
    res.send('highscore can only be set by server');
});

http.listen(3000, () => {
    console.log('listening on *:3000');
    new Lobby(io);
});
