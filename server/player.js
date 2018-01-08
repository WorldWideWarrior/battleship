const EventEmitter = require('events');
const Ships = require('./ships.js');
const GenerateShips = require('./generate-ships.js');

class Player extends EventEmitter {
    constructor(socket, id) {
        super();
        this.isConnected = true;
        this.socket = socket;
        this.id = id;
        this.ships = undefined;

        this.bindedOnNameSet = this.onNameSet.bind(this);
        //this.bindedOnShipsSet = this.onShipsSet.bind(this);

        this.addListenerToSocket(socket);

        console.log(`Created user: ${id}, socket: ${socket}`);

        console.log(`Ships: ${this.generateShips()}`);
        //TODO send ships to local client
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
        //socket.removeListener(Player.CLIENT_EVENT.CLIENT_EVENT, this.bindedOnShipsSet);
    }

    addListenerToSocket(socket) {
        socket.on(Player.CLIENT_EVENT.SET_NAME, this.bindedOnNameSet);
        //socket.once(Player.CLIENT_EVENT.SET_SHIPS, this.bindedOnShipsSet);
    }

    sendOpponentName(opponent, name) {
        this.socket.emit(Player.SERVER_EVENT.SET_NAME, name);
    }

    onGameStateChange(game, fromState, toState) {
        const clientState = game.clientStateForPlayer(this, toState);
        const gameState = {
            state: clientState,
        };
        this.socket.emit(Player.SERVER_EVENT.GAME_STATE, gameState);
    }

    onDisconnect() {
        this.isConnected = false;
    }

    onNameSet(name) {
        this.name = name;
        this.emit(Player.EVENT.CHANGE_NAME, this, name);
    }
    /*
    onShipsSet(ships) {
        //check if the user already set its ships
        if(this.ships) return;

        this.emit(Player.EVENT.SETUP_FINISHED);
    }*/

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
        console.log(`reconnected user: ${this.id}`);
    }

    get debugDescription() {
        return `Player(name = ${this.name}, id = ${thisid})`
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
    SETUP_FINISHED: 'setup-finished',
};
/**
 * events that the client emits (socket.io)
 * @type {Object.<String, String>}
 */
Player.CLIENT_EVENT = {
    SET_NAME: 'set-name',
    //SET_SHIPS: 'set-ships', TODO ships are set from the server
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
