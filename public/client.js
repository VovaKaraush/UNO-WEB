const socket = io();

let currentPlayer = null;
let currentLobby = null;

// ─── Elements du DOM ─────────────────────────────────
const createBtn = document.querySelector('.create-btn');
const codeBtn = document.querySelector('.private .join-btn');
const readyBtn = document.querySelector('.mini-room .join-btn');
const nameInput = document.getElementById('room-name');
const playerNumberSelect = document.getElementById('player-number');
const roomPreview = document.getElementById('room-preview');

// ─── Récupérer l'utilisateur depuis localStorage ─────
try {
  const userJson = localStorage.getItem('user');
  if (userJson) currentPlayer = JSON.parse(userJson);
} catch (error) {
  console.error('Erreur de parsing user:', error);
}

// ─── Générateur de code ─────────────────────────────
function generateLobbyCode(length = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ─── Création de lobby ──────────────────────────────
if (createBtn) {
  createBtn.addEventListener('click', () => {
    const lobbyName = nameInput?.value?.trim();
    const playerNum = parseInt(playerNumberSelect?.value) || 2;

    if (!lobbyName) { alert('Entrez un nom de lobby'); return; }

    const lobbyCode = generateLobbyCode();
    socket.emit('createLobby', {
      name: lobbyName,
      code: lobbyCode,
      maxPlayers: playerNum,
      hostName: currentPlayer?.username || 'Joueur'
    });
  });
}

// ─── Rejoindre avec code ───────────────────────────
if (codeBtn) {
  codeBtn.addEventListener('click', () => {
    const code = prompt('Entrez le code du lobby :');
    if (code && code.trim()) {
      socket.emit('joinLobbyByCode', {
        code: code.trim().toUpperCase(),
        playerName: currentPlayer?.username || 'Joueur'
      });
    }
  });
}

// ─── Bouton Prêt ───────────────────────────────────
if (readyBtn) {
  readyBtn.addEventListener('click', () => {
    if (currentLobby?.code) {
      socket.emit('playerReady', { lobbyCode: currentLobby.code });
    }
  });
}

// ─── Événements Socket.io ──────────────────────────

socket.on('lobbyCreated', (lobby) => {
  currentLobby = lobby;
  updateLobbyUI(lobby);
  alert(`Lobby créé ! Code : ${lobby.code}`);
});

socket.on('joinedLobby', (lobby) => {
  currentLobby = lobby;
  updateLobbyUI(lobby);
  alert(`Vous avez rejoint le lobby !`);
});

socket.on('lobbyUpdated', (lobby) => {
  currentLobby = lobby;
  updateLobbyUI(lobby);
});

// ← Clé du fix : c'est le serveur qui dit quand rediriger,
//   et on sauvegarde le gameRoomId pour que Game.html puisse rejoindre la room.
socket.on('gameStarted', ({ gameRoomId, playerNames }) => {
  localStorage.setItem('gameRoomId', gameRoomId);
  localStorage.setItem('playerNames', JSON.stringify(playerNames));
  window.location.href = '/Game/Game.html';
});

socket.on('lobbyError', (message) => {
  alert(`Erreur: ${message}`);
});

// ─── Mise à jour de l'UI ───────────────────────────
function updateLobbyUI(lobby) {
  if (!lobby) return;

  if (roomPreview) roomPreview.textContent = lobby.name;

  const count = lobby.players?.length || 0;
  const max   = lobby.maxPlayers || 2;

  const miniRoomSpan = document.querySelector('.mini-room span');
  if (miniRoomSpan) miniRoomSpan.textContent = `${count}/${max} joueurs • Classique`;
}

// ─── Code privé ──────────────────────────────────
const ghostBtn = document.querySelector('.ghost-btn');
if (ghostBtn) {
  ghostBtn.addEventListener('click', () => {
    if (currentLobby?.code) prompt('Code du lobby privé (à partager) :', currentLobby.code);
    else alert('Créez d\'abord un lobby');
  });
}
