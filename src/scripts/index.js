import io from 'socket.io-client';

let clientId;
let socket;

let actualState;
let ownName;
let opponentName;
let ships;

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
    // show modal on startup
    $('#player-modal').modal({
        backdrop: 'static',
        keyboard: false,
    });
}

function sendPlayerName() {
    socket.emit('set-name', ownName);
}

function onGameState(snapshot) {
    actualState = snapshot.state;
    if (snapshot.state === 'waitingForSecondPlayer') {

    } else if (snapshot.state === 'setup') {
        showPlayerInput();
    } else if (snapshot.state === 'attack') {

    } else if (snapshot.state === 'defence') {

    } else if (snapshot.state === 'otherPlayerDisconnect') {

    } else if (snapshot.state === 'gameOver') {

    }
}

$(document).ready(() => {
    // create tables
    const fieldOwn = $('#field-own');
    generateTable(fieldOwn, 10, 10);
    const fieldOpponent = $('#field-opponent');
    generateTable(fieldOpponent, 10, 10);

    socket = io('localhost:3000');

    socket.on('connect', () => {
        socket.emit('client-id', clientId);
    });

    socket.on('client-id', (id) => {
        clientId = id;
    });

    socket.on('set-name', (name) => {
        opponentName = name;
        $('#player2Name').text(`Opponent: ${name}`);
    });

    socket.on('game-state', (snapshot) => {
        onGameState(snapshot);
    });
});

// validate player name
$('#buttonReadyPlayerModal').click(() => {
    const playerName = $('#playerNameInput').val();

    if (playerName) {
        $('#player1Name').text(`You: ${playerName}`);
        $('#player-modal').modal('hide');
        ownName = playerName;
        sendPlayerName();
    }
});
