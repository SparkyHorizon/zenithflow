# Quick Start Guide

## ✅ Setup Complete!

Your Spotify credentials are configured and protected in `.gitignore`.

## 🚀 Start the Server

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

   You should see:
   ```
   🎵 Spotify OAuth Server running on http://127.0.0.1:3001
   ✅ Server is ready!
   📝 Open http://127.0.0.1:3001 in your browser
   🔐 Redirect URI: http://127.0.0.1:3001/callback
   ```

## 🎵 Test Spotify Integration

1. Open `http://127.0.0.1:3001` in your browser
2. Click **"Login with Spotify"** button
3. A popup will open - authorize the app
4. The Spotify player should appear with your current playback!

## 🔒 Security

- ✅ `server.js` is in `.gitignore` - your credentials won't be committed
- ✅ `server.js.example` is a template (safe to commit)
- ✅ Credentials are only stored locally

## 📝 Important Notes

- **Redirect URI**: Make sure in your Spotify Dashboard, the redirect URI is set to:
  ```
  http://127.0.0.1:3001/callback
  ```
  (NOT `localhost` - Spotify doesn't allow that)

- **Port**: If you change the port, update:
  - `server.js` (PORT variable)
  - Spotify Dashboard (redirect URI)
  - `spotify.js` (backendUrl)

## 🐛 Troubleshooting

**"Failed to initiate login"**
- Make sure the server is running (`npm start`)
- Check that port 3001 is not in use

**"Invalid redirect URI"**
- Verify the redirect URI in Spotify Dashboard matches exactly: `http://127.0.0.1:3001/callback`
- Make sure you're using `127.0.0.1` not `localhost`

**Token expired**
- The app will automatically refresh tokens
- If refresh fails, just log in again

## 🎉 You're All Set!

The Spotify integration is fully configured and ready to use!

