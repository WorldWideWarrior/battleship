const Highscore = require('./highscore.js');

const EventEmitter = require('events');
const Player = require('./player.js');

class Game extends EventEmitter {
    constructor(fs, player1, player2) {
        super();
        this.fs = fs;
        this.state = Game.SERVER_STATE.INIT;
        this.previousState = undefined;
        this.player1 = player1;
        this.player2 = player2;
        this.hitsInARow = 0;

        //player1.name = "Player1";
        //player2.name = "Player2";

        //player1.on(Player.EVENT.CHANGE_NAME, player2.sendOpponentName.bind(player2));
        //player2.on(Player.EVENT.CHANGE_NAME, player1.sendOpponentName.bind(player1));

        this.allPlayers.forEach((player) => {
            player.on(Player.EVENT.SHOT_AT, this.onShotAt.bind(this));
            player.on(Player.EVENT.DISCONNECT, this.onPlayerDisconnect.bind(this));
            player.on(Player.EVENT.CHEAT, this.onCheat.bind(this));
        });

        console.log(`Game created, player1: ${player1.debugDescription}, player2: ${player2.debugDescription}`);

        //start game
        this.changeState(Game.SERVER_STATE.TURN_OF_PLAYER_ONE);
    }

    destroyShipsOfPlayer(ships, player) {
        ships.forEach((ship) => {
            for(let offset = 0; offset < ship.size; offset++) {
                let x = ship.position.x;
                let y = ship.position.y;
                if(ship.orientation === "down") {
                    y += offset;

                } else if(ship.orientation === "right") {
                    x += offset;
                } else {
                    console.error(`unknown orientation ${ship.orientation} for ship ${ship.name}`);
                    break;
                }
                this.onShotAt(this.getOpponentOf(player), x, y);
            }
        })
    }

    get allPlayers() {
        return [this.player1, this.player2];
    }

    get currentPlayer() {
        switch (this.state) {
            case Game.SERVER_STATE.TURN_OF_PLAYER_ONE: return this.player1;
            case Game.SERVER_STATE.TURN_OF_PLAYER_TWO: return this.player2;
            default: return false;
        }
    }

    containsPlayer(playerId) {
        return this.allPlayers.some((player) => {
            return player.getId() === playerId;
        });
    }

    getOpponentOf(player) {
        return this.player1 === player ? this.player2 : this.player1;
    }

