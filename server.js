const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/ping", (req, res) => {
  res.json({ message: "Serveur OK" });
});

server.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});
