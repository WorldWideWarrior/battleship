const Player = require('./player.js');

class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        player1.on(Player.EVENT.CHANGE_NAME, player2.sendOpponentName.bind(player2));

        player2.on(Player.EVENT.CHANGE_NAME, player1.sendOpponentName.bind(player1));

        console.log(`Game created, player1: ${player1}, player2: ${player2}`);
    }

    containsPlayer(playerId) {
        if (this.player1.getId() === playerId) {
            return true;
        } else if (this.player2.getId() === playerId) {
            return true;
        }
        return false;
    }

    reconnect(playerId, socket) {
        if (this.player1.getId() === playerId) {
            this.player1.reconnect(socket);
        } else if (this.player2.getId() === playerId) {
            this.player2.reconnect(socket);
        }
    }
};

/**
 * events that the client emits (socket.io)
 * @type {Object.<String, String>}
 */
Game.CLIENT_EVENT = {

};
/**
 * events that the server emits (socket.io)
 * @type {Object.<String, String>}
 */
Game.SERVER_EVENT = {
  GAME_STATE: 'game-state',
};

module.exports = Game;
