const AudioController = {
  init() {
    this.playerBar = document.getElementById('player-bar');
    this.audio = document.getElementById('audio-player');
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.cover = document.getElementById('player-cover');
    this.title = document.getElementById('player-title');
    this.artist = document.getElementById('player-artist');
    this.spotifyLink = document.getElementById('player-spotify-link');
    this.progressBar = document.getElementById('progress-bar');
    this.progressFill = document.getElementById('progress-fill');
    this.currentTimeEl = document.getElementById('current-time');

    this.playPauseBtn.addEventListener('click', () => this.togglePlay());
    
    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio.duration) return;
      const pct = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressFill.style.width = `${pct}%`;
      const secs = Math.floor(this.audio.currentTime);
      this.currentTimeEl.textContent = `0:${secs < 10 ? '0' : ''}${secs}`;
    });

    this.audio.addEventListener('ended', () => {
      this.playPauseBtn.textContent = '▶';
      this.progressFill.style.width = '0%';
    });

    this.progressBar.addEventListener('click', (e) => {
      if (!this.audio.duration) return;
      const rect = this.progressBar.getBoundingClientRect();
      const clickPct = (e.clientX - rect.left) / rect.width;
      this.audio.currentTime = clickPct * this.audio.duration;
    });
  },

  playTrack(track) {
    const coverUrl = track.album.images[0]?.url || '';
    const artistNames = track.artists.map(a => a.name).join(', ');

    this.playerBar.classList.remove('hidden');
    this.cover.src = coverUrl;
    this.title.textContent = track.name;
    this.artist.textContent = artistNames;
    this.spotifyLink.href = track.external_urls.spotify;

    this.audio.src = track.preview_url;
    this.audio.play();
    this.playPauseBtn.textContent = '❚❚';
  },

  togglePlay() {
    if (this.audio.paused) {
      this.audio.play();
      this.playPauseBtn.textContent = '❚❚';
    } else {
      this.audio.pause();
      this.playPauseBtn.textContent = '▶';
    }
  }
};
