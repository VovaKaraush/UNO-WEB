const API = {
  get token() {
    return localStorage.getItem('uno_token') || '';
  },

  setSession(data) {
    localStorage.setItem('uno_token', data.token);
    localStorage.setItem('uno_user', JSON.stringify(data.user));
  },

  clearSession() {
    localStorage.removeItem('uno_token');
    localStorage.removeItem('uno_user');
    localStorage.removeItem('uno_room_id');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('uno_user') || 'null');
    } catch {
      return null;
    }
  },

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }
    return data;
  },
};

function protectPage() {
  if (!API.token) {
    window.location.href = '/auth.html';
  }
}

function logout() {
  API.clearSession();
  window.location.href = '/';
}
