var BACKEND_URL = "https://tic-tac-toe-latest-49p1.onrender.com";
var uid = randString(32);
var gid = null;
var gamestate = null;
var player = "X";

function connect() {
    var socket = new SockJS(BACKEND_URL + '/tic-tac-toe');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/app/gamestate/' + gid, function (data) {
            updateGamestate(JSON.parse(data.body));
        });
        stompClient.send(BACKEND_URL + "/app/join/" + gid, {}, JSON.stringify({'player': uid}));
    });
}

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    console.log("Disconnected");

    $('#disconnectModal').modal('hide');

    $("#menu").show();
    $("#tictactoe").hide();

    cleanGamestate();

    if (gid != null) {
        $.ajax({
            url: BACKEND_URL + "/app/game/disconnect",
            type: "post",
            data: {
                id: gid,
                player: uid,
                disconnect: true
            }
        }).done(refresh);
    }
}

function rematch() {
    if (gamestate.winner || gamestate.draw) {
        $.ajax({
            url: BACKEND_URL + "/app/game/rematch",
            type: "post",
            data: {
                id: gid,
                player: uid,
                rematch: true
            }
        });
    }
}

function sendMove(x, y) {
    console.log("Inside js sendMove");
    console.log(gid);
    stompClient.send("/app/move/" + gid, {}, JSON.stringify({'player': uid, 'x': x, 'y': y}));
}

function refresh() {
    $.getJSON(BACKEND_URL + "/app/games", function(data){
        $("#games").empty();
        console.log(data);
        if (data.length > 0) {
            for (var game in data) {
                game = data[game];
                $("#games").append("<tr><td><button id=\"" + game.id + "\" class=\"btn btn-success btn-sm\">Join</button>&nbsp;" + game.name  + "</td></tr>");
            }
        }
        else {
            $("#games").append("<tr><td class='no-games-message'>There are no games currently available. Try creating your own!</td></tr>");
        }
    });
}

function create() {
    var name = $("#gamename").val() || undefined;

    $('#createGameModal').modal('hide');

    $.post({
        url: BACKEND_URL + "/app/game",
        data: {
            player: uid,
            name: name
        }
    }).done(function(data) {
        console.log("Created Game");

        player = "X";

        $("#menu").hide();
        $("#tictactoe").show();

        gid = data.id;
        connect();

        updateGamestate(data);
    });
}

function join(id) {
    console.log("Inside new join method")
    $.ajax({
        url: BACKEND_URL + "/app/game/join",
        type: "post",
        data: {
            player: uid,
            id: id
        }
    }).done(function(data) {
        if (!data) {
            alert("Game is no longer available.", refresh);
            refresh();
            return;
        }

        console.log("Joined Game");

        player = "O";

        $("#menu").hide();
        $("#tictactoe").show();

        gid = data.id;
        connect();

        updateGamestate(data);
    });
}

function updateGamestate(data) {
    gamestate = data;

    $("#rematch").prop("disabled", !canRematch());

    gameStatus();
    drawBoard();
}

function canRematch() {
    return !gamestate.disconnect && (gamestate.winner || gamestate.draw);
}

function cleanGamestate() {
    gamestate = null;

    for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
            $("#" + x + y).text("");
        }
    }
}

function drawBoard() {
    for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
            $("#" + x + y).text(gamestate.board[x][y]);
        }
    }
}

function gameStatus() {
    var status = "";
    var status2 = "";

    if (!gamestate.started) {
        status = "Waiting for second player...";
    }
    else if (gamestate.disconnect) {
        status = "Other player has disconnected!";
    }
    else {
        status = "Both players are here! You are '" + player + "'.";
    }

    if (gamestate.started && !gamestate.winner && !gamestate.draw) {
        status2 = "'" + gamestate.startingPlayer + "' goes first.";
    }
    else if (gamestate.winner) {
        if (gamestate.winner == uid) {
            status2 = "You win!";
        }
        else {
            status2 = "You lost!";
        }
    }
    else if (gamestate.draw) {
        status2 = "It's a draw!";
    }
    else {
        status2 = "";
    }

    $("#status").text(status);
    $("#status2").text(status2);
}

function randString(length) {
    var text = "";
    var alphanum = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        text += alphanum.charAt(Math.floor(Math.random() * alphanum.length));
    }

    return text;
}

var unloadCalled = false;
function doUnload() {
    if (!unloadCalled) {
        unloadCalled = true;
        disconnect();
    }
};

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });

    $("#tictactoe").hide();

    $("#refresh").click(function() { refresh(); });
    $("#create").click(function() { create(); });
    $("#disconnect").click(function() { disconnect(); });
    $("#rematch").click(function() { rematch(); });

    $("#games").on( "click", "button", function() {
        join($(this).attr('id'));
    });

    $("#board").on( "click", "td", function() {
        sendMove($(this).attr('x'), $(this).attr('y'));
    });

    refresh();
});
