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
        /**
         * @type {[{position: {x: number, y: number}, hit: boolean}]}
         */
        this.shots = [];

        this.bindedOnNameSet = this.onNameSet.bind(this);
        this.bindedOnShotAt = this.onShotAt.bind(this);

        this.addListenerToSocket(socket);

        console.log(`Created user: ${id}, socket address: ${socket.handshake.address}`);
    }

    generateShips() {
        const shipsToGenerate = [
            Ships.CARRIER, Ships.BATTLESHIP, Ships.BATTLESHIP,
            Ships.CRUISER, Ships.CRUISER, Ships.CRUISER,
            Ships.DESTROYER, Ships.DESTROYER, Ships.DESTROYER, Ships.DESTROYER
        ];

        return GenerateShips.generateShips(shipsToGenerate).map((ship) => {
            ship.hits = 0;
            return ship;
        });
    }

    removeListenerFromSocket(socket) {
        socket.removeListener(Player.CLIENT_EVENT.SET_NAME, this.bindedOnNameSet);
        socket.removeListener(Player.CLIENT_EVENT.SHOT_AT, this.bindedOnShotAt);
    }

    addListenerToSocket(socket) {
        socket.on(Player.CLIENT_EVENT.SET_NAME, this.bindedOnNameSet);
        socket.on(Player.CLIENT_EVENT.SHOT_AT, this.bindedOnShotAt);
    }

    sendOpponentName(opponent, name) {
        this.socket.emit(Player.SERVER_EVENT.SET_NAME, name);
    }

    onGameStateChange(game, fromState, toState) {
        const clientState = game.clientStateForPlayer(this, toState);
        const opponent = game.getOpponentOf(this);
        const snapshot = {
            state: clientState,
            myName: this.name,
            otherName: opponent.name,
            //TODO only send ships once for each connection because this will never change (clients needs to be aware)
            myShips: this.ships,
            //TODO send only new ships
            otherShips: opponent.destroyedShips,
            //TODO send only new shots
            myShots: this.shots,
            //TODO send only new shots
            otherShots: opponent.shots,
        };

        this.socket.emit(Player.SERVER_EVENT.GAME_STATE, snapshot);
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

    get destroyedShips() {
        return this.ships.filter((ship) => {
            return ship.hits === ship.size;
        })
    }

    /**
     *
     * @param x
     * @param y
     * @returns {number} -1 if the player already shot at the same position, 0 if it doesn't hit a ship, 1 if it hit a ship
     */
    shotAt(x, y) {

        const alreadyShotAtTheSamePosition = this.shots.some((shot) => {
            return shot.position.x === x && shot.position.y === y;
        });
        if(alreadyShotAtTheSamePosition) return -1;

        const hitShip = this.ships.find(Ships.isPointOnShip.bind(null, x, y));
        this.shots.push({
            position: {
                x: x,
                y: y,
            },
            hit: !!hitShip,
        });
        if(hitShip) {
            hitShip.hits += 1;
            return 1;
        } else {
            return 0;
        }
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
