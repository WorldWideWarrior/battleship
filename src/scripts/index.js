import io from 'socket.io-client';
import { OwnBattlefield } from './own_battlefield';
import { OpponentBattlefield } from './opponent_battlefield';
import { Sound } from './sound';
import { RingBufferPlayer } from './ring_buffer_player';
import { Highscore } from './highscore';

let clientId = localStorage.getItem('clientId');
let socket;

let ownName = localStorage.getItem('name');
let ownBattlefield;
let opponentBattlefield;

const backgroundSound = new Sound('static/sound/background.mp3');
backgroundSound.volume = 0.2;
backgroundSound.loop = true;

const hitPlayer = new RingBufferPlayer([
    new Sound('static/sound/hit1.mp3'),
    new Sound('static/sound/hit2.mp3', false),
    new Sound('static/sound/hit3.mp3', false),
]);
const missPlayer = new RingBufferPlayer([
    new Sound('static/sound/miss1.mp3'),
]);
const destroyPlayer = new RingBufferPlayer([
    new Sound('static/sound/destroy1.mp3'),
    new Sound('static/sound/destroy2.mp3', false),
    new Sound('static/sound/destroy3.mp3', false),
    new Sound('static/sound/destroy4.mp3', false),
    new Sound('static/sound/destroy5.mp3', false),
    new Sound('static/sound/destroy6.mp3', false),
    new Sound('static/sound/destroy7.mp3', false),
    new Sound('static/sound/destroy8.mp3', false),
    new Sound('static/sound/destroy9.mp3', false),
    new Sound('static/sound/destroy10.mp3', false),
]);

function showHighscoresModal() {
    $('#highscores-modal').modal({
        backdrop: 'static',
    });

    const highscore = new Highscore(`http://${location.hostname}:3000/api/highscore`);
    return highscore.getHighscores((error, highscores) => {
        const table = $('#highscores');
        table.html('');

        if (error) {
            $('#errorHighscore').html(error);
            return;
        }
        // clear old error
        $('#errorHighscore').html('');


        table.append($('<tr><th>Name</th><th>Shots</th></tr>'));
        for (let i = 0; i < highscores.length; i++) {
            table.append($(`<tr><td>${highscores[i].name}</td><td>${highscores[i].points}</td></tr>`));
        }
    });
}

function showPlayerInput() {
    $('#player-modal').modal("show", {
        backdrop: 'static',
        keyboard: false,
    });
}

function showDisconnectModal() {
    $('#disconnect-modal').modal("show",{
        backdrop: 'static',
        keyboard: false,
    });
}

function showGameOverModal(winner) {
    $('#gameOver-modal').modal("show",{
        backdrop: 'static',
        keyboard: false,
    });

    $('#playerWinner').html(winner);
}

function showWaitingModal() {
    $('#waiting-modal').modal("show",{
        backdrop: 'static',
        keyboard: false,
    });
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

function setOwnName(name) {
    ownName = name;
    localStorage.setItem('name', name);
    $('#player1Name').text(`You: ${name}`);
}

function sendOwnName() {
    socket.emit('set-name', ownName);
}

function setOpponentName(name) {
    $('#player2Name').text(`Opponent: ${name}`);
}

function restart() {
    socket.emit('new-game', clientId);
}

function parseShips(snapshot) {
    if (snapshot.myShips) {
        // TODO: needs a better diffing strategy
        // ownBattlefield.ships = ownBattlefield.ships.concat(snapshot.myShips);
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
    if (snapshot.myShips || snapshot.myShots) {
        ownBattlefield.updateField();
    }
    if (snapshot.otherShips || snapshot.otherShots) {
        opponentBattlefield.updateField();
    }
}


function parseNames(snapshot) {
    if (snapshot.myName) { setOwnName(snapshot.myName); }

    if (snapshot.otherName) { setOpponentName(snapshot.otherName); }
}

function onGameState(snapshot) {
    // actualState = snapshot.state;
    if (snapshot.firstSnapshot) {
        ownBattlefield.ships = [];
        ownBattlefield.shots = [];
        opponentBattlefield.ships = [];
        opponentBattlefield.shots = [];
        sendOwnName();
    }

    parseNames(snapshot);

    if (snapshot.state === 'waiting-for-other-player') {
        ownBattlefield.reset();
        opponentBattlefield.reset();
        showWaitingModal();
    } else if (snapshot.state === 'setup') {
        showPlayerInput();
    } else if (snapshot.state === 'attack') {
        parseShipsAndShots(snapshot);
        ownBattlefield.deactivate();
        opponentBattlefield.activate();
    } else if (snapshot.state === 'defence') {
        parseShipsAndShots(snapshot);
        ownBattlefield.activate();
        opponentBattlefield.deactivate();
    } else if (snapshot.state === 'other-player-disconnected') {
        showDisconnectModal();
    } else if (snapshot.state === 'game-over') {
        parseShipsAndShots(snapshot);
        showGameOverModal(snapshot.winner);
    }

    if (snapshot.state !== 'waiting-for-other-player') {
        closeWaitingModal();
    }
    if (snapshot.state !== 'game-over') {
        closeGameOverModal();
    }
    if (snapshot.state !== 'other-player-disconnected') {
        closeDisconnectModal();
    }
}

function initConnectionAndField() {
    if (socket) { return; }

    socket = io(`${location.hostname}:3000`);

    socket.on('connect', () => {
        backgroundSound.playFromStart();
        socket.emit('client-id', clientId);
    });

    socket.on('client-id', (id) => {
        clientId = id;
        localStorage.setItem('clientId', id);
    });

    socket.on('game-state', onGameState);

    socket.on('miss', () => {
        missPlayer.playNext();
    });

    socket.on('hit', (hitsInARow) => {
        hitPlayer.playAtIndex(hitsInARow - 1);
    });

    socket.on('destroyed', (shipsDestroyed) => {
        destroyPlayer.playAtIndex(shipsDestroyed - 1);
    });

    socket.on('cheat-error', console.log.bind(console));

    // create tables
    const fieldOwn = $('#field-own');
    ownBattlefield = new OwnBattlefield(fieldOwn);
    const fieldOpponent = $('#field-opponent');
    opponentBattlefield = new OpponentBattlefield(fieldOpponent, socket);
}

$(document).ready(() => {
    if (!ownName) {
        showPlayerInput();
    } else {
        initConnectionAndField();
        setOwnName(ownName);
        sendOwnName();
    }

    setTimeout(() => {
        $('body').removeClass('no-water-animations');
    }, 100);
});

// validate player name
$('#buttonReadyPlayerModal').click(() => {
    const playerName = $('#playerNameInput').val();

    if (playerName) {
        initConnectionAndField();
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

// restart after gameOver
$('#buttonRestart').click(() => {
    restart();
});

$('#buttonCloseHighscore').click(() => {
    closeHighscores();
});

// animations
$('#buttonEnableAnimations, #buttonDisableAnimations').click(() => {
    $('body').toggleClass('no-water-animations');
});

// ############# CHEATS #################
function cheat(code, ...args) {
    socket.emit('cheat', code, ...args);
}

window.cheat = cheat;
// ######################################
