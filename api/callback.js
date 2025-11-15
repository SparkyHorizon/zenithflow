// Vercel serverless function for Spotify OAuth callback
const axios = require('axios');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method not allowed');
    }

    const code = req.query.code;
    const error = req.query.error;
    
    if (error) {
        return res.redirect(`/?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
        return res.redirect('/?error=no_code');
    }
    
    try {
        const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
        const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
        const REDIRECT_URI = process.env.REDIRECT_URI || `${req.headers.origin || 'https://' + req.headers.host}/api/callback`;

        if (!CLIENT_ID || !CLIENT_SECRET) {
            return res.redirect('/?error=server_configuration');
        }

        // Exchange code for tokens
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        const { access_token, refresh_token } = tokenResponse.data;
        
        // Redirect back to frontend with tokens
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Spotify Authentication</title>
            </head>
            <body>
                <script>
                    const tokens = {
                        accessToken: '${access_token}',
                        refreshToken: '${refresh_token || ''}'
                    };
                    
                    localStorage.setItem('spotifyAccessToken', tokens.accessToken);
                    if (tokens.refreshToken) {
                        localStorage.setItem('spotifyRefreshToken', tokens.refreshToken);
                    }
                    
                    if (window.opener) {
                        window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', tokens }, '*');
                        window.close();
                    } else {
                        window.location.href = '/';
                    }
                </script>
                <p>Authentication successful! You can close this window.</p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        res.redirect(`/?error=token_exchange_failed`);
    }
};

