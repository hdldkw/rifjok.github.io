# SONGZ // Password-Protected Spotify Premium Web Player

## Security & Password Gate (`js/gate.js`)
- **Primary Password:** `1121iamtuff` (required before connecting to Spotify or loading a saved Refresh Token session).
- **3-Strike Lockout:** Failing the primary password 3 times locks the device.
- **Recovery Password (`1 Chance`):** After lockout, a second prompt appears requiring `G`. Entering `G` unlocks the device and resets attempts; failing `G` permanently bans the device in browser storage (`songz_device_permabanned`).

## Setup
1. Paste your Spotify `CLIENT_ID` (and optional `REFRESH_TOKEN`) into `js/config.js`.
2. Ensure **Web Playback SDK** is enabled in your Spotify Developer Dashboard settings.
3. Upload all files to your GitHub repository.
