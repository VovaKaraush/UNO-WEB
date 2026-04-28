import 'dotenv/config.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import setupRoutes from './functions/routes.js';
import startdb from './functions/database.js';

// Importer les modules métier de src/
import * as gameModule from './src/game.js';
import * as actionsModule from './src/actions.js';
import * as ruleModule from './src/rule.js';
import * as playerModule from './src/player.js';
import * as deckModule from './src/deck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ─── Stockage des lobbies et parties ─────────────
const lobbies = new Map(); // code -> lobby
const games = new Map(); // roomId -> gameState
const playerSockets = new Map(); // playerId -> socket

// ─── Socket.io connection ───────────────────────
io.on('connection', (socket) => {
  console.log('Nouveau joueur connecté:', socket.id);
  playerSockets.set(socket.id, socket);

  // ─── Événements de Lobby ────────────────────
  socket.on('createLobby', ({ name, code, maxPlayers, hostId, hostName }) => {
    try {
      if (lobbies.has(code)) {
        socket.emit('lobbyError', 'Code de lobby déjà utilisé');
        return;
      }

      const newLobby = {
        code,
        name,
        maxPlayers,
        hostId,
        hostName,
        players: [{ id: hostId, name: hostName }],
        createdAt: Date.now(),
        status: 'waiting'
      };

      lobbies.set(code, newLobby);
      socket.join(code);

      console.log(`Lobby créé: ${code} - ${name}`);
      socket.emit('lobbyCreated', newLobby);
      io.to(code).emit('lobbyUpdated', newLobby);
    } catch (err) {
      console.error('Erreur création lobby:', err);
      socket.emit('lobbyError', 'Erreur lors de la création du lobby');
    }
  });

  socket.on('joinLobbyByCode', ({ code, playerId, playerName }) => {
    try {
      const lobby = lobbies.get(code.toUpperCase());

      if (!lobby) {
        socket.emit('lobbyError', 'Code de lobby invalide');
        return;
      }

      if (lobby.players.length >= lobby.maxPlayers) {
        socket.emit('lobbyError', 'Le lobby est plein');
        return;
      }

      // Ajouter le joueur au lobby
      lobby.players.push({ id: playerId, name: playerName });
      socket.join(code);

      console.log(`${playerName} a rejoint le lobby ${code}`);
      socket.emit('joinedLobby', lobby);
      io.to(code).emit('lobbyUpdated', lobby);

      // Si le lobby est plein, démarrer la partie
      if (lobby.players.length >= lobby.maxPlayers) {
        startGameFromLobby(lobby);
      }
    } catch (err) {
      console.error('Erreur join lobby:', err);
      socket.emit('lobbyError', 'Erreur lors de la connexion au lobby');
    }
  });

  socket.on('playerReady', ({ lobbyCode }) => {
    try {
      const lobby = lobbies.get(lobbyCode);
      if (lobby && lobby.players.length >= lobby.maxPlayers) {
        startGameFromLobby(lobby);
      }
    } catch (err) {
      console.error('Erreur playerReady:', err);
    }
  });

  // ─── Événements du Jeu ──────────────────────
  socket.on('startGame', ({ playerNames }) => {
    try {
      const gameState = gameModule.createGame(playerNames);
      const roomId = socket.id;
      games.set(roomId, gameState);
      socket.join(roomId);

      io.to(roomId).emit('gameStarted', { playerNames });
      broadcastGameState(io, roomId, gameState);

      console.log(`Partie créée: ${roomId} avec ${playerNames.length} joueurs`);
    } catch (err) {
      socket.emit('error', `Erreur lors du démarrage: ${err.message}`);
    }
  });

  socket.on('playCard', ({ cardIndex }) => {
    try {
      const roomId = Array.from(socket.rooms).find(r => games.has(r));
      if (!roomId) {
        socket.emit('error', 'Pas de partie active');
        return;
      }

      const gameState = games.get(roomId);
      const currentPlayer = gameState.players[gameState.current_player];
      const topCard = gameState.discard[gameState.discard.length - 1];
      const cardToPlay = currentPlayer.hand[cardIndex];

      if (!ruleModule.isPlayable(cardToPlay, topCard, gameState)) {
        socket.emit('error', 'Vous ne pouvez pas jouer cette carte !');
        return;
      }

      actionsModule.playCard(cardIndex, currentPlayer, gameState);
      actionsModule.nextTurn(gameState);
      broadcastGameState(io, roomId, gameState);
    } catch (err) {
      socket.emit('error', `Erreur lors du jeu de la carte: ${err.message}`);
    }
  });

  socket.on('drawCard', () => {
    try {
      const roomId = Array.from(socket.rooms).find(r => games.has(r));
      if (!roomId) {
        socket.emit('error', 'Pas de partie active');
        return;
      }

      const gameState = games.get(roomId);
      const currentPlayer = gameState.players[gameState.current_player];

      actionsModule.drawCard(1, currentPlayer, gameState);
      broadcastGameState(io, roomId, gameState);
    } catch (err) {
      socket.emit('error', `Erreur lors du tirage: ${err.message}`);
    }
  });

  socket.on('passTurn', () => {
    try {
      const roomId = Array.from(socket.rooms).find(r => games.has(r));
      if (!roomId) {
        socket.emit('error', 'Pas de partie active');
        return;
      }

      const gameState = games.get(roomId);
      actionsModule.nextTurn(gameState);
      broadcastGameState(io, roomId, gameState);
    } catch (err) {
      socket.emit('error', `Erreur lors du passage: ${err.message}`);
    }
  });

  socket.on('chooseColor', ({ color }) => {
    try {
      const roomId = Array.from(socket.rooms).find(r => games.has(r));
      if (!roomId) {
        socket.emit('error', 'Pas de partie active');
        return;
      }

      const gameState = games.get(roomId);

      if (!['red', 'green', 'blue', 'yellow'].includes(color)) {
        socket.emit('error', 'Couleur invalide');
        return;
      }

      gameState.wild_color = color;
      gameState.pending = '';
      actionsModule.nextTurn(gameState);
      broadcastGameState(io, roomId, gameState);
    } catch (err) {
      socket.emit('error', `Erreur lors du choix de couleur: ${err.message}`);
    }
  });

  socket.on('resetGame', () => {
    try {
      const roomId = Array.from(socket.rooms).find(r => games.has(r));
      if (!roomId) {
        socket.emit('error', 'Pas de partie active');
        return;
      }

      games.delete(roomId);
      io.to(roomId).emit('reset');
    } catch (err) {
      socket.emit('error', `Erreur lors du reset: ${err.message}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Joueur déconnecté:', socket.id);
    playerSockets.delete(socket.id);

    // Nettoyer les lobbies vides
    for (const [code, lobby] of lobbies.entries()) {
      lobby.players = lobby.players.filter(p => p.id !== socket.id);
      if (lobby.players.length === 0) {
        lobbies.delete(code);
      }
    }
  });
});

/**
 * Démarrer une partie à partir d'un lobby
 */
function startGameFromLobby(lobby) {
  try {
    const playerNames = lobby.players.map(p => p.name);
    const gameState = gameModule.createGame(playerNames);
    const gameRoomId = `game-${lobby.code}`;

    games.set(gameRoomId, gameState);

    // Rejoindre tous les joueurs du lobby à la room de jeu
    lobby.players.forEach(player => {
      const socket = playerSockets.get(player.id);
      if (socket) {
        socket.join(gameRoomId);
      }
    });

    // Annoncer le démarrage du jeu
    io.to(gameRoomId).emit('gameStarted', { playerNames });
    broadcastGameState(io, gameRoomId, gameState);

    // Nettoyer le lobby
    lobbies.delete(lobby.code);

    console.log(`Partie lancée depuis lobby ${lobby.code}`);
  } catch (err) {
    console.error('Erreur startGameFromLobby:', err);
  }
}

/**
 * Broadcast l'état du jeu à tous les clients d'une room
 */
function broadcastGameState(io, roomId, gameState) {
  const topCard = gameState.discard.length > 0
    ? gameState.discard[gameState.discard.length - 1]
    : null;

  const playable = gameState.players[gameState.current_player]?.hand.map((card) =>
    ruleModule.isPlayable(card, topCard, gameState)
  ) || [];

  const formattedState = {
    current_player: gameState.current_player,
    order: gameState.order,
    deckCount: gameState.deck.length,
    topCard: topCard,
    wild_color: gameState.wild_color,
    pending: gameState.pending || '',
    winner: gameState.winner || null,
    players: gameState.players.map(p => ({
      name: p.name,
      cardCount: p.hand.length,
      uno: p.cardCount === 1,
      hand: p.hand
    })),
    playable: playable
  };

  io.to(roomId).emit('state', formattedState);
}

server.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});