const SpotifyAPI = {
  async request(endpoint) {
    const token = SpotifyAuth.getToken();
    const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      SpotifyAuth.logout();
      return null;
    }
    return res.json();
  },

  getProfile() {
    return this.request('/me');
  },

  getTopTracks(timeRange = 'short_term', limit = 24) {
    return this.request(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
  },

  getTopArtists(timeRange = 'short_term', limit = 24) {
    return this.request(`/me/top/artists?limit=${limit}&time_range=${timeRange}`);
  },

  getRecentlyPlayed(limit = 24) {
    return this.request(`/me/player/recently-played?limit=${limit}`);
  }
};
