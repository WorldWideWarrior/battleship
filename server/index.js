const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const serveStatic = require('serve-static');

app.use(serveStatic('../static'));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

io.on('connection', (socket) => {
  console.log(`a user connected ${socket}`);
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
