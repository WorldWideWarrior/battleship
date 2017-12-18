$(document).ready(function () {
    //show modal on startup
    $('#player-modal').modal({
            backdrop: 'static',
            keyboard: false
        }
    );

    //create tables
    $('#field-own').html(table(10,10));
    $('#field-opponent').html(table(10,10));

});

function table(rows, columns) {
    var table = "";

    for(var row = 0; row < rows; row++) {
        table += "<tr>"
        for(var column = 0; column < columns; column++) {
            table += "<td>";
            table += "</td>";
        }
    }

    console.log("Table: " + table);

    return table;
}

//validate player names
$("#buttonReadyPlayerModal").click( () => {
    var player1 = $('#player1Input').val();
    var player2 = $('#player2Input').val();

    if(player1 !== "" && player2 !== "" && player1 !== player2) {
        $('#player1Name').text("Player 1: " + player1);
        $('#player2Name').text("Player 2: " + player2);
        $('#player-modal').modal('hide');
    }

});