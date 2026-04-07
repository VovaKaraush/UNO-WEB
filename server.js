const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = [];
const sessions = new Map();
const rooms = new Map();
const userSockets = new Map();

function uid(prefix = '') {
  return prefix + crypto.randomBytes(6).toString('hex');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function findUserByToken(token) {
  const userId = sessions.get(token);
  if (!userId) return null;
  return users.find((u) => u.id === userId) || null;
}

function createDeck() {
  const deck = [];
  const colors = ['red', 'yellow', 'green', 'blue'];
  const numberValues = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const actionValues = ['skip', 'reverse', 'draw2'];

  for (const color of colors) {
    deck.push(makeCard(color, '0'));
    for (const value of numberValues.slice(1)) {
      deck.push(makeCard(color, value));
      deck.push(makeCard(color, value));
    }
    for (const value of actionValues) {
      deck.push(makeCard(color, value));
      deck.push(makeCard(color, value));
    }
  }

  for (let i = 0; i < 4; i += 1) {
    deck.push(makeCard('wild', 'wild'));
    deck.push(makeCard('wild', 'wild_draw4'));
  }

  return shuffle(deck);
}

function makeCard(color, value) {
  let label = value;
  if (value === 'skip') label = '⛔';
  if (value === 'reverse') label = '↺';
  if (value === 'draw2') label = '+2';
  if (value === 'wild') label = 'W';
  if (value === 'wild_draw4') label = '+4';
  return {
    id: uid('card_'),
    color,
    value,
    label,
  };
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function colorLabel(color) {
  return {
    red: 'Rouge',
    yellow: 'Jaune',
    green: 'Vert',
    blue: 'Bleu',
    wild: 'Noir',
  }[color] || color;
}

function ensureDrawPile(room) {
  if (room.drawPile.length > 0) return;
  const top = room.discardPile.pop();
  room.drawPile = shuffle(room.discardPile);
  room.discardPile = [top];
}

function getCurrentPlayer(room) {
  return room.players[room.currentPlayerIndex];
}

function advanceTurn(room, steps = 1) {
  const count = room.players.length;
  room.currentPlayerIndex = (room.currentPlayerIndex + (steps * room.direction) + count * 20) % count;
}

function drawCards(room, player, count) {
  const cards = [];
  for (let i = 0; i < count; i += 1) {
    ensureDrawPile(room);
    const card = room.drawPile.pop();
    if (card) {
      player.hand.push(card);
      cards.push(card);
    }
  }
  return cards;
}

function cardPlayable(card, room) {
  const top = room.discardPile[room.discardPile.length - 1];
  if (!top) return true;
  if (card.color === 'wild') return true;
  if (card.color === room.currentColor) return true;
  if (card.value === top.value) return true;
  return false;
}

function createRoom(owner, name = 'Salon UNO', maxPlayers = 4) {
  const room = {
    id: uid('room_'),
    code: Math.random().toString(36).slice(2, 7).toUpperCase(),
    name,
    ownerId: owner.id,
    maxPlayers: Math.max(2, Math.min(6, Number(maxPlayers) || 4)),
    players: [
      {
        userId: owner.id,
        username: owner.username,
        hand: [],
        saidUno: false,
        connected: true,
      },
    ],
    status: 'waiting',
    drawPile: [],
    discardPile: [],
    currentColor: null,
    currentPlayerIndex: 0,
    direction: 1,
    winnerId: null,
    log: ['Salon créé.'],
  };
  rooms.set(room.id, room);
  return room;
}

function startGame(room) {
  if (room.players.length < 2) {
    throw new Error('Il faut au moins 2 joueurs pour démarrer.');
  }

  room.status = 'playing';
  room.drawPile = createDeck();
  room.discardPile = [];
  room.currentPlayerIndex = 0;
  room.direction = 1;
  room.winnerId = null;
  room.log = ['La partie commence !'];

  for (const player of room.players) {
    player.hand = [];
    player.saidUno = false;
  }

  for (let i = 0; i < 7; i += 1) {
    for (const player of room.players) {
      player.hand.push(room.drawPile.pop());
    }
  }

  let firstCard = room.drawPile.pop();
  while (firstCard && firstCard.color === 'wild') {
    room.drawPile.unshift(firstCard);
    room.drawPile = shuffle(room.drawPile);
    firstCard = room.drawPile.pop();
  }

  room.discardPile.push(firstCard);
  room.currentColor = firstCard.color;
  room.log.push(`Première carte : ${describeCard(firstCard)}.`);
}

function describeCard(card) {
  if (!card) return 'aucune carte';
  if (card.color === 'wild') {
    return card.value === 'wild_draw4' ? 'Joker +4' : 'Joker';
  }
  return `${colorLabel(card.color)} ${card.label}`;
}

function publicRoom(room) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    ownerId: room.ownerId,
    maxPlayers: room.maxPlayers,
    status: room.status,
    playerCount: room.players.length,
    players: room.players.map((p) => ({
      userId: p.userId,
      username: p.username,
      connected: p.connected,
      cardsCount: p.hand.length,
    })),
  };
}

