module.exports = class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        player1.on('set-name', player2.sendOpponentName.bind(player2));

        player2.on('set-name', player1.sendOpponentName.bind(player1));

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
