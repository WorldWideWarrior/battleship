import io from 'socket.io-client';

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

$(document).ready(() => {
    // show modal on startup
    $('#player-modal').modal({
        backdrop: 'static',
        keyboard: false,
    });

    // create tables
    const fieldOwn = $('#field-own');
    generateTable(fieldOwn, 10, 10);
    const fieldOpponent = $('#field-opponent');
    generateTable(fieldOpponent, 10, 10);

    const socket = io('localhost:3000');
});

// validate player names
$('#buttonReadyPlayerModal').click(() => {
    const player1 = $('#player1Input').val();
    const player2 = $('#player2Input').val();

    if (player1 !== '' && player2 !== '' && player1 !== player2) {
        $('#player1Name').text(`Player 1: ${player1}`);
        $('#player2Name').text(`Player 2: ${player2}`);
        $('#player-modal').modal('hide');
    }
});
