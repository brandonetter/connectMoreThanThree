import { socket } from "./multiplayer.js";

let gameBoard = Array.from({ length: 7 }, () => Array(6).fill(0));

const shadowBoard = document.querySelector(".shadow");
const board = document.querySelector(".boardContainer");
const circlePiece = document.querySelector(".circlePiece");
const selectors = [...document.querySelectorAll(".mouseSelectors div")];
const mouseSelectorsBoundingBox = document.querySelector(".mouseSelectors");
const popUp = document.querySelector(".popUp");
const mppopup = document.querySelector(".mppopup");
let gameState = {
  canMove: true,
  usersTurn: true,
  ongoing: true,
  multiplayer: false,
  otherPlayer: null,
};
socket.gameState = gameState;

function moveOtherPlayer(pos) {
  socket.gameState.otherPlayer.style.left =
    (board.getBoundingClientRect().width / 7) * pos + (6 - pos) * 2 + "px";
}
socket.moveOtherPlayer = moveOtherPlayer;
circlePiece.classList.toggle("userCircle");
for (let i in selectors) {
  selectors[i].addEventListener("mouseover", () => {
    if (gameState.usersTurn || gameState.multiplayer)
      circlePiece.style.left =
        (board.getBoundingClientRect().width / 7) * i + (6 - i) * 2 + "px";
    if (gameState.multiplayer) {
      socket.emit("movePiece", i);
    }
  });
  selectors[i].addEventListener("click", () => {
    if (!circlePiece.classList.contains("AICircle") || gameState.multiplayer) {
      if (!gameState.multiplayer) {
        instantiateCircle(i);
      } else {
        if (gameState.usersTurn && gameState.canMove) {
          instantiateCircle(i);
          socket.emit("playerMove", i);
          gameState.canMove = false;
          setTimeout(() => (gameState.canMove = true), 1000);
        }
      }
    }
  });
}

function instantiateCircle(i, mp = false) {
  if (gameState.ongoing === false) return true;
  if (getColumnFill(i) == 6) return 0;
  if (!gameState.canMove) return true;
  if (mp) {
    if (!gameState.usersTurn) {
      let newCircle = gameState.otherPlayer.cloneNode();
      newCircle.style.left =
        (board.getBoundingClientRect().width / 7) * i + (6 - i) * 2 + "px";
      let position = getPositionOfAddedPiece(i);
      newCircle.classList.toggle("dropAnim");
      let shadowCircle = gameState.otherPlayer.cloneNode();
      shadowCircle.classList.toggle("dropAnim");
      shadowCircle.classList.add("shadowCircle");
      let posToCheck = [Number(i), getColumnFill(i) - 1];
      shadowBoard.appendChild(shadowCircle);
      board.appendChild(newCircle);
      setTimeout(() => newCircle.classList.add("dropped" + position), 10);
      setTimeout(() => shadowCircle.classList.add("dropped" + position), 10);
      setTimeout(() => moveFinished(posToCheck, mp), 1000);
      if (!gameState.multiplayer) switchPiece();
      return 1;
    }
  }

  circlePiece.style.left =
    (board.getBoundingClientRect().width / 7) * i + (6 - i) * 2 + "px";

  gameState.canMove = false;
  setTimeout(() => (gameState.canMove = true), 1000);

  let newCircle = circlePiece.cloneNode();
  let position = getPositionOfAddedPiece(i);
  newCircle.classList.toggle("dropAnim");
  let shadowCircle = circlePiece.cloneNode();
  shadowCircle.classList.toggle("dropAnim");
  shadowCircle.classList.add("shadowCircle");
  let posToCheck = [Number(i), getColumnFill(i) - 1];
  shadowBoard.appendChild(shadowCircle);
  board.appendChild(newCircle);
  setTimeout(() => newCircle.classList.add("dropped" + position), 10);
  setTimeout(() => shadowCircle.classList.add("dropped" + position), 10);
  setTimeout(() => moveFinished(posToCheck), 1000);
  if (!gameState.multiplayer) switchPiece();
  return 1;
}

