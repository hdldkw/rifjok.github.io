const UI = {
  async renderTracks(tracks, isWrapped = false, forceAllLiked = false) {
    const grid = document.getElementById('content-grid');
    grid.innerHTML = '';

    const normalizedTracks = tracks
      .map(item => (isWrapped ? item.track : item))
      .filter(t => t && t.album && t.id);

    let likedMap = {};
    if (forceAllLiked) {
      normalizedTracks.forEach(t => (likedMap[t.id] = true));
    } else {
      for (let i = 0; i < normalizedTracks.length; i += 50) {
        const batch = normalizedTracks.slice(i, i + 50);
        const statuses = await SpotifyAPI.checkLikedTracks(batch.map(t => t.id));
        if (Array.isArray(statuses)) {
          batch.forEach((t, idx) => (likedMap[t.id] = statuses[idx]));
        }
      }
    }

    normalizedTracks.forEach((track, idx) => {
      const cover = track.album.images[0]?.url || 'assets/logo.svg';
      const artists = track.artists.map(a => a.name).join(', ');
      const isLiked = Boolean(likedMap[track.id]);

      const card = document.createElement('div');
      card.className = 'track-card';
      card.innerHTML = `
        <div class="cover-wrapper">
          <span class="rank-tag">#${idx + 1}</span>
          <button class="like-btn ${isLiked ? 'liked' : ''}" title="${isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}">
            ${isLiked ? '♥' : '♡'}
          </button>
          <img src="${cover}" alt="${track.name}" loading="lazy" />
          <div class="preview-overlay" title="Play Full Song">
            <div class="play-circle">▶</div>
          </div>
        </div>
        <div class="track-title" title="${track.name}">${track.name}</div>
        <div class="track-artist" title="${artists}">${artists}</div>
        <div class="card-footer">
          <span class="badge-preview">▶ Stream Full Song</span>
          <a href="${track.external_urls.spotify}" target="_blank" class="ext-link" onclick="event.stopPropagation()">Spotify ↗</a>
        </div>
      `;

      const likeBtn = card.querySelector('.like-btn');
      likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const currentlyLiked = likeBtn.classList.contains('liked');
        if (currentlyLiked) {
          likeBtn.classList.remove('liked');
          likeBtn.textContent = '♡';
          await SpotifyAPI.removeTrack(track.id);
        } else {
          likeBtn.classList.add('liked');
          likeBtn.textContent = '♥';
          await SpotifyAPI.saveTrack(track.id);
        }
      });

      card.addEventListener('click', () => {
        PremiumPlayer.playTrack(track);
      });

      grid.appendChild(card);
    });
  },

  renderArtists(artists) {
    const grid = document.getElementById('content-grid');
    grid.innerHTML = '';

    artists.forEach((artist, idx) => {
      const img = artist.images[0]?.url || 'assets/logo.svg';
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
  },

  renderPlaylists(playlists, onSelectPlaylist) {
    const grid = document.getElementById('content-grid');
    grid.innerHTML = '';

    playlists.forEach((playlist) => {
      if (!playlist) return;
      const img = playlist.images?.[0]?.url || 'assets/logo.svg';
      const owner = playlist.owner?.display_name || 'Spotify';
      const totalTracks = playlist.tracks?.total ?? 0;

      const card = document.createElement('div');
      card.className = 'track-card playlist-card';
      card.innerHTML = `
        <div class="cover-wrapper">
          <span class="rank-tag">${totalTracks} Songs</span>
          <img src="${img}" alt="${playlist.name}" loading="lazy" />
          <div class="preview-overlay" title="View Songs">
            <div class="play-circle">☰</div>
          </div>
        </div>
        <div class="track-title" title="${playlist.name}">${playlist.name}</div>
        <div class="track-artist">By ${owner}</div>
        <div class="card-footer">
          <span class="badge-preview">Open Playlist</span>
          <a href="${playlist.external_urls.spotify}" target="_blank" class="ext-link" onclick="event.stopPropagation()">Spotify ↗</a>
        </div>
      `;

      card.addEventListener('click', () => onSelectPlaylist(playlist));
      grid.appendChild(card);
    });
  }
};
