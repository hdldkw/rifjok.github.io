const CONFIG = {
  // 1. Paste your Spotify Client ID here:
  CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID',

  // 2. Paste your Refresh Token here (click "🔑 Permanent Token" on your live site to copy it)
  // so SONGZ streams full tracks via your Premium account on ANY browser without logging in:
  REFRESH_TOKEN: '',

  // 3. Access Gate Passwords:
  PRIMARY_PASSWORD: '1121iamtuff',
  RECOVERY_PASSWORD: 'G',

  REDIRECT_URI: window.location.origin + window.location.pathname,
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-top-read',
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'user-library-modify'
  ].join(' '),
  API_BASE: 'https://api.spotify.com/v1'
};
