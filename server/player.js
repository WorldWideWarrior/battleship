const EventEmitter = require('events');
const Ships = require('./ships.js');
const GenerateShips = require('./generate-ships.js');

class Player extends EventEmitter {
    constructor(socket, id) {
        super();
        this.isConnected = true;
        this.socket = socket;
        this.id = id;
        this.ships = this.generateShips();

        this.bindedOnNameSet = this.onNameSet.bind(this);
        this.bindedShotAt = this.onShotAt.bind(this);

        this.addListenerToSocket(socket);

        console.log(`Created user: ${id}, socket address: ${socket.handshake.address}`);
    }

    generateShips() {
        const shipsToGenerate = [
            Ships.CARRIER, Ships.BATTLESHIP, Ships.BATTLESHIP,
            Ships.CRUISER, Ships.CRUISER, Ships.CRUISER,
            Ships.DESTROYER, Ships.DESTROYER, Ships.DESTROYER, Ships.DESTROYER
        ];

        return GenerateShips.generateShips(shipsToGenerate);
    }

    removeListenerFromSocket(socket) {
        socket.removeListener(Player.CLIENT_EVENT.SET_NAME, this.bindedOnNameSet);
        socket.removeListener(Player.CLIENT_EVENT.SHOT_AT, this.bindedShotAt);
    }

    addListenerToSocket(socket) {
        socket.on(Player.CLIENT_EVENT.SET_NAME, this.bindedOnNameSet);
        socket.on(Player.CLIENT_EVENT.SHOT_AT, this.bindedShotAt);
    }

    sendOpponentName(opponent, name) {
        this.socket.emit(Player.SERVER_EVENT.SET_NAME, name);
    }

    onGameStateChange(game, fromState, toState) {
        const clientState = game.clientStateForPlayer(this, toState);
        const opponent = game.getOpponentOf(this);
        const gameState = {
            state: clientState,
            myName: this.name,
            otherName: opponent.name,
            //TODO only send ships once for each connection because this will never change (clients needs to be aware)
            myShips: this.ships,
            //TODO send only ships that are destroyed
            otherShips: opponent.ships,
        };

        this.socket.emit(Player.SERVER_EVENT.GAME_STATE, gameState);
    }

    onDisconnect() {
        this.isConnected = false;
        console.debug(`disconnected ${this.debugDescription}`);
    }

    onNameSet(name) {
        this.name = name;
        this.emit(Player.EVENT.CHANGE_NAME, this, name);
        console.debug(`name set ${this.debugDescription}`);
    }

    onShotAt(x, y) {
        this.emit(Player.EVENT.SHOT_AT, this, x, y);
    }

    setName(name) {
        this.name = name;
    }

    getId() {
        return this.id;
    }

    reconnect(socket) {
        this.isConnected = true;
        this.removeListenerFromSocket(this.socket);
        this.socket = socket;
        this.addListenerToSocket(socket);
        console.log(`reconnected ${this.debugDescription}`);
    }

    get debugDescription() {
        return `Player(name = ${this.name}, id = ${this.id})`
    }

    get isSetupDone() {
        return !!this.ships;
    }
};
/**
 * local events from the player instance directly (not from socket.io)
 * @type {Object.<String, String>}
 */
Player.EVENT = {
    CHANGE_NAME: 'change-name',
    SHOT_AT: 'shot-at',
};
/**
 * events that the client emits (socket.io)
 * @type {Object.<String, String>}
 */
Player.CLIENT_EVENT = {
    SET_NAME: 'set-name',
    SHOT_AT: 'shot-at',
};
/**
 * events that the server emits (socket.io)
 * @type {Object.<String, String>}
 */
Player.SERVER_EVENT = {
    SET_NAME: 'set-name',
    GAME_STATE: 'game-state',
};

module.exports = Player;
