# NOCTURNE // Spotify Sound Archive

A sleek, purple-and-black Spotify showcase built for GitHub Pages with modular HTML, CSS, and JavaScript.

## Folder Structure
```text
nocturne-spotify-site/
├── index.html          # Main entry point & layout
├── README.md           # Setup instructions
├── assets/
│   └── logo.svg        # Custom geometric waveform vector logo
├── css/
│   ├── variables.css   # Color palette & theme tokens
│   ├── style.css       # Layout, navbar, hero, and grid cards
│   └── player.css      # Sticky bottom audio preview player
└── js/
    ├── config.js       # Spotify Client ID & API configuration
    ├── auth.js         # PKCE OAuth login flow
    ├── api.js          # Spotify Web API fetch wrappers
    ├── player.js       # 30-second audio sample controller
    ├── ui.js           # DOM rendering for tracks & artists
    └── app.js          # Main application state & navigation
```

## Setup Guide
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and click **Create App**.
2. Add your GitHub Pages URL (e.g., `https://yourusername.github.io/your-repo/`) under **Redirect URIs** and enable **Web API**.
3. Open `js/config.js` and replace `YOUR_SPOTIFY_CLIENT_ID` with your Client ID.
4. Upload all files inside `nocturne-spotify-site` to your GitHub repository and enable **GitHub Pages** in your repo settings.
