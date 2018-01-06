const uuidv4 = require('uuid/v4');
const Player = require('./player.js');
const Game = require('./game.js');

class Lobby {
    constructor(io) {
        this.games = [];
        this.io = io;
        this.waitingPlayer = undefined;

        io.on(Lobby.CLIENT_EVENT.CONNECTION, this.onNewSocket.bind(this));
    }

    onNewSocket(socket) {
        console.log('a user connected');

        socket.on(Lobby.CLIENT_EVENT.CLIENT_ID, this.onClientID.bind(this, socket));
    }

    onClientID(socket, clientId) {
        if (!clientId) {
            const newid = this.getNewUserId();
            socket.emit(Lobby.SERVER_EVENT.CLIENT_ID, newid);
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
            socket.emit(Game.SERVER_EVENT.GAME_STATE, { state: 'waitingForSecondPlayer' });
        } else {
            const game = this.createGame(this.waitingPlayer, player);
            this.games.push(game);
            this.waitingPlayer = undefined;
        }
    }

    getGameForPlayerID(playerId) {
        return this.games.find((game) => game.containsPlayer(playerId));
    }

    createGame(player1, player2) {
        return new Game(player1, player2);
    }

    getNewUserId() {
        return uuidv4();
    }
};

/**
 * events that the client emits (socket.io)
 * @type {Object.<String, String>}
 */
Lobby.CLIENT_EVENT = {
    //not a real client event because it is not send from the client but the client initialized the process
    CONNECTION: "connection",
    CLIENT_ID: "client-id",
};
/**
 * events that the server emits (socket.io)
 * @type {Object.<String, String>}
 */
Lobby.SERVER_EVENT = {
    CLIENT_ID: "client-id",
};

module.exports = Lobby;
