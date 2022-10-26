const exp = require("constants");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const ejs = require("ejs");
const { generateUser } = require("./util.js");
app.use(express.static("public"));
app.set("view engine", "ejs");
app.get(["/:id", "/"], (req, res) => {
  console.log(req.params.id);
  res.render("index", { data: req.params.id });
});
let users = {};
let games = {};
io.on("connection", (socket) => {
  socket.userid = generateUser();
  users[socket.userid] = socket.id;
  socket.emit("myID", socket.userid);
  socket.on("want", (id) => {
    console.log(socket.userid, "wants to connect to ", id);
    io.to(users[id]).emit("ready", "1");
    io.to(socket.id).emit("ready", "2");
    games[id] = socket.userid;
    games[socket.userid] = id;
  });
  socket.on("movePiece", (pos) => {
    let otherUser = games[socket.userid];
    let otherUserId = users[otherUser];
    io.to(otherUserId).emit("mpMovePiece", pos);
  });
  socket.on("moveOver", () => {
    let otherUser = games[socket.userid];
    let otherUserId = users[otherUser];
    io.to(otherUserId).emit("yourTurn");
  });
  socket.on("playerMove", (i) => {
    let otherUser = games[socket.userid];
    let otherUserId = users[otherUser];
    io.to(otherUserId).emit("playerMove", i);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
