document.addEventListener('DOMContentLoaded', async () => {
  AccessGate.init();

  const authBtn = document.getElementById('auth-btn');
  const heroLoginBtn = document.getElementById('hero-login-btn');
  const heroSection = document.getElementById('hero-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const navTabs = document.getElementById('nav-tabs');
  const timeFilters = document.getElementById('time-filters');
  const backPlaylistsBtn = document.getElementById('back-playlists-btn');
  const sectionTitle = document.getElementById('section-title');
  const sectionSubtitle = document.getElementById('section-subtitle');
  const grid = document.getElementById('content-grid');

  const tokenModal = document.getElementById('token-modal');
  const copyTokenBtn = document.getElementById('copy-token-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const refreshTokenDisplay = document.getElementById('refresh-token-display');
  const copyRefreshBtn = document.getElementById('copy-refresh-btn');

  let currentTab = 'tracks';
  let currentRange = 'short_term';

  const handleConnectClick = () => {
    if (AccessGate.isUnlocked()) {
      SpotifyAuth.login();
    } else {
      AccessGate.open(() => {
        bootSession();
      });
    }
  };

  authBtn.onclick = handleConnectClick;
  heroLoginBtn.onclick = handleConnectClick;

  async function bootSession() {
    if (!AccessGate.isUnlocked()) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    let token = null;

    if (code) {
      token = await SpotifyAuth.exchangeCodeForToken(code);
    } else {
      token = await SpotifyAuth.getValidToken();
    }

    if (token) {
      initDashboard();
    } else {
      SpotifyAuth.login();
    }
  }

  if (AccessGate.isUnlocked()) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    let token = code
      ? await SpotifyAuth.exchangeCodeForToken(code)
      : await SpotifyAuth.getValidToken();

    if (token) {
      initDashboard();
    }
  }

  async function initDashboard() {
    heroSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    navTabs.classList.remove('hidden');
    authBtn.textContent = 'Sign Out';
    authBtn.onclick = () => SpotifyAuth.logout();

    PremiumPlayer.initSDK();

    const user = await SpotifyAPI.getProfile();
    if (user) {
      document.getElementById('user-name').textContent = user.display_name || 'Listener';
      if (user.images?.length > 0) {
        document.getElementById('user-avatar').src = user.images[0].url;
      } else {
        document.getElementById('user-avatar').style.display = 'none';
      }
      document.getElementById('user-badge').classList.remove('hidden');
    }

    loadView();
  }

  async function openPlaylist(playlist) {
    timeFilters.classList.add('hidden');
    backPlaylistsBtn.classList.remove('hidden');
    const totalCount = playlist.items?.total ?? playlist.tracks?.total ?? 0;
    sectionTitle.textContent = playlist.name;
    sectionSubtitle.textContent = `Playlist by ${playlist.owner?.display_name || 'Spotify'} • ${totalCount} tracks`;
    grid.innerHTML = '<p style="color: var(--text-secondary);">Loading all playlist songs...</p>';

    const items = await SpotifyAPI.getAllPlaylistTracks(playlist.id);
    UI.renderTracks(items, true, false);
  }

  async function loadView() {
    backPlaylistsBtn.classList.add('hidden');
    grid.innerHTML = '<p style="color: var(--text-secondary);">Loading Spotify data...</p>';

    if (currentTab === 'tracks') {
      timeFilters.classList.remove('hidden');
      sectionTitle.textContent = 'Top Rotation';
      sectionSubtitle.textContent = 'Click ♥ to save/remove from Liked Songs • Click any song to start continuous playback';
      const data = await SpotifyAPI.getTopTracks(currentRange);
      if (data?.items) UI.renderTracks(data.items, false, false);
    } else if (currentTab === 'liked') {
      timeFilters.classList.add('hidden');
      sectionTitle.textContent = 'Liked Songs';
      sectionSubtitle.textContent = 'Your saved library tracks';
      const data = await SpotifyAPI.getLikedSongs();
      if (data?.items) UI.renderTracks(data.items, true, true);
    } else if (currentTab === 'artists') {
      timeFilters.classList.remove('hidden');
      sectionTitle.textContent = 'Top Artists';
      sectionSubtitle.textContent = 'Your most listened-to creators';
      const data = await SpotifyAPI.getTopArtists(currentRange);
      if (data?.items) UI.renderArtists(data.items);
    } else if (currentTab === 'playlists') {
      timeFilters.classList.add('hidden');
      sectionTitle.textContent = 'All Playlists';
      sectionSubtitle.textContent = 'All your created and saved playlists';
      const playlists = await SpotifyAPI.getAllUserPlaylists();
      sectionTitle.textContent = `All Playlists (${playlists.length})`;
      UI.renderPlaylists(playlists, openPlaylist);
    } else if (currentTab === 'recent') {
      timeFilters.classList.add('hidden');
      sectionTitle.textContent = 'Recently Played';
      sectionSubtitle.textContent = 'Your latest listening history';
      const data = await SpotifyAPI.getRecentlyPlayed();
      if (data?.items) UI.renderTracks(data.items, true, false);
    }
  }

  copyTokenBtn.addEventListener('click', () => {
    refreshTokenDisplay.value = SpotifyAuth.getRefreshToken() || 'Sign out and log back in once to generate a refresh token.';
    tokenModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    tokenModal.classList.add('hidden');
  });

  copyRefreshBtn.addEventListener('click', () => {
    refreshTokenDisplay.select();
    navigator.clipboard.writeText(refreshTokenDisplay.value);
    copyRefreshBtn.textContent = 'Copied!';
    setTimeout(() => (copyRefreshBtn.textContent = 'Copy'), 2000);
  });

  backPlaylistsBtn.addEventListener('click', () => loadView());

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTab = e.target.dataset.tab;
      loadView();
    });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentRange = e.target.dataset.range;
      loadView();
    });
  });
});
