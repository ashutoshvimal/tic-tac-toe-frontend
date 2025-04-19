var BACKEND_URL = "https://tic-tac-toe-latest-49p1.onrender.com";
var uid = randString(32);
var gid = null;
var gamestate = null;
var player = "X";

function connect() {
    var socket = new SockJS(BACKEND_URL + '/tic-tac-toe');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
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

    $('#disconnectModal').modal('hide');

    $("#menu").show();
    $("#tictactoe").hide();

    cleanGamestate();
    $("#winning-line").css({ width: "0", height: "0", transition: "none" });

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
    stompClient.send("/app/move/" + gid, {}, JSON.stringify({'player': uid, 'x': x, 'y': y}));
}

function refresh() {
    $.getJSON(BACKEND_URL + "/app/games", function(data){
        $("#games").empty();
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
        player = "X";

        $("#menu").hide();
        $("#tictactoe").show();

        gid = data.id;
        connect();

        updateGamestate(data);
    });
}

function join(id) {
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

    if(!gamestate.winner && !gamestate.draw) { //simulate rematch condition
        resetWinningLineUi()
    }


    if (!gamestate.started) {
        status = "Waiting for second player...";
    }
    else if (gamestate.disconnect) {
        status = "Other player has disconnected!"; //todo: this do not work
    }
    else {
        status = "Both players are here! You are '" + player + "'.";
    }

    //todo : mention whose turn is this. most probably will be done using backend
    if (gamestate.started && !gamestate.winner && !gamestate.draw) {
        status2 = "'" + gamestate.startingPlayer + "' goes first.";
    }
    else if (gamestate.winner) {
        checkForWinnerUi(gamestate);
        if (gamestate.winner === uid) {
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

function resetWinningLineUi() {
    const line = document.getElementById("winning-line");
    if (line) {
        line.style.width = "0";
        line.style.transition = "none";
    }
}


function drawWinnerLineUI(type, index) {
    const line = document.getElementById("winning-line");
    const boardSize = 300; // Adjust based on your board size
    const cellSize = boardSize / 3;

    // Reset the line's width and position
    line.style.width = "0";
    line.style.transition = "none";

    if (type === "row") {
        line.style.width = `${boardSize}px`;
        line.style.height = "4px";
        line.style.top = `${index * cellSize + cellSize / 2 - 2}px`;
        line.style.left = "0";
        line.style.transform = "rotate(0deg)";
    } else if (type === "column") {
        line.style.width = `${boardSize}px`;
        line.style.height = "4px";
        line.style.top = "0";
        line.style.left = `${index * cellSize + cellSize / 2}px`;
        line.style.transform = "rotate(90deg)";
        line.style.transformOrigin = "top left";
    } else if (type === "diagonal1") {
        line.style.width = `${Math.sqrt(2) * boardSize}px`;
        line.style.height = "4px";
        line.style.top = "0";
        line.style.left = "0";
        line.style.transform = "rotate(45deg)";
        line.style.transformOrigin = "top left";
    } else if (type === "diagonal2") {
        line.style.width = `${Math.sqrt(2) * boardSize}px`;
        line.style.height = "4px";
        line.style.top = "0";
        line.style.left = `${-(cellSize+25)}px`; //hack fix
        line.style.transform = "rotate(-45deg)";
        line.style.transformOrigin = "top right";
    }

    // Trigger the animation
    setTimeout(() => {
        line.style.transition = "width 0.5s ease";
        line.style.width = type.includes("diagonal") ? `${Math.sqrt(2) * boardSize}px` : `${boardSize}px`;
    }, 0);
}

function checkForWinnerUi(gamestate) {
    const board = gamestate.board;

    // Check rows
    for (let x = 0; x < 3; x++) {
        if (board[x][0] === board[x][1] && board[x][1] === board[x][2] && board[x][0] !== "") {
            drawWinnerLineUI("row", x);
            return;
        }
    }

    // Check columns
    for (let y = 0; y < 3; y++) {
        if (board[0][y] === board[1][y] && board[1][y] === board[2][y] && board[0][y] !== "") {
            drawWinnerLineUI("column", y);
            return;
        }
    }

    // Check diagonal1 (top-left to bottom-right)
    if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0] !== "") {
        drawWinnerLineUI("diagonal1");
        return;
    }

    // Check diagonal2 (top-right to bottom-left)
    if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2] !== "") {
        drawWinnerLineUI("diagonal2");
        return;
    }
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
