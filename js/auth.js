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
      localStorage.setItem('spotify_access_token', data.access_token);
      window.history.replaceState({}, document.title, CONFIG.REDIRECT_URI);
      return data.access_token;
    }
    return null;
  },

  getToken() {
    return localStorage.getItem('spotify_access_token');
  },

  logout() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('pkce_code_verifier');
    window.location.reload();
  }
};
