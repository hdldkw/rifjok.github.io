const PremiumPlayer = {
  player: null,
  deviceId: null,
  isReady: false,
  isPaused: true,
  position: 0,
  duration: 0,
  progressTimer: null,
  currentQueue: [],
  currentIndex: 0,
  lastTrackUri: null,

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

        // Sync currentIndex with the active track in our queue
        if (currentTrack?.uri) {
          this.lastTrackUri = currentTrack.uri;
          const foundIdx = this.currentQueue.findIndex(t => t.uri === currentTrack.uri);
          if (foundIdx !== -1) this.currentIndex = foundIdx;
        }

        document.getElementById('player-bar').classList.remove('hidden');
        document.getElementById('player-cover').src = currentTrack.album.images[0]?.url || 'assets/logo.svg';
        document.getElementById('player-title').textContent = currentTrack.name;
        document.getElementById('player-artist').textContent = currentTrack.artists.map(a => a.name).join(', ');
        document.getElementById('play-pause-btn').textContent = this.isPaused ? '▶' : '❚❚';
        document.getElementById('duration-time').textContent = this.formatTime(this.duration);
        this.updateProgressUI();

        // Detect natural track end (paused at position 0 with empty next_tracks) and auto-advance
        if (
          state.paused &&
          state.position === 0 &&
          state.track_window.next_tracks.length === 0 &&
          this.currentQueue.length > 1 &&
          this.currentIndex + 1 < this.currentQueue.length
        ) {
          this.skipNext();
        }
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
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const volumeSlider = document.getElementById('volume-slider');
    const closeBtn = document.getElementById('close-player-btn');

    playPauseBtn.addEventListener('click', () => {
      if (this.player) this.player.togglePlay();
    });

    prevBtn.addEventListener('click', () => this.skipPrevious());
    nextBtn.addEventListener('click', () => this.skipNext());

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

  async playQueue(tracks, startIndex = 0) {
    const playableTracks = tracks.filter(t => t && t.uri && t.uri.startsWith('spotify:track:'));
    if (!playableTracks.length) return;

    if (!this.isReady || !this.deviceId) {
      alert('Spotify Web Player is still connecting. Wait 2 seconds or sign out and log back in once to grant streaming permissions.');
      return;
    }

    this.currentQueue = playableTracks;
    this.currentIndex = Math.max(0, Math.min(startIndex, playableTracks.length - 1));
    const track = this.currentQueue[this.currentIndex];

    await this.player.activateElement();

    document.getElementById('player-bar').classList.remove('hidden');
    document.getElementById('player-cover').src = track.album?.images?.[0]?.url || 'assets/logo.svg';
    document.getElementById('player-title').textContent = track.name;
    document.getElementById('player-artist').textContent = track.artists.map(a => a.name).join(', ');
    document.getElementById('play-pause-btn').textContent = '❚❚';

    const uris = this.currentQueue.map(t => t.uri);
    await SpotifyAPI.startSDKPlayback(this.deviceId, uris, this.currentIndex);
  },

  async skipNext() {
    if (!this.currentQueue.length) {
      if (this.player) await this.player.nextTrack();
      return;
    }
    const nextIdx = (this.currentIndex + 1) % this.currentQueue.length;
    await this.playQueue(this.currentQueue, nextIdx);
  },

  async skipPrevious() {
    if (this.position > 4000 && this.player) {
      await this.player.seek(0);
      this.position = 0;
      this.updateProgressUI();
      return;
    }
    if (!this.currentQueue.length) {
      if (this.player) await this.player.previousTrack();
      return;
    }
    const prevIdx = (this.currentIndex - 1 + this.currentQueue.length) % this.currentQueue.length;
    await this.playQueue(this.currentQueue, prevIdx);
  }
};
