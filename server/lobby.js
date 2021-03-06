const uuidv4 = require('uuid/v4');
const isUuid = require('is-uuid');
const Player = require('./player.js');
const Game = require('./game.js');

class Lobby {
    constructor(io) {
        this.games = [];
        this.io = io;
        this.waitingPlayer = undefined;

        this.binedOnGameClosed = this.onGameClosed.bind(this);

        io.on(Lobby.CLIENT_EVENT.CONNECTION, this.onNewSocket.bind(this));
    }

    onNewSocket(socket) {
        console.log('a user connected');

        socket.on(Lobby.CLIENT_EVENT.CLIENT_ID, this.onClientID.bind(this, socket));
        socket.once(Lobby.CLIENT_EVENT.DISCONNECT, this.onSocketDisconnect.bind(this, socket));
        socket.on(Lobby.CLIENT_EVENT.NEW_GAME, this.onNewGame.bind(this, socket));
    }

    onClientID(socket, clientId) {
        if (!isUuid.v4(clientId)) {
            const newid = Lobby.getNewUserId();
            socket.emit(Lobby.SERVER_EVENT.CLIENT_ID, newid);
            const player = new Player(socket, newid);
            this.newPlayerCreated(socket, player);
        } else {
            const runningGame = this.getGameForPlayerID(clientId);
            if (!runningGame) {
                // check if the waiting player just reconnected
                if (this.waitingPlayer && this.waitingPlayer.id === clientId) {
                    this.waitingPlayer.reconnect(socket);
                    socket.emit(Game.SERVER_EVENT.GAME_STATE, { state: Game.CLIENT_STATE.WAITING_FOR_OTHER_PLAYER });
                } else {
                    const player = new Player(socket, clientId);
                    this.newPlayerCreated(socket, player);
                }
            } else {
                runningGame.reconnect(clientId, socket);
            }
        }
    }

    onSocketDisconnect(socket) {
        if (this.waitingPlayer && this.waitingPlayer.socket === socket) {
            this.waitingPlayer = undefined;
        }
    }

    onNewGame(socket, clientId) {
        this.onClientID(socket, clientId);
    }

    newPlayerCreated(socket, player) {
        if (!this.waitingPlayer) {
            this.waitingPlayer = player;
            socket.emit(Game.SERVER_EVENT.GAME_STATE, { state: Game.CLIENT_STATE.WAITING_FOR_OTHER_PLAYER });
        } else {
            const game = this.createGame(this.waitingPlayer, player);
            this.games.push(game);
            this.waitingPlayer = undefined;
        }
    }

    getGameForPlayerID(playerId) {
        return this.games.find(game => game.containsPlayer(playerId));
    }

    createGame(player1, player2) {
        const game = new Game(player1, player2);
        game.on(Game.EVENT.GAME_CLOSED, this.binedOnGameClosed);
        return game;
    }
    removeGame(gameToRemove) {
        gameToRemove.removeListener(Game.EVENT.GAME_CLOSED, this.binedOnGameClosed);
        this.games = this.games.filter(game => game !== gameToRemove);
    }

    static getNewUserId() {
        return uuidv4();
    }
    onGameClosed(game) {
        this.removeGame(game);
    }
}

/**
 * events that the client emits (socket.io)
 * @type {Object.<String, String>}
 */
Lobby.CLIENT_EVENT = {
    // not a real client event because it is not send from the client but the client initialized the process
    CONNECTION: 'connection',
    CLIENT_ID: 'client-id',
    NEW_GAME: 'new-game',
};
/**
 * events that the server emits (socket.io)
 * @type {Object.<String, String>}
 */
Lobby.SERVER_EVENT = {
    CLIENT_ID: 'client-id',
};

module.exports = Lobby;
