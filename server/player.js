const EventEmitter = require('events');

module.exports = class Player extends EventEmitter {
    constructor(socket, id) {
        super();
        this.socket = socket;
        this.id = id;

        socket.on(Player.CLIENT_EVENT.SET_NAME, this.onNameSet.bind(this));

        console.log(`Created user: ${id}, socket: ${socket}`);
    }

    sendOpponentName(opponent, name) {
        this.socket.emit('set-name', opponent.id, name);
    }

    onNameSet(name) {
        this.name = name;
        this.emit(Player.EVENT.CHANGE_NAME, this, name);
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
};
/**
 * local events from the player instance directly (not from socket.io)
 * @type {Object.<String, String>}
 */
Player.EVENT = {
    CHANGE_NAME: 'change-name',
};
/**
 * events that the client emits (socket.io)
 * @type {Object.<String, String>}
 */
Player.CLIENT_EVENT = {
    SET_NAME: 'set-name',
};
/**
 * events that the server emits (socket.io)
 * @type {Object.<String, String>}
 */
Player.SERVER_EVENT = {
    SET_NAME: 'set-name',
};
