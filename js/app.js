document.addEventListener('DOMContentLoaded', async () => {
  AudioController.init();

  const authBtn = document.getElementById('auth-btn');
  const heroLoginBtn = document.getElementById('hero-login-btn');
  const heroSection = document.getElementById('hero-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const navTabs = document.getElementById('nav-tabs');
  const timeFilters = document.getElementById('time-filters');
  const sectionTitle = document.getElementById('section-title');
  const sectionSubtitle = document.getElementById('section-subtitle');
  const grid = document.getElementById('content-grid');

  let currentTab = 'tracks';
  let currentRange = 'short_term';

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  let token = SpotifyAuth.getToken();

  if (code) {
    token = await SpotifyAuth.exchangeCodeForToken(code);
  }

  if (token) {
    initDashboard();
  } else {
    authBtn.onclick = () => SpotifyAuth.login();
    heroLoginBtn.onclick = () => SpotifyAuth.login();
  }

  async function initDashboard() {
    heroSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    navTabs.classList.remove('hidden');
    authBtn.textContent = 'Sign Out';
    authBtn.onclick = () => SpotifyAuth.logout();

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

  async function loadView() {
    grid.innerHTML = '<p style="color: var(--text-secondary);">Loading Spotify data...</p>';

    if (currentTab === 'tracks') {
      timeFilters.classList.remove('hidden');
      sectionTitle.textContent = 'Top Rotation';
      sectionSubtitle.textContent = 'Click any track with a preview badge to play a 30s sample';
      const data = await SpotifyAPI.getTopTracks(currentRange);
      if (data?.items) UI.renderTracks(data.items, false);
    } else if (currentTab === 'artists') {
      timeFilters.classList.remove('hidden');
      sectionTitle.textContent = 'Top Artists';
      sectionSubtitle.textContent = 'Your most listened-to creators';
      const data = await SpotifyAPI.getTopArtists(currentRange);
      if (data?.items) UI.renderArtists(data.items);
    } else if (currentTab === 'recent') {
      timeFilters.classList.add('hidden');
      sectionTitle.textContent = 'Recently Played';
      sectionSubtitle.textContent = 'Your latest listening history';
      const data = await SpotifyAPI.getRecentlyPlayed();
      if (data?.items) UI.renderTracks(data.items, true);
    }
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTab = e.target.dataset.tab;
      loadView();
    });
  });

  // Time filter switching
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentRange = e.target.dataset.range;
      loadView();
    });
  });
});