    onPlayerDisconnect(player) {
        const somePlayerConnected = this.allPlayers.some((player) => player.isConnected);
        if(!somePlayerConnected) {
            this.closeGame();
            return;
        }
        this.changeState(Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED);
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
            this.changeState(this.previousState);
        } else {
            reconnectedPlayer.onGameStateChange(this, this.previousState, this.state);
        }
    }

    closeGame() {
        this.allPlayers.forEach((player) => {
            player.removeAllListeners();
        });

        // save highscore
        if (this.hasWinner()) {
            let highscore = new Highscore(this.fs);
            let winner = this.getWinner();
            highscore.setHighscore(this.getWinner(), this.getPointsOfPlayerByName(winner));
        }

        this.emit(Game.EVENT.GAME_CLOSED, this);
    }

    onShotAt(player, x, y) {
        if(player !== this.currentPlayer) {
            console.debug(`${player.debugDescription} called onShotAt but is not the current player`);
            return;
        }
        const opponent = this.getOpponentOf(player);
        const shotResult = opponent.shotAt(x, y);
        if(shotResult === -1) {
            console.debug(`${player.debugDescription} shot already at the same position`);
            return;
        } else if(shotResult === 0) {
            //miss
            this.hitsInARow = 0;
            const nextState = this.state === Game.SERVER_STATE.TURN_OF_PLAYER_ONE ?
                Game.SERVER_STATE.TURN_OF_PLAYER_TWO : Game.SERVER_STATE.TURN_OF_PLAYER_ONE;
            this.changeState(nextState);
            this.broadcast(Game.SERVER_EVENT.MISS);

        } else if (shotResult === 1 || shotResult === 2) {
            //hit
            this.hitsInARow += 1;
            this.broadcast(Game.SERVER_EVENT.HIT, this.hitsInARow);
            if(shotResult === 2) {
                this.broadcast(Game.SERVER_EVENT.DESTROYED, opponent.destroyedShips.length);
            }

            if(this.hasWinner()) {
                this.changeState(Game.SERVER_STATE.GAME_OVER);
                this.closeGame();
            } else {
                this.changeState(this.state);
            }
        }
    }

    onCheat(player, code, ...args) {
        console.log("cheat", code, ...args);
        const opponent = this.getOpponentOf(player);
        switch (code) {
            case "destroy-most-ships":
                return this.destroyShipsOfPlayer(opponent.ships.slice(1), opponent);
            case "destroy-all-ships":
                return this.destroyShipsOfPlayer(opponent.ships, opponent);
            default:
                player.socket.emit("cheat-error", "unknown cheat code");
        }
    }

    /**
     * @returns name of winning player or undefined
     */
    getWinner() {
        if(this.player1.areAllShipsDestroyed())
            return this.player2.name;

        if(this.player2.areAllShipsDestroyed())
            return this.player1.name;

        return undefined;
    }

    getPointsOfPlayerByName(playerName) {
        if(this.player1.name === playerName) {
            return this.player2.shots.length;
        } else {
            return this.player1.shots.length;
        }
    }

    hasWinner() {
        return this.allPlayers.some((player) => player.areAllShipsDestroyed());
    }

    canChangeState(fromState, toState) {
        const s = new StateChecker(fromState, toState);
        return s.unidirectional(Game.SERVER_STATE.INIT, Game.SERVER_STATE.TURN_OF_PLAYER_ONE) ||

            s.bidirectional(Game.SERVER_STATE.TURN_OF_PLAYER_ONE, Game.SERVER_STATE.TURN_OF_PLAYER_TWO) ||
            s.repeat(Game.SERVER_STATE.TURN_OF_PLAYER_ONE) ||
            s.repeat(Game.SERVER_STATE.TURN_OF_PLAYER_TWO) ||

            s.bidirectional(Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED, Game.SERVER_STATE.TURN_OF_PLAYER_ONE) ||
            s.bidirectional(Game.SERVER_STATE.ONE_PLAYER_IS_DISCONNECTED, Game.SERVER_STATE.TURN_OF_PLAYER_TWO) ||

            s.unidirectional(Game.SERVER_STATE.TURN_OF_PLAYER_ONE, Game.SERVER_STATE.GAME_OVER) ||
            s.unidirectional(Game.SERVER_STATE.TURN_OF_PLAYER_TWO, Game.SERVER_STATE.GAME_OVER);
    }

    changeState(toState) {
        this._changeState(this.state, toState);
    }

    _changeState(fromState, toState) {
        if(!this.canChangeState(fromState, toState)) {
            console.log(`Can't change game state from ${fromState} state to ${toState} state`);
            return;
        }
        this.previousState = fromState;
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
    broadcast() {
        const args = Array.from(arguments);
        this.allPlayers.forEach((player) => {
            player.socket.emit.apply(player.socket, args);
        });
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
 * local events from the game instance directly (not from socket.io)
 * @type {Object.<String, String>}
 */
Game.EVENT = {
    GAME_CLOSED: "game-closed",
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
    MISS: 'miss',
    HIT: 'hit',
    DESTROYED: 'destroyed',
};

/**
 * all possible states of the game (on the server)
 * @type {{SETUP: string, TURN_OF_PLAYER_ONE: string, TURN_OF_PLAYER_TWO: string, ONE_PLAYER_IS_DISCONNECTED: string, GAME_OVER: string}}
 */
Game.SERVER_STATE = {
    INIT: 'init',
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
    DEFENCE: 'defence',
    ATTACK: 'attack',
    OTHER_PLAYER_DISCONNECTED: 'other-player-disconnected',
    GAME_OVER: 'game-over',
};

module.exports = Game;
