const SpotifyAPI = {
  async request(endpoint, options = {}) {
    let token = await SpotifyAuth.getValidToken();
    if (!token) return null;

    searchCatalog(query, limit = 30) {
    const encoded = encodeURIComponent(query);
    return this.request(`/search?q=${encoded}&type=track&limit=${limit}`);
  },

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

    if (!res.ok) {
      console.warn(`Spotify API ${res.status} on ${endpoint}`);
      return null;
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return true;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : true;
  },

  getProfile() {
    return this.request('/me');
  },

  getTopTracks(timeRange = 'short_term', limit = 30) {
    return this.request(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
  },

  getLikedSongs(limit = 50) {
    return this.request(`/me/tracks?limit=${limit}`);
  },

  getTopArtists(timeRange = 'short_term', limit = 24) {
    return this.request(`/me/top/artists?limit=${limit}&time_range=${timeRange}`);
  },

  getRecentlyPlayed(limit = 30) {
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

  // Supports both newer /items and /tracks playlist endpoints with full pagination
  async getAllPlaylistTracks(playlistId) {
    let allItems = [];
    let token = await SpotifyAuth.getValidToken();
    if (!token) return allItems;

    let nextUrl = `${CONFIG.API_BASE}/playlists/${playlistId}/items?limit=100`;
    let firstRes = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Fallback to /tracks if /items returns 404/400
    if (!firstRes.ok) {
      nextUrl = `${CONFIG.API_BASE}/playlists/${playlistId}/tracks?limit=100`;
      firstRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    if (!firstRes.ok) {
      // Final fallback: fetch full playlist object directly
      const plData = await this.request(`/playlists/${playlistId}`);
      const raw = plData?.items?.items || plData?.tracks?.items || [];
      return raw;
    }

    const firstData = await firstRes.json();
    if (firstData.items) allItems = allItems.concat(firstData.items);
    nextUrl = firstData.next;

    while (nextUrl && allItems.length < 300) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.items) allItems = allItems.concat(data.items);
      nextUrl = data.next;
    }
    return allItems;
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

  // Sends the full track list as a queue starting at startIndex so songs auto-play back-to-back!
  async startSDKPlayback(deviceId, uris, offsetIndex = 0) {
    const token = await SpotifyAuth.getValidToken();
    return fetch(`${CONFIG.API_BASE}/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: uris,
        offset: { position: offsetIndex }
      })
    });
  }
};
