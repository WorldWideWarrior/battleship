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

        //this.lastClientSnapshotInfo;
        /**
         * @type {[{position: {x: number, y: number}, hit: boolean}]}
         */
        this.shots = [];

        this.bindedOnNameSet = this.onNameSet.bind(this);
        this.bindedOnShotAt = this.onShotAt.bind(this);
        this.bindedOnDisconnected = this.onDisconnect.bind(this);
        this.bindedOnCheat = this.onCheat.bind(this);

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
        socket.removeListener(Player.CLIENT_EVENT.DISCONNECT, this.bindedOnDisconnected);
        socket.removeListener(Player.CLIENT_EVENT.CHEAT, this.bindedOnCheat);
    }

    addListenerToSocket(socket) {
        socket.on(Player.CLIENT_EVENT.SET_NAME, this.bindedOnNameSet);
        socket.on(Player.CLIENT_EVENT.SHOT_AT, this.bindedOnShotAt);
        socket.on(Player.CLIENT_EVENT.DISCONNECT, this.bindedOnDisconnected);
        socket.on(Player.CLIENT_EVENT.CHEAT, this.bindedOnCheat);
    }

    onGameStateChange(game, fromState, toState) {
        const snapshot = this.createSnapshot(game, fromState, toState);

        this.socket.emit(Player.SERVER_EVENT.GAME_STATE, snapshot);
    }

    createSnapshot(game, fromState, toState) {
        const clientState = game.clientStateForPlayer(this, toState);
        const opponent = game.getOpponentOf(this);

        const firstSnapshot = !this.lastClientSnapshotInfo;
        const info = this.lastClientSnapshotInfo || {};

        const snapshot = {
            firstSnapshot: firstSnapshot || undefined,
            state: clientState,
            myName: this.name === info.myName ? undefined : this.name,
            otherName: opponent.name === info.otherName ? undefined : opponent.name,
            //TODO: needs a better diffing strategy, the hits count of a ship can change and the client needs to know that
            myShips: this.ships,
            otherShips: this.getNewlyCreatedElementsByIdentity(opponent.destroyedShips, info.otherShips),
            myShots: this.getNewlyCreatedElementsByLength(this.shots, info.myShotsLength),
            otherShots: this.getNewlyCreatedElementsByLength(opponent.shots, info.otherShotsLength),
            winner: game.getWinner(),
        };

        this.lastClientSnapshotInfo = {
            myName: this.name,
            otherName: opponent.name,
            //myShipsLength: this.ships.length,
            otherShips: opponent.destroyedShips,
            myShotsLength: this.shots.length,
            otherShotsLength: opponent.shots.length,
        };

        return snapshot;
    }

    getNewlyCreatedElementsByLength(allElements, lastKnownLength) {
        lastKnownLength = lastKnownLength || 0;
        if(allElements.length === lastKnownLength) {
            return undefined;
        } else {
            return allElements.slice(lastKnownLength);
        }
    }
    getNewlyCreatedElementsByIdentity(allElements, lastKnowElements) {
        lastKnowElements = lastKnowElements || [];
        //iterate over every element and only collect it if it is *not* in lastKnowElements
        return allElements.filter((element1) => {
            return !lastKnowElements.some((element2) => {
                return element1 === element2;
            });
        });
    }

    onDisconnect() {
        this.isConnected = false;
        console.log(`disconnected ${this.debugDescription}`);
        this.emit(Player.EVENT.DISCONNECT, this);
    }

    onNameSet(name) {
        this.name = name;
        console.log(`name set ${this.debugDescription}`);
        this.emit(Player.EVENT.CHANGE_NAME);
    }

    onShotAt(x, y) {
        this.emit(Player.EVENT.SHOT_AT, this, x, y);
    }

    onCheat(code, ...args) {
        this.emit(Player.EVENT.CHEAT, this, code, ...args);
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
     * @returns {number} -1 if the player already shot at the same position,
     * 0 if it doesn't hit a ship, 1 if it hit a ship, 2 if it hit a ship and destroyed it
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
            const shipDestroyed = hitShip.hits === hitShip.size;
            return shipDestroyed ? 2 : 1;
        } else {
            return 0;
        }
    }

    areAllShipsDestroyed() {
        return this.ships.every((ship) => ship.hits === ship.size);
    }

    reconnect(socket) {
        this.isConnected = true;
        this.lastClientSnapshotInfo = undefined;
        this.removeListenerFromSocket(this.socket);
        this.socket = socket;
        this.addListenerToSocket(socket);
        console.log(`reconnected ${this.debugDescription}`);
        this.emit(Player.EVENT.CONNECT, this);
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
    DISCONNECT: 'disconnect',
    CONNECT: 'connect',
    CHEAT: 'cheat',
};
/**
 * events that the client emits (socket.io)
 * @type {Object.<String, String>}
 */
Player.CLIENT_EVENT = {
    SET_NAME: 'set-name',
    SHOT_AT: 'shot-at',
    DISCONNECT: 'disconnect',
    CHEAT: 'cheat',
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
