const EventEmitter = require('events');

class Player extends EventEmitter {
    constructor(socket, id) {
        super();
        this.socket = socket;
        this.id = id;
        this.ships = undefined;

        socket.on(Player.CLIENT_EVENT.SET_NAME, this.onNameSet.bind(this));
        socket.on(Player.CLIENT_EVENT.SET_SHIPS, this.onShipsSet.bind(this));

        console.log(`Created user: ${id}, socket: ${socket}`);
    }

    sendOpponentName(opponent, name) {
        this.socket.emit('set-name', opponent.id, name);
    }

    onNameSet(name) {
        this.name = name;
        this.emit(Player.EVENT.CHANGE_NAME, this, name);
    }
    onShipsSet(ships) {
        //check if the user already set its ships
        if(this.ships) return;

        this.emit(Player.EVENT.SETUP_FINISHED);
    }

    setName(name) {
        this.name = name;
    }

    getId() {
        return this.id;
    }

    reconnect(socket) {
        this.socket = socket;
        console.log(`reconnected user: ${this.id}`);
    }

    get debugDescription() {
        return `Player(name = ${this.name}, id = ${thisid})`
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
    SET_SHIPS: 'set-ships',
};
/**
 * events that the server emits (socket.io)
 * @type {Object.<String, String>}
 */
Player.SERVER_EVENT = {
    SET_NAME: 'set-name',
};

module.exports = Player;
