export const socket = io();
socket.on("mpMovePiece", (pos) => {
  if (socket.gameState.otherPlayer) socket.moveOtherPlayer(pos);
});
socket.on("yourTurn", () => {
  socket.setMyTurn();
});
socket.on("playerMove", (i) => {
  socket.instantiateCircle(i, true);
});
socket.on("myID", (id) => {
  if (!connectTo) {
    let linkEl = document.createElement("div");
    linkEl.innerHTML = `<a href='/${id}' id='share'>Share this link to play against someone else!</a>
    <a href='#' id='copy'>[copy]</a>`;
    document.body.appendChild(linkEl);
    document.getElementById("copy").addEventListener("click", () => {
      navigator.clipboard.writeText(document.getElementById("share").href).then(
        () => {
          document.getElementById("copy").innerText = "COPIED";
        },
        () => {
          console.log("Error in copy");
        }
      );
    });
  } else {
    console.log("oo");
    socket.emit("want", connectTo);
  }
});

socket.on("ready", (user) => {
  socket.multiplayerPopup(user);
});
