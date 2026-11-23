const SpotifyAuth = {
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + chars[x % chars.length], '');
  },

  async sha256(plain) {
    const data = new TextEncoder().encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  },

  base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  },

  async login() {
    if (AccessGate.isPermaBanned()) {
      AccessGate.open();
      return;
    }

    if (!AccessGate.isUnlocked()) {
      AccessGate.open(() => this.login());
      return;
    }

    if (CONFIG.CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
      alert('Please open js/config.js and paste your Spotify Client ID first!');
      return;
    }

    const codeVerifier = this.generateRandomString(64);
    const hashed = await this.sha256(codeVerifier);
    const codeChallenge = this.base64encode(hashed);

    localStorage.setItem('pkce_code_verifier', codeVerifier);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.search = new URLSearchParams({
      response_type: 'code',
      client_id: CONFIG.CLIENT_ID,
      scope: CONFIG.SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: CONFIG.REDIRECT_URI,
    }).toString();

    window.location.href = authUrl.toString();
  },

  async exchangeCodeForToken(code) {
    if (AccessGate.isPermaBanned() || !AccessGate.isUnlocked()) return null;

    const codeVerifier = localStorage.getItem('pkce_code_verifier');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CONFIG.CLIENT_ID,
        grant_type: 'authorization_code',
        code,
        redirect_uri: CONFIG.REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      this.saveTokens(data);
      window.history.replaceState({}, document.title, CONFIG.REDIRECT_URI);
      return data.access_token;
    }
    return null;
  },

  async refreshAccessToken() {
    if (AccessGate.isPermaBanned() || !AccessGate.isUnlocked()) return null;

    const refreshToken = CONFIG.REFRESH_TOKEN || localStorage.getItem('spotify_refresh_token');
    if (!refreshToken || CONFIG.CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') return null;

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CONFIG.CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();
    if (data.access_token) {
      this.saveTokens(data);
      return data.access_token;
    }
    return null;
  },

  saveTokens(data) {
    localStorage.setItem('spotify_access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }
    if (data.expires_in) {
      localStorage.setItem('spotify_token_expires', Date.now() + data.expires_in * 1000);
    }
  },

  async getValidToken() {
    if (AccessGate.isPermaBanned() || !AccessGate.isUnlocked()) return null;

    const token = localStorage.getItem('spotify_access_token');
    const expires = Number(localStorage.getItem('spotify_token_expires') || 0);

    if (token && Date.now() < expires - 60000) {
      return token;
    }
    return await this.refreshAccessToken();
  },

  getRefreshToken() {
    return CONFIG.REFRESH_TOKEN || localStorage.getItem('spotify_refresh_token') || '';
  },

  logout() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expires');
    localStorage.removeItem('pkce_code_verifier');
    localStorage.removeItem('songz_gate_unlocked');
    window.location.reload();
  }
};