function roomStateFor(room, viewerId) {
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    ownerId: room.ownerId,
    status: room.status,
    maxPlayers: room.maxPlayers,
    players: room.players.map((p) => ({
      userId: p.userId,
      username: p.username,
      connected: p.connected,
      cardsCount: p.hand.length,
      hand: p.userId === viewerId ? p.hand : [],
      isCurrent: room.players[room.currentPlayerIndex]?.userId === p.userId,
      saidUno: p.saidUno,
    })),
    discardTop: room.discardPile[room.discardPile.length - 1] || null,
    drawCount: room.drawPile.length,
    currentColor: room.currentColor,
    currentPlayerId: room.players[room.currentPlayerIndex]?.userId || null,
    direction: room.direction,
    winnerId: room.winnerId,
    log: room.log.slice(-12),
  };
}

function broadcastLobby() {
  const payload = Array.from(rooms.values())
    .filter((room) => room.status === 'waiting')
    .map(publicRoom);
  io.emit('lobby:list', payload);
}

function broadcastRoom(room) {
  for (const player of room.players) {
    const sockets = userSockets.get(player.userId) || [];
    const payload = roomStateFor(room, player.userId);
    sockets.forEach((socket) => socket.emit('room:update', payload));
  }
  broadcastLobby();
}

function addLog(room, message) {
  room.log.push(message);
  if (room.log.length > 40) room.log.shift();
}

function applyCardEffect(room, player, card) {
  if (card.value === 'reverse') {
    room.direction *= -1;
    addLog(room, `${player.username} inverse le sens.`);
    if (room.players.length === 2) {
      advanceTurn(room, 1);
    }
  }

  if (card.value === 'skip') {
    advanceTurn(room, 1);
    addLog(room, `${player.username} fait passer le tour suivant.`);
  }

  if (card.value === 'draw2') {
    advanceTurn(room, 1);
    const target = getCurrentPlayer(room);
    drawCards(room, target, 2);
    addLog(room, `${target.username} pioche 2 cartes.`);
  }

  if (card.value === 'wild_draw4') {
    advanceTurn(room, 1);
    const target = getCurrentPlayer(room);
    drawCards(room, target, 4);
    addLog(room, `${target.username} pioche 4 cartes.`);
  }
}

function checkWinner(room, player) {
  if (player.hand.length === 0) {
    room.status = 'finished';
    room.winnerId = player.userId;
    addLog(room, `${player.username} remporte la partie !`);
    return true;
  }
  return false;
}

function penalizeUnoIfNeeded(room, player) {
  if (player.hand.length === 1 && !player.saidUno) {
    drawCards(room, player, 2);
    addLog(room, `${player.username} a oublié d'annoncer UNO et pioche 2 cartes.`);
  }
}

function removePlayerFromRoom(userId, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const index = room.players.findIndex((p) => p.userId === userId);
  if (index === -1) return;
  room.players.splice(index, 1);

  if (room.players.length === 0) {
    rooms.delete(room.id);
    broadcastLobby();
    return;
  }

  if (room.ownerId === userId) {
    room.ownerId = room.players[0].userId;
  }

  if (room.currentPlayerIndex >= room.players.length) {
    room.currentPlayerIndex = 0;
  }

  addLog(room, `Un joueur a quitté le salon.`);
  broadcastRoom(room);
}

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Pseudo et mot de passe requis.' });
  }

  const cleanUsername = String(username).trim().slice(0, 20);
  if (cleanUsername.length < 3 || password.length < 4) {
    return res.status(400).json({ error: 'Pseudo min. 3 caractères et mot de passe min. 4.' });
  }

  const exists = users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'Pseudo déjà utilisé.' });
  }

  const user = {
    id: uid('user_'),
    username: cleanUsername,
    passwordHash: hashPassword(password),
  };
  users.push(user);

  const token = createToken();
  sessions.set(token, user.id);
  return res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username.toLowerCase() === String(username || '').trim().toLowerCase());
  if (!user || user.passwordHash !== hashPassword(String(password || ''))) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }
  const token = createToken();
  sessions.set(token, user.id);
  return res.json({ token, user: { id: user.id, username: user.username } });
});

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  const user = findUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Non autorisé.' });
  req.user = user;
  req.token = token;
  next();
}

