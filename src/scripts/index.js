import io from 'socket.io-client';

let clientId = localStorage.getItem("clientId");
let socket;

let actualState;
let ownName = localStorage.getItem("name");
let opponentName;
let myShips;
let otherShips;
let myShots;
let otherShots;

function generateTable(table, rows, columns) {
    for (let row = 0; row < rows; row++) {
        const rowElement = $('<tr></tr>');
        for (let column = 0; column < columns; column++) {
            const columnElement = $('<td/>');

            (function (clickRow, clickColumn) {
                columnElement.on('click', () => {
                    console.log(`Click: ${clickRow}, ${clickColumn}`);
                });
            }(row, column));

            rowElement.append(columnElement);
        }
        table.append(rowElement);
    }
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
    socket.emit('set-name', ownName);
}

function parseShips(snapshot) {
    if (snapshot.myShips) { myShips = snapshot.myShips; }

    if (snapshot.otherShips) { otherShips = snapshot.otherShips; }
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
    generateTable(fieldOwn, 10, 10);
    const fieldOpponent = $('#field-opponent');
    generateTable(fieldOpponent, 10, 10);

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
