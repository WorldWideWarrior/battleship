const Player = require('./player.js');

class Game {
    constructor(player1, player2) {
        this.state = Game.STATE.SETUP;
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

    canChangeState(fromState, toState) {
        const s = new StateChecker(fromState, toState);
        return s.bidirectional(Game.STATE.SETUP_BOTH_PLAYERS, Game.STATE.SETUP_ONE_PLAYER) ||
            s.bidirectional(Game.STATE.SETUP_ONE_PLAYER, Game.STATE.TURN_OF_PLAYER_ONE) ||
            s.bidirectional(Game.STATE.TURN_OF_PLAYER_ONE, Game.STATE.TURN_OF_PLAYER_TWO) ||

            s.repeat(Game.STATE.TURN_OF_PLAYER_ONE) ||
            s.repeat(Game.STATE.TURN_OF_PLAYER_TWO) ||

            s.bidirectional(Game.STATE.ONE_PLAYER_IS_DISCONNECTED, Game.STATE.SETUP) ||
            s.bidirectional(Game.STATE.ONE_PLAYER_IS_DISCONNECTED, Game.STATE.TURN_OF_PLAYER_ONE) ||
            s.bidirectional(Game.STATE.ONE_PLAYER_IS_DISCONNECTED, Game.STATE.TURN_OF_PLAYER_TWO) ||

            s.unidirectional(Game.STATE.TURN_OF_PLAYER_ONE, Game.STATE.GAME_OVER) ||
            s.unidirectional(Game.STATE.TURN_OF_PLAYER_TWO, Game.STATE.GAME_OVER);
    }

    changeState(toState) {
        this._changeState(state, toState);
    }

    _changeState(fromState, toState) {
        if(!this.canChangeState(fromState, toState)) {
            console.debug(`Can't change game state from ${fromState} state to ${toState} state`);
            return;
        }
        this.state = toState;
    }
}

class StateChecker {
    constructor(fromState, toState) {
        this.fromState = fromState;
        this.toState = toState;
    }
    unidirectional(from, to) {
        return this.fromState === from && this.toState === to;
    }
    bidirectional(state1, state2) {
        return (this.fromState === state1  && this.toState === state2) ||
                (this.fromState === state2  && this.toState === state1);
    }
    repeat(state) {
        return this.fromState === state && this.toState === state;
    }
}

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

/**
 * all possible states of the game (on the server)
 * @type {{SETUP: string, TURN_OF_PLAYER_ONE: string, TURN_OF_PLAYER_TWO: string, ONE_PLAYER_IS_DISCONNECTED: string, GAME_OVER: string}}
 */
Game.STATE = {
    SETUP_BOTH_PLAYERS: 'setup-both',
    SETUP_ONE_PLAYER: 'setup-one-player',
    TURN_OF_PLAYER_ONE: 'turn-of-player-one',
    TURN_OF_PLAYER_TWO: 'turn-of-player-two',
    ONE_PLAYER_IS_DISCONNECTED: 'one-player-is-disconnected',
    GAME_OVER: 'game-over',
};

module.exports = Game;
