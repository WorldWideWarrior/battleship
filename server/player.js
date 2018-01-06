const EventEmitter = require('events');

module.exports = class Player extends EventEmitter {
    constructor(socket, id) {
        super();
        this.socket = socket;
        this.id = id;

        socket.on('set-name', this.onNameSet.bind(this));

        console.log(`Created user: ${id}, socket: ${socket}`);
    }

    sendOpponentName(clientid, name) {
        this.socket.emit('set-name', clientid, name);
    }

    onNameSet(name) {
        this.name = name;
        this.emit('set-name', name);
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
