//show modal on startup
$('#player-modal').modal({
        backdrop: 'static',
        keyboard: false
    }
);

//validate player names
$("#buttonReadyPlayerModal").click( () => {
    var player1 = $('#player1Input').val();
    var player2 = $('#player2Input').val();

    if(player1 !== "" && player2 !== "" && player1 !== player2) {
        $('#player1Name').text("Player 1: " + player1);
        $('#player2Name').text("Player 2: " + player2);
        $('#player-modal').modal('hide');
    }

})