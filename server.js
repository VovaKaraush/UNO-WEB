import 'dotenv/config.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import setupRoutes from './functions/routes.js';
import startdb from './functions/database.js';

import * as gameModule       from './src/game.js';
import * as actionsModule    from './src/actions.js';
import * as ruleModule       from './src/rule.js';
import * as specialCards     from './src/specialCards.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Initialize specialCards with required functions
specialCards.init({
  nextTurn: actionsModule.nextTurn,
  drawCard: actionsModule.drawCard
});

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const port   = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/ping', (req, res) => res.json({ message: 'Serveur OK' }));

setupRoutes(app);
startdb();

// ─── Stockage ─────────────────────────────────────────
const lobbies    = new Map(); // code     -> lobby
const games      = new Map(); // roomId   -> gameState
const socketMeta = new Map(); // socketId -> { lobbyCode, playerName }

// ─── Socket.io ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Nouveau joueur connecté:', socket.id);

  // ── Lobby : créer ──────────────────────────────────
  socket.on('createLobby', ({ name, code, maxPlayers, hostName }) => {
    try {
      if (lobbies.has(code)) {
        socket.emit('lobbyError', 'Code de lobby déjà utilisé');
        return;
      }

      const newLobby = {
        code, name, maxPlayers,
        players: [{ socketId: socket.id, name: hostName }],
        createdAt: Date.now(),
        status: 'waiting'
      };

      lobbies.set(code, newLobby);
      socket.join(code);
      socketMeta.set(socket.id, { lobbyCode: code, playerName: hostName });

      console.log(`Lobby créé: ${code} — ${name}`);
      socket.emit('lobbyCreated', newLobby);
      io.to(code).emit('lobbyUpdated', newLobby);
    } catch (err) {
      console.error('Erreur création lobby:', err);
      socket.emit('lobbyError', 'Erreur lors de la création du lobby');
    }
  });

  // ── Lobby : rejoindre par code ─────────────────────
  socket.on('joinLobbyByCode', ({ code, playerName }) => {
    try {
      const lobby = lobbies.get(code.toUpperCase());

      if (!lobby) { socket.emit('lobbyError', 'Code de lobby invalide'); return; }
      if (lobby.players.length >= lobby.maxPlayers) { socket.emit('lobbyError', 'Le lobby est plein'); return; }

      lobby.players.push({ socketId: socket.id, name: playerName });
      socket.join(code);
      socketMeta.set(socket.id, { lobbyCode: code, playerName });

      console.log(`${playerName} a rejoint le lobby ${code}`);
      socket.emit('joinedLobby', lobby);
      io.to(code).emit('lobbyUpdated', lobby);

      if (lobby.players.length >= lobby.maxPlayers) {
        startGameFromLobby(lobby);
      }
    } catch (err) {
      console.error('Erreur join lobby:', err);
      socket.emit('lobbyError', 'Erreur lors de la connexion au lobby');
    }
  });

  // ── Lobby : prêt ───────────────────────────────────
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

  // ── Rejoindre une game room après redirection ──────
  // Game.html se charge avec un nouveau socket → il demande à rejoindre sa room
  socket.on('rejoinGame', ({ gameRoomId, playerName }) => {
    try {
      if (!games.has(gameRoomId)) {
        socket.emit('error', 'Partie introuvable');
        return;
      }
      socket.join(gameRoomId);
      console.log(`${playerName} a rejoint la game room ${gameRoomId}`);

      // Renvoyer l'état courant au joueur qui vient de rejoindre
      broadcastGameState(io, gameRoomId, games.get(gameRoomId));
    } catch (err) {
      console.error('Erreur rejoinGame:', err);
    }
  });

  // ── Jeu : jouer une carte ──────────────────────────
  socket.on('playCard', ({ cardIndex }) => {
    try {
      const roomId = getGameRoom(socket);
      if (!roomId) { socket.emit('error', 'Pas de partie active'); return; }

      const state      = games.get(roomId);
      const player     = state.players[state.current_player];
      const topCard    = state.discard[state.discard.length - 1];
      const cardToPlay = player.hand[cardIndex];

      if (!cardToPlay) { socket.emit('error', 'Carte invalide'); return; }

      if (!ruleModule.isPlayable(cardToPlay, topCard, state)) {
        socket.emit('error', 'Vous ne pouvez pas jouer cette carte !');
        return;
      }

      actionsModule.playCard(cardIndex, player, state);

      const isWild = cardToPlay.value === 'wild' || cardToPlay.value === 'draw4';
      if (!isWild) {
        actionsModule.nextTurn(state);
      } else {
        state.pending = 'chooseColor';
      }

      broadcastGameState(io, roomId, state);
    } catch (err) {
      console.error('Erreur playCard:', err);
      socket.emit('error', `Erreur lors du jeu de la carte: ${err.message}`);
    }
  });

  // ── Jeu : piocher ─────────────────────────────────
  socket.on('drawCard', () => {
    try {
      const roomId = getGameRoom(socket);
      if (!roomId) { socket.emit('error', 'Pas de partie active'); return; }

      const state  = games.get(roomId);
      const player = state.players[state.current_player];
      actionsModule.drawCard(1, player, state);
      broadcastGameState(io, roomId, state);
    } catch (err) {
      console.error('Erreur drawCard:', err);
      socket.emit('error', `Erreur lors du tirage: ${err.message}`);
    }
  });

  // ── Jeu : passer son tour ──────────────────────────
  socket.on('passTurn', () => {
    try {
      const roomId = getGameRoom(socket);
      if (!roomId) { socket.emit('error', 'Pas de partie active'); return; }

      const state = games.get(roomId);
      actionsModule.nextTurn(state);
      broadcastGameState(io, roomId, state);
    } catch (err) {
      console.error('Erreur passTurn:', err);
      socket.emit('error', `Erreur lors du passage: ${err.message}`);
    }
  });

  // ── Jeu : choisir une couleur ──────────────────────
  socket.on('chooseColor', ({ color }) => {
    try {
      const roomId = getGameRoom(socket);
      if (!roomId) { socket.emit('error', 'Pas de partie active'); return; }

      const validColors = ['red', 'green', 'blue', 'yellow'];
      if (!validColors.includes(color)) { socket.emit('error', 'Couleur invalide'); return; }

      const state      = games.get(roomId);
      const topCard    = state.discard[state.discard.length - 1];
      state.wild_color = color;
      state.pending    = '';


      // si la carte jouée est un draw4, faire piocher 4 cartes au joueur suivant
      if (topCard.value === 'draw4') {
        const nextPlayerIndex = (state.current_player + state.order) % state.players.length;
        actionsModule.drawCard(4, state.players[nextPlayerIndex], state);
      }

      actionsModule.nextTurn(state);
      broadcastGameState(io, roomId, state);
    } catch (err) {
      console.error('Erreur chooseColor:', err);
      socket.emit('error', `Erreur lors du choix de couleur: ${err.message}`);
    }
  });

  // ── Jeu : reset ───────────────────────────────────
  socket.on('resetGame', () => {
    try {
      const roomId = getGameRoom(socket);
      if (!roomId) { socket.emit('error', 'Pas de partie active'); return; }

      games.delete(roomId);
      io.to(roomId).emit('reset');
    } catch (err) {
      console.error('Erreur resetGame:', err);
      socket.emit('error', `Erreur lors du reset: ${err.message}`);
    }
  });

  // ── Déconnexion ────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('Joueur déconnecté:', socket.id);

    const meta = socketMeta.get(socket.id);
    if (meta) {
      const lobby = lobbies.get(meta.lobbyCode);
      if (lobby) {
        lobby.players = lobby.players.filter(p => p.socketId !== socket.id);
        if (lobby.players.length === 0) lobbies.delete(meta.lobbyCode);
        else io.to(meta.lobbyCode).emit('lobbyUpdated', lobby);
      }
      socketMeta.delete(socket.id);
    }
  });
});

