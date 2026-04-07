let lobbySocket;
let selectedRoomId = localStorage.getItem('uno_room_id') || '';
let currentRoom = null;

function roomCardTemplate(room) {
  return `
    <div class="room-item">
      <strong>${room.name}</strong>
      <div class="room-meta">
        <span class="chip">Code : ${room.code}</span>
        <span class="chip">Joueurs : ${room.playerCount}/${room.maxPlayers}</span>
        <span class="chip">Statut : ${room.status}</span>
      </div>
      <div class="actions-row">
        <button class="glass-btn" data-join-room="${room.id}">Rejoindre</button>
      </div>
    </div>
  `;
}

function playerLine(player, ownerId) {
  return `
    <div class="room-item">
      <strong>${player.username}</strong>
      <div class="room-meta">
        ${player.userId === ownerId ? '<span class="chip">Host</span>' : ''}
        <span class="chip">${player.connected ? 'En ligne' : 'Hors ligne'}</span>
        <span class="chip">Cartes : ${player.cardsCount}</span>
      </div>
    </div>
  `;
}

function updateSelectedRoom(room) {
  currentRoom = room;
  selectedRoomId = room?.id || '';
  if (selectedRoomId) localStorage.setItem('uno_room_id', selectedRoomId);

  const roomDetails = document.getElementById('roomDetails');
  const roomActions = document.getElementById('roomActions');
  if (!roomDetails || !roomActions) return;

  if (!room) {
    roomDetails.innerHTML = '<div class="centered-empty">Sélectionne ou crée un salon pour commencer.</div>';
    roomActions.innerHTML = '';
    return;
  }

  const me = API.getUser();
  roomDetails.innerHTML = `
    <h2 class="page-title" style="font-size:38px; margin-top:0;">${room.name}</h2>
    <p class="section-subtitle">Code salon : <strong>${room.code}</strong></p>
    <div class="room-list">
      ${room.players.map((player) => playerLine(player, room.ownerId)).join('')}
    </div>
  `;

  const amHost = me && me.id === room.ownerId;
  const waiting = room.status === 'waiting';
  roomActions.innerHTML = `
    <div class="actions-row">
      ${amHost && waiting ? '<button class="primary-btn" id="startGameBtn">Lancer la partie</button>' : ''}
      <button class="glass-btn" id="openGameBtn">${room.status === 'playing' ? 'Retour au jeu' : 'Salle de jeu'}</button>
      <button class="danger-btn" id="leaveRoomBtn">Quitter</button>
    </div>
  `;

  document.getElementById('startGameBtn')?.addEventListener('click', startGame);
  document.getElementById('openGameBtn')?.addEventListener('click', () => {
    window.location.href = '/game.html';
  });
  document.getElementById('leaveRoomBtn')?.addEventListener('click', leaveRoom);

  if (room.status === 'playing') {
    setTimeout(() => {
      window.location.href = '/game.html';
    }, 600);
  }
}

async function fetchRoom(roomId) {
  try {
    const room = await API.request(`/api/rooms/${roomId}`);
    updateSelectedRoom(room);
  } catch (error) {
    updateSelectedRoom(null);
  }
}

async function joinRoom(roomId) {
  try {
    await API.request(`/api/rooms/${roomId}/join`, { method: 'POST' });
    selectedRoomId = roomId;
    localStorage.setItem('uno_room_id', roomId);
    lobbySocket?.emit('room:watch', { roomId });
    await fetchRoom(roomId);
  } catch (error) {
    alert(error.message);
  }
}

async function leaveRoom() {
  if (!selectedRoomId) return;
  try {
    await API.request(`/api/rooms/${selectedRoomId}/leave`, { method: 'POST' });
    localStorage.removeItem('uno_room_id');
    selectedRoomId = '';
    updateSelectedRoom(null);
    await loadRooms();
  } catch (error) {
    alert(error.message);
  }
}

async function startGame() {
  try {
    await API.request(`/api/rooms/${selectedRoomId}/start`, { method: 'POST' });
    window.location.href = '/game.html';
  } catch (error) {
    alert(error.message);
  }
}

async function createRoom(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const msg = document.getElementById('createRoomMsg');
  msg.innerHTML = '';
  const data = new FormData(form);

  try {
    const room = await API.request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name: data.get('name'),
        maxPlayers: Number(data.get('maxPlayers')),
      }),
    });
    await joinRoom(room.id);
    msg.innerHTML = '<div class="success-box">Salon créé.</div>';
  } catch (error) {
    msg.innerHTML = `<div class="error-box">${error.message}</div>`;
  }
}

async function loadRooms() {
  const roomsBox = document.getElementById('roomsList');
  try {
    const rooms = await API.request('/api/rooms');
    if (!rooms.length) {
      roomsBox.innerHTML = '<div class="centered-empty">Aucun salon ouvert. Crée le premier !</div>';
    } else {
      roomsBox.innerHTML = rooms.map(roomCardTemplate).join('');
      roomsBox.querySelectorAll('[data-join-room]').forEach((btn) => {
        btn.addEventListener('click', () => joinRoom(btn.dataset.joinRoom));
      });
    }
  } catch (error) {
    roomsBox.innerHTML = `<div class="error-box">${error.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  protectPage();
  const user = API.getUser();
  document.getElementById('welcomeUser').textContent = user?.username || 'Joueur';
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('createRoomForm').addEventListener('submit', createRoom);

  if (window.location.hash === '#create') {
    document.getElementById('roomName').focus();
  }

  lobbySocket = io({ auth: { token: API.token } });
  lobbySocket.on('lobby:list', loadRooms);
  lobbySocket.on('room:update', (room) => {
    if (!selectedRoomId || room.id === selectedRoomId) {
      updateSelectedRoom(room);
    }
  });

  await loadRooms();
  if (selectedRoomId) {
    lobbySocket.emit('room:watch', { roomId: selectedRoomId });
    await fetchRoom(selectedRoomId);
  }
});
