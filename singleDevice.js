var uid = randString(32);
var gameId = randString(32);
var gameState = null;
var player = "X";

var data = {
    id: gameId,
    player: uid,
    started: true,
    startingPlayer: "X",
    currentPlayer: "X",
    winner: null,
    draw: false,
    disconnected: false,
    board: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ]
}

function isNewGame() {
    for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
            if (gameState.board[x][y] !== "") {
                return false;
            }
        }
    }
    return true;
}

function exitGameSingleDevice() {
    $("#menu").show();
    $("#tictactoe-single-device").hide();
    $("#rematch-single-device").prop("disabled", true);
    player = "X";
    gameState = null;

    // Reset the data object to its initial state
    data = {
        id: randString(32),
        player: uid,
        started: true,
        startingPlayer: "X",
        currentPlayer: "X",
        winner: null,
        draw: false,
        disconnected: false,
        board: [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""]
        ]
    };

    cleanGameStateSingleDevice(); //redundant most probably
    resetWinningLine(); // Reset the winning line
}

function cleanGameStateSingleDevice() {
    gameState = null;

    for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
            $("#" + x + y + "-single-device").text("");
        }
    }
}


function createGameSingleDevice(){
    player = "X";
    $("#menu").hide();
    $("#tictactoe-single-device").show();

    updategameStateSingleDevice(data);

}

function canRematchSingleDevice() {
    return (gameState.winner || gameState.draw);
}


function updategameStateSingleDevice(data) {
    gameState = data;

    $("#rematch-single-device").prop("disabled", !canRematchSingleDevice());

    gameStatusSingleDevice();
    drawBoardSingleDevice();
}


function gameStatusSingleDevice() {
    var status = "";
    var status2 = "";


    if(isNewGame()) {
        status2 = "'" + gameState.startingPlayer + "' goes first.";
    }
    else if (gameState.started && !gameState.winner && !gameState.draw) {
        status2 = "'" + gameState.currentPlayer + "' turn";
    }
    else if (gameState.winner) {
        if (gameState.winner === "X") {
            status2 = "X won!";
        }
        else {
            status2 = "O won!";
        }
    }
    else if (gameState.draw) {
        status2 = "It's a draw!";
    }
    else {
        status2 = "";
    }

    $("#player-turn").text(status);
    $("#result-status").text(status2);
}


function drawBoardSingleDevice() {
    for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
            $("#" + x + y + "-single-device").text(gameState.board[x][y]);
        }
    }
}

function rematchSingleDevice() {
    if (gameState.winner || gameState.draw) {
        gameState.winner = null;
        gameState.draw = false;
        gameState.disconnected = false; //redundant most probably

        gameState.startingPlayer = gameState.startingPlayer === "X" ? "O" : "X"
        gameState.currentPlayer = gameState.startingPlayer;

        gameState.board = [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""]
        ]
        updategameStateSingleDevice(gameState);
        resetWinningLine(); // Reset the winning line
    }
}

function isValidPlayer(player) {
    return player === "X" || player === "O";
}

function checkForDraw() {
    var draw = true;
    for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
            if (gameState.board[x][y] === "") {
                draw = false;
                break;
            }
        }
    }

    if (draw) {
        gameState.draw = true;
        gameStatusSingleDevice();
    }
}

function resetWinningLine() {
    const line = document.getElementById("winning-line-single-device");
    if (line) {
        line.style.width = "0";
        line.style.transition = "none";
    }
}


function drawWinningLine(type, index) {
    const line = document.getElementById("winning-line-single-device");
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
        line.style.top = "0px";
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


function checkForWinner(player) {
    // Check rows
    for (var x = 0; x < 3; x++) {
        if (gameState.board[x][0] === player && gameState.board[x][1] === player && gameState.board[x][2] === player) {
            gameState.winner = player;
            drawWinningLine("row", x);
            return true;
        }
    }

    // Check columns
    for (var y = 0; y < 3; y++) {
        if (gameState.board[0][y] === player && gameState.board[1][y] === player && gameState.board[2][y] === player) {
            gameState.winner = player;
            drawWinningLine("column", y);
            return true;
        }
    }

    // Check diagonals
    if (gameState.board[0][0] === player && gameState.board[1][1] === player && gameState.board[2][2] === player) {
        gameState.winner = player;
        drawWinningLine("diagonal1");
        return true;
    }
    if (gameState.board[0][2] === player && gameState.board[1][1] === player && gameState.board[2][0] === player) {
        gameState.winner = player;
        drawWinningLine("diagonal2");
        return true;
    }

    return false;
}


function swapCurrentPlayer() {
    if (gameState.currentPlayer === "X") {
        gameState.currentPlayer = "O";
    } else {
        gameState.currentPlayer = "X";
    }

}

function sendMoveSingleDevice(x, y) {

    // Invalid move
    if (x < 0 || x >= 3) return;
    if (y < 0 || y >= 3) return;

    // Invalid player
    if (!isValidPlayer(player)) return;

    if (gameState.started && !gameState.disconnected && !gameState.winner &&
        gameState.board[x][y] === "") {

        let currentPlayer = gameState.currentPlayer;
        gameState.board[x][y] = currentPlayer === "X" ? "X" : "O";

        if (checkForWinner("X")) gameState.winner = "X";
        if (checkForWinner("O")) gameState.winner = "O";
        //
        checkForDraw();
        swapCurrentPlayer();
        drawBoardSingleDevice();
        updategameStateSingleDevice(gameState);
    }
}


$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });

    $("#rematch-single-device").click(function() { rematchSingleDevice(); });
    $("#exit-single-device").click(function() { exitGameSingleDevice(); });


    $("#board-single-device").on( "click", "td", function() {
        sendMoveSingleDevice($(this).attr('x'), $(this).attr('y'));
    });

    refresh();
});