// ─── Helpers ──────────────────────────────────────────

function getGameRoom(socket) {
  return Array.from(socket.rooms).find(r => games.has(r)) ?? null;
}

function startGameFromLobby(lobby) {
  try {
    const playerNames = lobby.players.map(p => p.name);
    const state       = gameModule.createGame(playerNames);
    const gameRoomId  = `game-${lobby.code}`;

    games.set(gameRoomId, state);

    // Notifier chaque socket du lobby — ils vont rediriger et rejoindre via rejoinGame
    io.to(lobby.code).emit('gameStarted', { gameRoomId, playerNames });

    lobbies.delete(lobby.code);
    console.log(`Partie lancée depuis lobby ${lobby.code} (room: ${gameRoomId})`);
  } catch (err) {
    console.error('Erreur startGameFromLobby:', err);
  }
}

function broadcastGameState(io, roomId, state) {
  const topCard = state.discard.length > 0
    ? state.discard[state.discard.length - 1]
    : null;

  const playable = state.players[state.current_player]?.hand.map(card =>
    topCard ? ruleModule.isPlayable(card, topCard, state) : false
  ) ?? [];

  const winner = state.players.find(p => p.hand.length === 0);

  const payload = {
    current_player: state.current_player,
    order:          state.order,
    deckCount:      state.deck.length,
    topCard,
    wild_color:     state.wild_color,
    pending:        state.pending || '',
    winner:         winner ? winner.name : null,
    players: state.players.map(p => ({
      name:      p.name,
      cardCount: p.hand.length,
      uno:       p.hand.length === 1,
      hand:      p.hand
    })),
    playable
  };

  io.to(roomId).emit('state', payload);
}

server.listen(port, () => {
  console.log(`Serveur lancé sur http://localhost:${port}`);
});
