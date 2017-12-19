const Player = require('./player.js');
const Game = require('./game.js');

module.exports = class Lobby {
    constructor(io) {
        this.games = [];
        this.io = io;
        this.waitingPlayer = undefined;

        io.on('connection', (socket) => {
            this.onNewSocket(socket);
        });
    }

    onNewSocket(socket) {
        console.log('a user connected');

        socket.on('client-id', (clientId) => {
            this.onClientID(socket, clientId);
        });
    }

    onClientID(socket, clientId) {
        if (!clientId) {
            const newid = this.getNewUserId();
            socket.emit('client-id', newid);
            const player = new Player(socket, newid);
            this.newPlayerCreated(socket, player);
        } else {
            const runningGame = this.getGameForPlayerID(clientId);
            if (!runningGame) {
                const player = new Player(socket, clientId);
                this.newPlayerCreated(socket, player);
            } else {
                runningGame.reconnect(clientId, socket);
            }
        }
    }

    newPlayerCreated(socket, player) {
        if (!this.waitingPlayer) {
            this.waitingPlayer = player;
            socket.emit('game-state', { state: 'waitingForSecondPlayer' });
        } else {
            const game = this.createGame(this.waitingPlayer, player);
            this.games.push(game);
            this.waitingPlayer = undefined;
        }
    }

    getGameForPlayerID(playerId) {
        for (let i = 0; i < this.games.length; i++) {
            if (this.games[i].containsPlayer(playerId)) {
                return this.games[i];
            }
        }

        return undefined;
    }

    createGame(player1, player2) {
        return new Game(player1, player2);
    }

    getNewUserId() {
        return Math.floor(Math.random() * 1000);
    }
};
