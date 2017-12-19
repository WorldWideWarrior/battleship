import io from 'socket.io-client'

$(document).ready(function () {
    //show modal on startup
    $('#player-modal').modal({
            backdrop: 'static',
            keyboard: false
        }
    );

    //create tables
    var fieldOwn = $('#field-own');
    generateTable(fieldOwn, 10,10);
    var fieldOpponent = $('#field-opponent');
    generateTable(fieldOpponent, 10,10);

    var socket = io("localhost:3000")
});

function generateTable(table, rows, columns) {
    for(var row = 0; row < rows; row++) {
        var rowElement = $('<tr></tr>');
        for(var column = 0; column < columns; column++) {
            var columnElement = $('<td/>');

            (function(row, column){
                columnElement.on('click', function () {
                    console.log("Click: " + row + ", " + column);
                })
            })(row, column);

            rowElement.append(columnElement);
        }
        table.append(rowElement)
    }
}

//validate player names
$("#buttonReadyPlayerModal").click( () => {
    var player1 = $('#player1Input').val();
    var player2 = $('#player2Input').val();

    if(player1 !== "" && player2 !== "" && player1 !== player2) {
        $('#player1Name').text("Player 1: " + player1);
        $('#player2Name').text("Player 2: " + player2);
        $('#player-modal').modal('hide')
    }

});