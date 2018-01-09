import io from 'socket.io-client';
import { OwnBattlefield } from './OwnBattlefield';
import { OpponentBattlefield } from './OpponentBattlefield';

let clientId = localStorage.getItem("clientId");
let socket;

let actualState;
let ownName = localStorage.getItem("name");
let opponentName;
let ownBattlefield;
let opponentBattlefield;
let myShips;
let otherShips;
let myShots;
let otherShots;

function showPlayerInput() {
    $('#player-modal').modal({
        backdrop: 'static',
        keyboard: false,
    });
}

function showDisconnectModal() {
    $('#disconnect-modal').modal({
        backdrop: 'static',
        keyboard: false,
    });
}

function showGameOverModal(winner) {
    $('#gameOver-modal').modal({
        backdrop: 'static',
        keyboard: false,
    });

    $('#playerWinner').html(winner);
}

function showWaitingModal() {
    $('#waiting-modal').modal({
        backdrop: 'static',
        keyboard: false,
    })
}

function closeGameOverModal() {
    $('#gameOver-modal').modal('hide');
}

function closeDisconnectModal() {
    $('#player-modal').modal('hide');
}

function closeWaitingModal() {
    $('#waiting-modal').modal('hide');
}

function addShip(name, posX, posY, orientation) {
    myShips.push({
        name,
        position: {
            x: posX,
            y: posY,
        },
        orientation,
    });
}

function addShot(posx, posy, hit) {
    shots.push({
        position: {
            x: posx,
            y: posy,
        },
        hit,
    });
}

function setOwnName(name) {
    ownName = name;
    localStorage.setItem("name", name);
    $('#player1Name').text(`You: ${name}`);
    socket.emit('set-name', ownName);
}

function setOpponentName(name) {
    opponentName = name;
    $('#player2Name').text(`Opponent: ${name}`);
}

function parseShips(snapshot) {
    console.log(snapshot.myShips);
    if (snapshot.myShips) {
        ownBattlefield.ships = snapshot.myShips;
        ownBattlefield.updateField();
    }
    console.log(snapshot.otherShips);
    if (snapshot.otherShips) {
        opponentBattlefield.ships = snapshot.otherShips;
        opponentBattlefield.updateField();
    }
}

function parseShots(snapshot) {
    if (snapshot.myShots) { myShots = snapshot.myShots; }
    if (snapshot.otherShots) { otherShots = snapshot.otherShots; }
}

function parseNames(snapshot) {
    setOwnName(snapshot.myName);
    setOpponentName(snapshot.otherName);
}

function onGameState(snapshot) {
    actualState = snapshot.state;
    if (snapshot.state === 'waiting-for-second-player') {
        showWaitingModal();
    } else if (snapshot.state === 'setup') {
        closeWaitingModal();
        showPlayerInput();
    } else if (snapshot.state === 'attack') {
        parseShips(snapshot);
        parseShots(snapshot);
        parseNames(snapshot);
    } else if (snapshot.state === 'defence') {
        parseShips(snapshot);
        parseShots(snapshot);
        parseNames(snapshot);
    } else if (snapshot.state === 'other-player-disconnect') {
        showDisconnectModal();
    } else if (snapshot.state === 'game-over') {
        parseShips(snapshot);
        parseShots(snapshot);
        parseNames(snapshot);
        showGameOverModal(snapshot.winner);
    }
}

$(document).ready(() => {
    myShips = [];
    otherShips = [];
    myShots = [];
    otherShots = [];

    // create tables
    const fieldOwn = $('#field-own');
    ownBattlefield = new OwnBattlefield(fieldOwn);
    const fieldOpponent = $('#field-opponent');
    opponentBattlefield = new OpponentBattlefield(fieldOpponent);

    socket = io('localhost:3000');

    socket.on('connect', () => {
        socket.emit('client-id', clientId);
        if(ownName) {
            setOwnName(ownName);
        }
    });

    socket.on('client-id', (id) => {
        clientId = id;
        localStorage.setItem("clientId", id);
    });

    socket.on('set-name', (name) => {
        setOpponentName(name);
    });

    socket.on('game-state', (snapshot) => {
        onGameState(snapshot);
    });
});

// validate player name
$('#buttonReadyPlayerModal').click(() => {
    const playerName = $('#playerNameInput').val();

    if (playerName) {
        setOwnName(playerName);
        $('#player-modal').modal('hide');
    }
});
