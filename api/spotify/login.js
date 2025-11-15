// Vercel serverless function for Spotify login
const axios = require('axios');

// Helper function to generate random string for state
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
        const REDIRECT_URI = process.env.REDIRECT_URI || `${req.headers.origin || 'https://' + req.headers.host}/api/callback`;

        if (!CLIENT_ID) {
            return res.status(500).json({ error: 'Spotify Client ID not configured' });
        }

        const scope = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
        const state = generateRandomString(16);
        
        const authUrl = `https://accounts.spotify.com/authorize?` +
            `client_id=${CLIENT_ID}&` +
            `response_type=code&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}`;
        
        res.json({ authUrl });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
};

