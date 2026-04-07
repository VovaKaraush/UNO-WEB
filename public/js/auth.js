document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMsg = document.getElementById('loginMsg');
  const registerMsg = document.getElementById('registerMsg');
  const logoutBtn = document.getElementById('logoutBtn');
  const currentUserBox = document.getElementById('currentUserBox');

  const currentUser = API.getUser();
  if (currentUser && currentUserBox) {
    currentUserBox.innerHTML = `<div class="success-box">Connecté en tant que <strong>${currentUser.username}</strong>.</div>`;
  }

  logoutBtn?.addEventListener('click', logout);

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginMsg.innerHTML = '';

    const formData = new FormData(loginForm);
    const payload = {
      username: formData.get('username'),
      password: formData.get('password'),
    };

    try {
      const data = await API.request('/api/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      API.setSession(data);
      loginMsg.innerHTML = '<div class="success-box">Connexion réussie, redirection...</div>';
      setTimeout(() => {
        window.location.href = '/lobby.html';
      }, 700);
    } catch (error) {
      loginMsg.innerHTML = `<div class="error-box">${error.message}</div>`;
    }
  });

  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    registerMsg.innerHTML = '';

    const formData = new FormData(registerForm);
    const payload = {
      username: formData.get('username'),
      password: formData.get('password'),
    };

    try {
      const data = await API.request('/api/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      API.setSession(data);
      registerMsg.innerHTML = '<div class="success-box">Compte créé, redirection...</div>';
      setTimeout(() => {
        window.location.href = '/lobby.html';
      }, 700);
    } catch (error) {
      registerMsg.innerHTML = `<div class="error-box">${error.message}</div>`;
    }
  });
});
