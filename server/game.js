const Player = require('./player.js');

class Game {
    constructor(player1, player2) {
        this.state = Game.SERVER_STATE.SETUP;
        this.previoisState = undefined;
        this.player1 = player1;
        this.player2 = player2;

        player1.on(Player.EVENT.CHANGE_NAME, player2.sendOpponentName.bind(player2));
        player2.on(Player.EVENT.CHANGE_NAME, player1.sendOpponentName.bind(player1));

        player1.on(Player.EVENT.SETUP_FINISHED, this.onPlayerSetupFinished.bind(this, player1));
        player2.on(Player.EVENT.SETUP_FINISHED, this.onPlayerSetupFinished.bind(this, player2));

        console.log(`Game created, player1: ${player1}, player2: ${player2}`);
    }

    get allPlayers() {
        return [this.player1, this.player2];
    }

    containsPlayer(playerId) {
        return this.allPlayers.some((player) => {
            return player.getId() === playerId;
        });
    }

    reconnect(playerId, socket) {
        let reconnectedPlayer = this.allPlayers.find((player) => {
            return player.getId() === playerId;
        });
        if(!reconnectedPlayer) {
            console.error(`could not reconnect socket with client id ${playerId} because no player with the same id does exists`);
            return;
        }
        reconnectedPlayer.reconnect(socket);
        if(this.state === Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED) {
            this.changeState(this.previoisState);
        } else {
            reconnectedPlayer.onGameStateChange(this, this.previoisState, this.state);
        }
    }

    onPlayerSetupFinished(player) {
        if(this.state === Game.SERVER_STATE.SETUP_BOTH_PLAYERS) {
            this.changeState(Game.SERVER_STATE.SETUP_ONE_PLAYER);
        } else if (this.state === Game.SERVER_STATE.SETUP_ONE_PLAYER) {
            this.changeState(Game.SERVER_STATE.TURN_OF_PLAYER_ONE);
        } else {
            console.debug(`onPlayerSetupFinished called for ${player.debugDescription} but state is ${this.state}`);
        }
    }

    canChangeState(fromState, toState) {
        const s = new StateChecker(fromState, toState);
        return s.bidirectional(Game.SERVER_STATE.SETUP_BOTH_PLAYERS, Game.SERVER_STATE.SETUP_ONE_PLAYER) ||
            s.bidirectional(Game.SERVER_STATE.SETUP_ONE_PLAYER, Game.SERVER_STATE.TURN_OF_PLAYER_ONE) ||
            s.bidirectional(Game.SERVER_STATE.TURN_OF_PLAYER_ONE, Game.SERVER_STATE.TURN_OF_PLAYER_TWO) ||

            s.repeat(Game.SERVER_STATE.TURN_OF_PLAYER_ONE) ||
            s.repeat(Game.SERVER_STATE.TURN_OF_PLAYER_TWO) ||

            s.bidirectional(Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED, Game.SERVER_STATE.SETUP) ||
            s.bidirectional(Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED, Game.SERVER_STATE.TURN_OF_PLAYER_ONE) ||
            s.bidirectional(Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED, Game.SERVER_STATE.TURN_OF_PLAYER_TWO) ||

            s.unidirectional(Game.SERVER_STATE.TURN_OF_PLAYER_ONE, Game.SERVER_STATE.GAME_OVER) ||
            s.unidirectional(Game.SERVER_STATE.TURN_OF_PLAYER_TWO, Game.SERVER_STATE.GAME_OVER);
    }

    changeState(toState) {
        this._changeState(state, toState);
    }

    _changeState(fromState, toState) {
        if(!this.canChangeState(fromState, toState)) {
            console.debug(`Can't change game state from ${fromState} state to ${toState} state`);
            return;
        }
        this.previoisState = fromState;
        this.state = toState;

        this.allPlayers.forEach((player) => {
            player.onGameStateChange(this, fromState, toState);
        });
    }

    clientStateForPlayer(player, serverState = this.state) {
        switch (serverState) {
            case Game.SERVER_STATE.SETUP_BOTH_PLAYERS:
            case Game.SERVER_STATE.SETUP_ONE_PLAYER:
                return Game.CLIENT_STATE.SETUP;
            case Game.SERVER_STATE.TURN_OF_PLAYER_ONE:
                return player === this.player1 ? Game.CLIENT_STATE.ATTACK : Game.CLIENT_STATE.DEFENCE;
            case Game.SERVER_STATE.TURN_OF_PLAYER_TWO:
                return player === this.player2 ? Game.CLIENT_STATE.ATTACK : Game.CLIENT_STATE.DEFENCE;
            case Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED:
                return Game.CLIENT_STATE.OTHER_PLAYER_DISCONNECTED;
            case Game.SERVER_STATE.GAME_OVER:
                return Game.CLIENT_STATE.GAME_OVER;

        }
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
Game.SERVER_STATE = {
    SETUP_BOTH_PLAYERS: 'setup-both',
    SETUP_ONE_PLAYER: 'setup-one-player',
    TURN_OF_PLAYER_ONE: 'turn-of-player-one',
    TURN_OF_PLAYER_TWO: 'turn-of-player-two',
    ONE_PLAYER_IS_DISCONNECTED: 'one-player-is-disconnected',
    GAME_OVER: 'game-over',
};

/**
 * all possible states of the game (on the client)
 * @type {{SETUP: string, TURN_OF_PLAYER_ONE: string, TURN_OF_PLAYER_TWO: string, ONE_PLAYER_IS_DISCONNECTED: string, GAME_OVER: string}}
 */
Game.CLIENT_STATE = {
    WAITING_FOR_OTHER_PLAYER: 'waiting-for-other-player',
    SETUP: 'setup',
    DEFENCE: 'defence',
    ATTACK: 'attack',
    OTHER_PLAYER_DISCONNECTED: 'other-player-disconnected',
    GAME_OVER: 'game-over',
};

module.exports = Game;
