import io from 'socket.io-client';
import { OwnBattlefield } from './OwnBattlefield';
import { OpponentBattlefield } from './OpponentBattlefield';
import { Sound } from './Sound';
import { RingBufferPlayer } from './RingBufferPlayer';

let clientId = localStorage.getItem("clientId");
let socket;

let actualState;
let ownName = localStorage.getItem("name");
let opponentName;
let ownBattlefield;
let opponentBattlefield;

const backgroundSound = new Sound("static/sound/background.mp3");
backgroundSound.volume = 0.2;
backgroundSound.loop = true;

const hitPlayer = new RingBufferPlayer([
    new Sound("static/sound/hit1.mp3"),
    new Sound("static/sound/hit2.mp3", false),
    new Sound("static/sound/hit3.mp3", false),
]);
const missPlayer = new RingBufferPlayer([
    new Sound("static/sound/miss1.mp3"),
]);
const destroyPlayer = new RingBufferPlayer([
    new Sound("static/sound/destroy1.mp3"),
    new Sound("static/sound/destroy2.mp3", false),
    new Sound("static/sound/destroy3.mp3", false),
    new Sound("static/sound/destroy4.mp3", false),
    new Sound("static/sound/destroy5.mp3", false),
    new Sound("static/sound/destroy6.mp3", false),
    new Sound("static/sound/destroy7.mp3", false),
    new Sound("static/sound/destroy8.mp3", false),
    new Sound("static/sound/destroy9.mp3", false),
    new Sound("static/sound/destroy10.mp3", false),
]);

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
    $('#disconnect-modal').modal('hide');
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
}

function sendOwnName() {
    socket.emit('set-name', ownName);
}

function setOpponentName(name) {
    opponentName = name;
    $('#player2Name').text(`Opponent: ${name}`);
}

function restart() {
    socket.emit('new-game', clientId);
}

function parseShips(snapshot) {
    console.log(snapshot.myShips);
    if (snapshot.myShips) {
        ownBattlefield.ships = snapshot.myShips;
    }
    console.log(snapshot.otherShips);
    if (snapshot.otherShips) {
        opponentBattlefield.ships = snapshot.otherShips;
    }
}

function parseShots(snapshot) {
    if (snapshot.myShots) {
        ownBattlefield.shots = snapshot.myShots;
    }
    if (snapshot.otherShots) {
        opponentBattlefield.shots = snapshot.otherShots;
    }
}

function parseShipsAndShots(snapshot) {
    parseShips(snapshot);
    parseShots(snapshot);
    if(snapshot.myShips || snapshot.myShots) {
        ownBattlefield.updateField();
    }
    if(snapshot.otherShips || snapshot.otherShots) {
        opponentBattlefield.updateField();
    }
}


function parseNames(snapshot) {
    if(snapshot.myName)
        setOwnName(snapshot.myName);

    if(snapshot.otherName)
        setOpponentName(snapshot.otherName);
}

function onGameState(snapshot) {
    actualState = snapshot.state;
    if (snapshot.state === 'waiting-for-other-player') {
        ownBattlefield.reset();
        opponentBattlefield.reset();
        showWaitingModal();
    } else if (snapshot.state === 'setup') {
        closeWaitingModal();
        showPlayerInput();
    } else if (snapshot.state === 'attack') {
        parseShipsAndShots(snapshot);
        parseNames(snapshot);
        opponentBattlefield.activate();
    } else if (snapshot.state === 'defence') {
        parseShipsAndShots(snapshot);
        parseNames(snapshot);
        opponentBattlefield.deactivate();
    } else if (snapshot.state === 'other-player-disconnected') {
        showDisconnectModal();
    } else if (snapshot.state === 'game-over') {
        parseShipsAndShots(snapshot);
        parseNames(snapshot);
        showGameOverModal(snapshot.winner);
    }

    if(snapshot.state !== 'waiting-for-other-player') {
        closeWaitingModal()
    }
    if(snapshot.state !== 'game-over') {
        closeGameOverModal();
    }
    if(snapshot.state !== 'other-player-disconnected') {
        closeDisconnectModal();
    }
}

$(document).ready(() => {

    socket = io(location.hostname +':3000');

    // create tables
    const fieldOwn = $('#field-own');
    ownBattlefield = new OwnBattlefield(fieldOwn);
    const fieldOpponent = $('#field-opponent');
    opponentBattlefield = new OpponentBattlefield(fieldOpponent, socket);

    if(!ownName)
        showPlayerInput();

    socket.on('connect', () => {
        backgroundSound.playFromStart();
        socket.emit('client-id', clientId);
        if(ownName) {
            sendOwnName();
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

    socket.on("miss", () => {
        missPlayer.playNext();
    });

    socket.on("hit", (hitsInARow) => {
        hitPlayer.playAtIndex(hitsInARow - 1);
    });

    socket.on("destroyed", (shipsDestroyed) => {
        destroyPlayer.playAtIndex(shipsDestroyed - 1);
    })
});

// validate player name
$('#buttonReadyPlayerModal').click(() => {
    const playerName = $('#playerNameInput').val();

    if (playerName) {
        setOwnName(playerName);
        sendOwnName();
        $('#player-modal').modal('hide');
    }
});

//restart after gameOver
$('#buttonRestart').click(() => {
    restart();
});
