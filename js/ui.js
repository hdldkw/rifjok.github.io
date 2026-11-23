const UI = {
  renderTracks(tracks, isRecent = false) {
    const grid = document.getElementById('content-grid');
    grid.innerHTML = '';

    tracks.forEach((item, idx) => {
      const track = isRecent ? item.track : item;
      const cover = track.album.images[0]?.url || '';
      const artists = track.artists.map(a => a.name).join(', ');
      const hasPreview = Boolean(track.preview_url);

      const card = document.createElement('div');
      card.className = 'track-card';
      card.innerHTML = `
        <div class="cover-wrapper">
          <span class="rank-tag">#${idx + 1}</span>
          <img src="${cover}" alt="${track.name}" loading="lazy" />
          ${hasPreview ? `
            <div class="preview-overlay" title="Play 30s Preview">
              <div class="play-circle">▶</div>
            </div>
          ` : ''}
        </div>
        <div class="track-title" title="${track.name}">${track.name}</div>
        <div class="track-artist" title="${artists}">${artists}</div>
        <div class="card-footer">
          <span class="${hasPreview ? 'badge-preview' : 'badge-none'}">
            ${hasPreview ? '● Preview Available' : 'No Audio Sample'}
          </span>
          <a href="${track.external_urls.spotify}" target="_blank" class="ext-link">Spotify ↗</a>
        </div>
      `;

      if (hasPreview) {
        card.querySelector('.preview-overlay').addEventListener('click', () => {
          AudioController.playTrack(track);
        });
      }

      grid.appendChild(card);
    });
  },

  renderArtists(artists) {
    const grid = document.getElementById('content-grid');
    grid.innerHTML = '';

    artists.forEach((artist, idx) => {
      const img = artist.images[0]?.url || '';
      const genres = artist.genres.slice(0, 2).join(', ') || 'Artist';

      const card = document.createElement('div');
      card.className = 'track-card';
      card.innerHTML = `
        <div class="cover-wrapper artist-cover">
          <span class="rank-tag">#${idx + 1}</span>
          <img src="${img}" alt="${artist.name}" loading="lazy" />
        </div>
        <div class="track-title" style="text-align:center;" title="${artist.name}">${artist.name}</div>
        <div class="track-artist" style="text-align:center; text-transform:capitalize;">${genres}</div>
        <div class="card-footer">
          <span class="badge-preview">Popularity: ${artist.popularity}%</span>
          <a href="${artist.external_urls.spotify}" target="_blank" class="ext-link">Profile ↗</a>
        </div>
      `;
      grid.appendChild(card);
    });
  }
};
