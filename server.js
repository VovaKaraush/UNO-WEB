require('dotenv').config(); // Charge les variables d'environnement en premier
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken')
const path = require('path');
const setupRoutes = require('./functions/routes.js');
const startdb = require('./functions/database.js')

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Serveur OK' });
});

// Initialize custom routes and database
setupRoutes(app);
startdb();

// Socket.io events for the game
io.on('connection', (socket) => {
  console.log('Nouveau joueur connecté:', socket.id);

  socket.on('disconnect', () => {
    console.log('Joueur déconnecté:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`)
});