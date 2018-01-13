import io from 'socket.io-client';
import { OwnBattlefield } from './OwnBattlefield';
import { OpponentBattlefield } from './OpponentBattlefield';
import { Sound } from './Sound';
import { RingBufferPlayer } from './RingBufferPlayer';
import {Highscore} from "./highscore";

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

function showHighscoresModal() {
    $('#highscores-modal').modal({
        backdrop: 'static',
    });

    let highscore = new Highscore('http://' + location.hostname + ':3000/api/highscore');
    return highscore.getHighscores(function (highscore) {
        let table = $('#highscores');
        table.html('');
        table.append($('<tr><th>Name</th><th>Shots</th></tr>'));
        for(let i = 0; i < highscore.length; i++) {
            table.append($('<tr><td>' + highscore[i].name + '</td><td>' + highscore[i].points + '</td></tr>'))
        }
    });
}

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

function closeHighscores() {
    $('#highscores-modal').modal('hide');
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
    if (snapshot.myShips) {
        //TODO: needs a better diffing strategy
        //ownBattlefield.ships = ownBattlefield.ships.concat(snapshot.myShips);
        ownBattlefield.ships = snapshot.myShips;
    }
    if (snapshot.otherShips) {
        opponentBattlefield.ships = opponentBattlefield.ships.concat(snapshot.otherShips);
    }
}

function parseShots(snapshot) {
    if (snapshot.myShots) {
        ownBattlefield.shots = ownBattlefield.shots.concat(snapshot.myShots);
    }
    if (snapshot.otherShots) {
        opponentBattlefield.shots = opponentBattlefield.shots.concat(snapshot.otherShots);
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
    if(snapshot.firstSnapshot) {
        ownBattlefield.ships = [];
        ownBattlefield.shots = [];
        opponentBattlefield.ships = [];
        opponentBattlefield.shots = [];
    }
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
        ownBattlefield.deactivate();
        opponentBattlefield.activate();
    } else if (snapshot.state === 'defence') {
        parseShipsAndShots(snapshot);
        parseNames(snapshot);
        ownBattlefield.activate();
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
    });

    socket.on("cheat-error", console.log.bind(console));
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

$('#buttonShowHighscore').click(() => {
    showHighscoresModal();
});

$('#buttonShowHighscoreGameOver').click(() => {
    showHighscoresModal();
});

//restart after gameOver
$('#buttonRestart').click(() => {
    restart();
});

$('#buttonCloseHighscore').click(() =>  {
    closeHighscores();
});

//############# CHEATS #################
function cheat(code, ...args) {
    socket.emit("cheat", code, ...args);
}

window.cheat = cheat;
//######################################