socket.instantiateCircle = instantiateCircle;
function setMyTurn() {
  gameState.usersTurn = true;
}
socket.setMyTurn = setMyTurn;
function moveFinished(posToCheck, mp = false) {
  let winner = traverseBoard(posToCheck);
  if (winner && gameState.usersTurn) {
    gameState.winner = "user";
    endGame();
  }
  if (winner && !gameState.usersTurn) {
    gameState.winner = "cpu";
    endGame();
  }
  if (!mp) {
    gameState.usersTurn = !gameState.usersTurn;
  }
  if (!gameState.usersTurn && !gameState.multiplayer) aiMove();
  if (!gameState.usersTurn && gameState.multiplayer && !mp)
    socket.emit("moveOver");
}
function getColumnFill(column) {
  return gameBoard[column].reduce((p, c, i) => {
    return p + (c ? 1 : 0);
  }, 0);
}
function getPositionOfAddedPiece(column) {
  gameBoard[column][columnPosFromFill(column)] = gameState.usersTurn ? 1 : 2;
  return getColumnFill(column);
}
function switchPiece() {
  circlePiece.classList.toggle("userCircle");
  circlePiece.classList.toggle("AICircle");
}
function columnPosFromFill(column) {
  return gameBoard[column].length - getColumnFill(column) - 1;
}
const positionModifiers = (() => {
  let pos = [];
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (i === 0 && j === 0) continue;
      pos.push([i, j]);
    }
  }
  return pos;
})();
function traverseBoard(pos, neighbors = getNeighbors(pos)) {
  for (let i in neighbors) {
    if (neighbors[i].length === 3) {
      gameState.ongoing = false;
      return true;
    }
  }
}
function getNeighbors(pos, override = null) {
  let neighbors = {
    "2_": [], //diagPos
    "0_": [], //diagNeg
    "3_": [], //vert
    "1_": [], //hor
  };
  pos[1] = 5 - pos[1]; // Align the board with a width of 6 correctly, ignore this
  let thisPosValue = override || gameBoard[pos[0]][pos[1]];

  for (let i of positionModifiers) {
    let nX = pos[0] + i[0];
    let nY = pos[1] + i[1];
    // quick maffs
    let vTag = i[0] * i[1] + (i[0] ? 0 : 2) + 1;
    let positionValue = gameBoard[nX]?.[nY];
    while (positionValue === thisPosValue) {
      neighbors[vTag + "_"].push([[nX, nY], i]);
      nX += i[0];
      nY += i[1];
      positionValue = gameBoard[nX]?.[nY];
    }
  }
  return neighbors;
}

function aiMove() {
  let moveOptions = [];
  let attackMoveOptions = [];
  setTimeout(() => {
    for (let i = 0; i < 7; i++) {
      let n = getNeighbors([i, 5 - columnPosFromFill(i)], 1);
      n = Object.values(n);
      n = n.filter((n) => n.length > 0);
      n = n.sort((a, b) => b.length - a.length);
      moveOptions.push(n[0]?.length || 0);
    }
    for (let i = 0; i < 7; i++) {
      let n = getNeighbors([i, 5 - columnPosFromFill(i)], 2);
      n = Object.values(n);
      n = n.filter((n) => n.length > 0);
      n = n.sort((a, b) => b.length - a.length);
      attackMoveOptions.push(n[0]?.length || 0);
    }
    let defenseMax = Math.max(...moveOptions);
    let attackMax = Math.max(...attackMoveOptions);
    let max = 0;
    let min = 0;
    if (attackMax >= defenseMax) {
      max = attackMoveOptions.indexOf(attackMax);
      min = attackMoveOptions.indexOf(Math.min(...attackMoveOptions));
    } else {
      max = moveOptions.indexOf(Math.max(...moveOptions));
      min = moveOptions.indexOf(Math.min(...moveOptions));
    }
    if (max === min) {
      max = Math.floor(Math.random() * 7);
    }
    while (!instantiateCircle(max)) {
      max = Math.floor(Math.random() * 7);
    }
  }, 100);
}
function endGame() {
  circlePiece.style.opacity = 0;
  popUp.style.top = "50%";
  popUp.children[0].innerText =
    gameState.winner === "user" ? "You won!" : "You lost!";
  popUp.children[1].addEventListener("click", () => {
    resetGame();
  });
}
function multiplayerPop(user) {
  mppopup.style.top = "50%";
  mppopup.children[1].addEventListener("click", () => {
    resetGame();
    gameState.multiplayer = true;
    gameState.otherPlayer = circlePiece.cloneNode();
    if (!connectTo) {
      gameState.otherPlayer.classList.toggle("userCircle");

      gameState.otherPlayer.classList.toggle("AICircle");
    }

    socket.gameState = gameState;
    board.appendChild(gameState.otherPlayer);
    if (connectTo) {
      switchPiece();
      if (user === 1) {
        gameState.usersTurn = true;
      } else {
        gameState.usersTurn = false;
      }
      circlePiece.style.pointerEvents = "all";
    }
  });
}
function resetGame() {
  gameState = {
    canMove: true,
    usersTurn: true,
    ongoing: true,
    winner: null,
  };
  popUp.style.top = "-50%";
  mppopup.style.top = "-50%";
  circlePiece.style.opacity = null;
  let circles = [...document.querySelectorAll(".circlePiece")];
  for (let i of circles) {
    if (i != circlePiece) {
      i.remove();
    }
  }
  if (circlePiece.classList.contains("AICircle")) {
    switchPiece();
  }
  gameBoard = Array.from({ length: 7 }, (e) => Array(6).fill(0));
}
socket.multiplayerPopup = multiplayerPop;