app.get('/api/me', auth, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

app.get('/api/rooms', auth, (req, res) => {
  res.json(Array.from(rooms.values()).filter((r) => r.status === 'waiting').map(publicRoom));
});

app.post('/api/rooms', auth, (req, res) => {
  const { name, maxPlayers } = req.body || {};
  const room = createRoom(req.user, name || 'Salon UNO', maxPlayers || 4);
  broadcastLobby();
  res.json(publicRoom(room));
});

app.get('/api/rooms/:roomId', auth, (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Salon introuvable.' });
  const inRoom = room.players.some((p) => p.userId === req.user.id);
  if (!inRoom) return res.status(403).json({ error: 'Tu ne fais pas partie de ce salon.' });
  res.json(roomStateFor(room, req.user.id));
});

app.post('/api/rooms/:roomId/join', auth, (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Salon introuvable.' });
  if (room.status !== 'waiting') return res.status(400).json({ error: 'Partie déjà démarrée.' });

  const exists = room.players.find((p) => p.userId === req.user.id);
  if (!exists && room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: 'Salon complet.' });
  }

  if (!exists) {
    room.players.push({
      userId: req.user.id,
      username: req.user.username,
      hand: [],
      saidUno: false,
      connected: true,
    });
    addLog(room, `${req.user.username} rejoint le salon.`);
  }

  broadcastRoom(room);
  res.json(publicRoom(room));
});

app.post('/api/rooms/:roomId/leave', auth, (req, res) => {
  removePlayerFromRoom(req.user.id, req.params.roomId);
  res.json({ success: true });
});

app.post('/api/rooms/:roomId/start', auth, (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Salon introuvable.' });
  if (room.ownerId !== req.user.id) return res.status(403).json({ error: 'Seul le host peut lancer.' });
  try {
    startGame(room);
    broadcastRoom(room);
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const user = findUserByToken(token);
  if (!user) return next(new Error('Unauthorized'));
  socket.user = user;
  return next();
});

io.on('connection', (socket) => {
  const user = socket.user;
  const existing = userSockets.get(user.id) || [];
  existing.push(socket);
  userSockets.set(user.id, existing);

  socket.emit('lobby:list', Array.from(rooms.values()).filter((r) => r.status === 'waiting').map(publicRoom));

  socket.on('room:watch', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.userId === user.id);
    if (!player) return;
    player.connected = true;
    socket.join(roomId);
    socket.emit('room:update', roomStateFor(room, user.id));
    broadcastRoom(room);
  });

  socket.on('game:uno', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;
    const player = room.players.find((p) => p.userId === user.id);
    if (!player) return;
    if (player.hand.length === 2) {
      player.saidUno = true;
      addLog(room, `${player.username} annonce UNO !`);
      broadcastRoom(room);
    }
  });

  socket.on('game:draw', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;
    const player = room.players.find((p) => p.userId === user.id);
    if (!player) return;
    const current = getCurrentPlayer(room);
    if (!current || current.userId !== user.id) return;

    const drawn = drawCards(room, player, 1);
    addLog(room, `${player.username} pioche ${drawn.length} carte.`);
    player.saidUno = false;
    advanceTurn(room, 1);
    broadcastRoom(room);
  });

  socket.on('game:play', ({ roomId, cardId, chosenColor }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;
    const player = room.players.find((p) => p.userId === user.id);
    if (!player) return;
    const current = getCurrentPlayer(room);
    if (!current || current.userId !== user.id) return;

    const cardIndex = player.hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) return;
    const card = player.hand[cardIndex];
    if (!cardPlayable(card, room)) return;

    player.hand.splice(cardIndex, 1);
    room.discardPile.push(card);
    room.currentColor = card.color === 'wild' ? chosenColor || 'red' : card.color;
    addLog(room, `${player.username} joue ${describeCard(card)}.`);

    applyCardEffect(room, player, card);

    if (checkWinner(room, player)) {
      broadcastRoom(room);
      return;
    }

    penalizeUnoIfNeeded(room, player);
    player.saidUno = false;
    advanceTurn(room, 1);
    broadcastRoom(room);
  });

  socket.on('disconnect', () => {
    const sockets = (userSockets.get(user.id) || []).filter((s) => s.id !== socket.id);
    if (sockets.length) {
      userSockets.set(user.id, sockets);
    } else {
      userSockets.delete(user.id);
      for (const room of rooms.values()) {
        const player = room.players.find((p) => p.userId === user.id);
        if (player) {
          player.connected = false;
          broadcastRoom(room);
        }
      }
    }
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`UNO Web lancé sur http://localhost:${PORT}`);
});
