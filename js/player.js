const PremiumPlayer = {
  player: null,
  deviceId: null,
  isReady: false,
  isPaused: true,
  position: 0,
  duration: 0,
  progressTimer: null,

  initSDK() {
    const sdkBadge = document.getElementById('sdk-status');
    sdkBadge.classList.remove('hidden');

    const setupPlayer = () => {
      this.player = new Spotify.Player({
        name: 'SONGZ Web Player',
        getOAuthToken: async (cb) => {
          const token = await SpotifyAuth.getValidToken();
          cb(token);
        },
        volume: 0.8
      });

      this.player.addListener('ready', ({ device_id }) => {
        this.deviceId = device_id;
        this.isReady = true;
        sdkBadge.textContent = '● Premium Player Ready';
        sdkBadge.classList.add('ready');
      });

      this.player.addListener('not_ready', () => {
        this.isReady = false;
        sdkBadge.textContent = '● Player Offline';
        sdkBadge.classList.remove('ready');
      });

      this.player.addListener('authentication_error', ({ message }) => {
        sdkBadge.textContent = '● Re-login Needed for SDK';
        console.error('SDK Auth Error:', message);
      });

      this.player.addListener('account_error', ({ message }) => {
        sdkBadge.textContent = '● Spotify Premium Required';
        console.error('SDK Account Error:', message);
      });

      this.player.addListener('player_state_changed', (state) => {
        if (!state) return;
        const currentTrack = state.track_window.current_track;
        this.isPaused = state.paused;
        this.position = state.position;
        this.duration = state.duration;

        document.getElementById('player-bar').classList.remove('hidden');
        document.getElementById('player-cover').src = currentTrack.album.images[0]?.url || 'assets/logo.svg';
        document.getElementById('player-title').textContent = currentTrack.name;
        document.getElementById('player-artist').textContent = currentTrack.artists.map(a => a.name).join(', ');
        document.getElementById('play-pause-btn').textContent = this.isPaused ? '▶' : '❚❚';
        document.getElementById('duration-time').textContent = this.formatTime(this.duration);
        this.updateProgressUI();
      });

      this.player.connect();
    };

    if (window.Spotify) {
      setupPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = setupPlayer;
    }

    this.bindUIControls();
  },

  bindUIControls() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const closeBtn = document.getElementById('close-player-btn');

    playPauseBtn.addEventListener('click', () => {
      if (this.player) this.player.togglePlay();
    });

    progressBar.addEventListener('click', (e) => {
      if (!this.player || !this.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const clickPct = (e.clientX - rect.left) / rect.width;
      const seekMs = Math.floor(clickPct * this.duration);
      this.player.seek(seekMs);
      this.position = seekMs;
      this.updateProgressUI();
    });

    volumeSlider.addEventListener('input', (e) => {
      if (this.player) this.player.setVolume(parseFloat(e.target.value));
    });

    closeBtn.addEventListener('click', () => {
      if (this.player) this.player.pause();
      document.getElementById('player-bar').classList.add('hidden');
    });

    this.progressTimer = setInterval(() => {
      if (!this.isPaused && this.duration > 0) {
        this.position = Math.min(this.position + 500, this.duration);
        this.updateProgressUI();
      }
    }, 500);
  },

  updateProgressUI() {
    if (!this.duration) return;
    const pct = (this.position / this.duration) * 100;
    document.getElementById('progress-fill').style.width = `${pct}%`;
    document.getElementById('current-time').textContent = this.formatTime(this.position);
  },

  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  },

  async playTrack(track) {
    if (!track || !track.uri) return;
    if (!this.isReady || !this.deviceId) {
      alert('Spotify Web Player is still connecting. Wait 2 seconds or sign out and log back in once to grant streaming permissions.');
      return;
    }

    await this.player.activateElement();

    document.getElementById('player-bar').classList.remove('hidden');
    document.getElementById('player-cover').src = track.album.images[0]?.url || 'assets/logo.svg';
    document.getElementById('player-title').textContent = track.name;
    document.getElementById('player-artist').textContent = track.artists.map(a => a.name).join(', ');
    document.getElementById('play-pause-btn').textContent = '❚❚';

    await SpotifyAPI.startSDKPlayback(this.deviceId, track.uri);
  }
};
