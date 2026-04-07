document.addEventListener('DOMContentLoaded', () => {
  const user = API.getUser();
  const playerName = document.getElementById('playerName');
  if (playerName && user) playerName.textContent = user.username;

  const quickGameCard = document.getElementById('quickGameCard');
  const privateGameCard = document.getElementById('privateGameCard');
  const browseLobbiesBtn = document.getElementById('browseLobbiesBtn');
  const rulesBtn = document.getElementById('rulesBtn');
  const authBtn = document.getElementById('authBtn');

  if (authBtn) {
    authBtn.textContent = user ? 'Lobby' : 'Se connecter';
    authBtn.addEventListener('click', () => {
      window.location.href = user ? '/lobby.html' : '/auth.html';
    });
  }

  quickGameCard?.addEventListener('click', async () => {
    if (!API.token) {
      window.location.href = '/auth.html';
      return;
    }

    try {
      const rooms = await API.request('/api/rooms');
      const freeRoom = rooms.find((room) => room.playerCount < room.maxPlayers);
      let targetRoom = freeRoom;

      if (!targetRoom) {
        targetRoom = await API.request('/api/rooms', {
          method: 'POST',
          body: JSON.stringify({ name: 'Jeu rapide', maxPlayers: 4 }),
        });
      }

      await API.request(`/api/rooms/${targetRoom.id}/join`, { method: 'POST' });
      localStorage.setItem('uno_room_id', targetRoom.id);
      window.location.href = '/lobby.html';
    } catch (error) {
      alert(error.message);
    }
  });

  privateGameCard?.addEventListener('click', () => {
    if (!API.token) {
      window.location.href = '/auth.html';
      return;
    }
    window.location.href = '/lobby.html#create';
  });

  browseLobbiesBtn?.addEventListener('click', () => {
    window.location.href = API.token ? '/lobby.html' : '/auth.html';
  });

  rulesBtn?.addEventListener('click', () => {
    document.getElementById('rulesModal')?.classList.add('open');
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.modal')?.classList.remove('open'));
  });
});
