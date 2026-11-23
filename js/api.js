const SpotifyAPI = {
  async request(endpoint, options = {}) {
    let token = await SpotifyAuth.getValidToken();
    if (!token) return null;

    const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    if (res.status === 401) {
      token = await SpotifyAuth.refreshAccessToken();
      if (!token) return null;
      return this.request(endpoint, options);
    }

    if (res.status === 204 || (res.status === 200 && res.headers.get('content-length') === '0')) {
      return true;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : true;
  },

  getProfile() {
    return this.request('/me');
  },

  getTopTracks(timeRange = 'short_term', limit = 24) {
    return this.request(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
  },

  getLikedSongs(limit = 50) {
    return this.request(`/me/tracks?limit=${limit}`);
  },

  getTopArtists(timeRange = 'short_term', limit = 24) {
    return this.request(`/me/top/artists?limit=${limit}&time_range=${timeRange}`);
  },

  getRecentlyPlayed(limit = 24) {
    return this.request(`/me/player/recently-played?limit=${limit}`);
  },

  async getAllUserPlaylists() {
    let allPlaylists = [];
    let nextUrl = `${CONFIG.API_BASE}/me/playlists?limit=50`;
    let token = await SpotifyAuth.getValidToken();

    while (nextUrl && token) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.items) allPlaylists = allPlaylists.concat(data.items);
      nextUrl = data.next;
    }
    return allPlaylists;
  },

  async getAllPlaylistTracks(playlistId) {
    let allTracks = [];
    let nextUrl = `${CONFIG.API_BASE}/playlists/${playlistId}/tracks?limit=100`;
    let token = await SpotifyAuth.getValidToken();

    while (nextUrl && token && allTracks.length < 200) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.items) allTracks = allTracks.concat(data.items);
      nextUrl = data.next;
    }
    return allTracks;
  },

  checkLikedTracks(trackIds) {
    if (!trackIds.length) return Promise.resolve([]);
    return this.request(`/me/tracks/contains?ids=${trackIds.slice(0, 50).join(',')}`);
  },

  saveTrack(trackId) {
    return this.request(`/me/tracks?ids=${trackId}`, { method: 'PUT' });
  },

  removeTrack(trackId) {
    return this.request(`/me/tracks?ids=${trackId}`, { method: 'DELETE' });
  },

  async startSDKPlayback(deviceId, trackUri) {
    const token = await SpotifyAuth.getValidToken();
    return fetch(`${CONFIG.API_BASE}/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [trackUri] })
    });
  }
};
