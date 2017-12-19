const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');

require('./lobby');

app.use(serveStatic('../static'));

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

http.listen(3000, () => {
    console.log('listening on *:3000');
    new Lobby(io);
});
