const socket = io();

let currentPlayer = null;
let currentLobby = null;
let playerCount = 0;

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
  if (userJson) {
    currentPlayer = JSON.parse(userJson);
  }
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

    if (!lobbyName) {
      alert('Entrez un nom de lobby');
      return;
    }

    const lobbyCode = generateLobbyCode();

    // Émettre l'événement de création vers le serveur
    socket.emit('createLobby', {
      name: lobbyName,
      code: lobbyCode,
      maxPlayers: playerNum,
      hostId: socket.id,
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
        playerId: socket.id,
        playerName: currentPlayer?.username || 'Joueur'
      });
    }
  });
}

// ─── Bouton Prêt ───────────────────────────────────
if (readyBtn) {
  readyBtn.addEventListener('click', () => {
    if (currentLobby?.code) {
      socket.emit('playerReady', {
        lobbyCode: currentLobby.code
      });
    }
  });
}

// ─── Événements Socket.io ──────────────────────────

// Confirmation de création de lobby
socket.on('lobbyCreated', (lobby) => {
  currentLobby = lobby;
  updateLobbyUI(lobby);
  alert(`Lobby créé ! Code: ${lobby.code}`);
});

// Confirmation de participation
socket.on('joinedLobby', (lobby) => {
  currentLobby = lobby;
  updateLobbyUI(lobby);
  alert(`Vous avez rejoint le lobby !`);
});

// Mise à jour en temps réel du lobby
socket.on('lobbyUpdated', (lobby) => {
  currentLobby = lobby;
  updateLobbyUI(lobby);
  
  // Si le lobby est plein, rediriger vers Game.html
  if (lobby.players.length >= lobby.maxPlayers) {
    console.log('Lobby plein, redirection vers le jeu dans 2 secondes...');
    readyBtn.disabled = true;
    readyBtn.textContent = 'Démarrage...';
    setTimeout(() => {
      window.location.href = '/Game/Game.html';
    }, 2000);
  }
});

// Erreur lors de la tentative de rejoindre
socket.on('lobbyError', (message) => {
  alert(`Erreur: ${message}`);
});

// ─── Fonction de mise à jour de l'UI ───────────────
function updateLobbyUI(lobby) {
  if (!lobby) return;

  // Mettre à jour l'aperçu du salon
  if (roomPreview) {
    roomPreview.textContent = lobby.name;
  }

  // Afficher les joueurs
  const playerCount = lobby.players?.length || 0;
  const maxPlayers = lobby.maxPlayers || 2;
  
  console.log(`Joueurs: ${playerCount}/${maxPlayers}`);
  console.log(`Joueurs actuels:`, lobby.players.map(p => p.name).join(', '));
  
  // Mettre à jour le texte du mini-room
  const miniRoomSpan = document.querySelector('.mini-room span');
  if (miniRoomSpan) {
    miniRoomSpan.textContent = `${playerCount}/${maxPlayers} joueurs • Classique`;
  }
}

// ─── Affichage du code privé ─────────────────────
const ghostBtn = document.querySelector('.ghost-btn');
if (ghostBtn) {
  ghostBtn.addEventListener('click', () => {
    if (currentLobby?.code) {
      prompt(`Code du lobby privé (à partager):`, currentLobby.code);
    } else {
      alert('Créez d\'abord un lobby');
    }
  });
}