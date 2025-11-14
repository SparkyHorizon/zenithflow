class SpotifyManager {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.deviceId = null;
        this.pollInterval = null;
        this.isAuthenticated = false;
        
        this.loadTokens();
        this.initializeElements();
        this.attachEventListeners();
        
        if (this.accessToken) {
            this.checkAuthStatus();
        }
    }

    initializeElements() {
        this.loginBtn = document.getElementById('spotify-login');
        this.playerDiv = document.getElementById('spotify-player');
        this.albumArt = document.getElementById('album-art');
        this.songTitle = document.getElementById('song-title');
        this.songArtist = document.getElementById('song-artist');
        this.playPauseBtn = document.getElementById('spotify-play-pause');
        this.prevBtn = document.getElementById('spotify-prev');
        this.nextBtn = document.getElementById('spotify-next');
    }

    attachEventListeners() {
        this.loginBtn.addEventListener('click', () => this.initiateLogin());
        this.playPauseBtn.addEventListener('click', () => this.togglePlayback());
        this.prevBtn.addEventListener('click', () => this.skipToPrevious());
        this.nextBtn.addEventListener('click', () => this.skipToNext());
    }

    // Note: This is a placeholder implementation
    // Full OAuth flow requires a backend server for security
    initiateLogin() {
        alert('Spotify integration requires a backend server for OAuth authentication.\n\nTo implement this feature:\n1. Set up a backend server (e.g., Node.js/Express)\n2. Register your app at https://developer.spotify.com/dashboard\n3. Implement OAuth 2.0 flow with redirect URI\n4. Store client ID and secret securely on backend\n\nFor now, this is a placeholder that demonstrates the UI structure.');
        
        // In a real implementation, this would redirect to:
        // const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=user-read-playback-state user-modify-playback-state`;
        // window.location.href = authUrl;
    }

    async checkAuthStatus() {
        try {
            const response = await this.apiCall('GET', 'https://api.spotify.com/v1/me');
            if (response.ok) {
                this.isAuthenticated = true;
                this.showPlayer();
                this.startPolling();
            } else {
                this.handleAuthError();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.handleAuthError();
        }
    }

    async fetchCurrentPlayback() {
        if (!this.accessToken) return;

        try {
            const response = await this.apiCall('GET', 'https://api.spotify.com/v1/me/player');
            
            if (response.status === 204) {
                // No active playback
                this.updatePlayerDisplay(null);
                return;
            }

            if (!response.ok) {
                if (response.status === 401) {
                    this.handleAuthError();
                }
                return;
            }

            const data = await response.json();
            this.updatePlayerDisplay(data);
        } catch (error) {
            console.error('Error fetching playback:', error);
        }
    }

    updatePlayerDisplay(playbackData) {
        if (!playbackData || !playbackData.item) {
            this.songTitle.textContent = 'No track playing';
            this.songArtist.textContent = '';
            this.albumArt.src = '';
            this.playPauseBtn.textContent = '▶';
            return;
        }

        const track = playbackData.item;
        this.songTitle.textContent = track.name;
        this.songArtist.textContent = track.artists.map(a => a.name).join(', ');
        
        if (track.album.images && track.album.images.length > 0) {
            this.albumArt.src = track.album.images[0].url;
        }

        this.playPauseBtn.textContent = playbackData.is_playing ? '⏸' : '▶';
    }

    async togglePlayback() {
        if (!this.accessToken) return;

        try {
            const response = await this.apiCall('GET', 'https://api.spotify.com/v1/me/player');
            const data = await response.json();
            const isPlaying = data.is_playing;

            if (isPlaying) {
                await this.apiCall('PUT', 'https://api.spotify.com/v1/me/player/pause');
            } else {
                await this.apiCall('PUT', 'https://api.spotify.com/v1/me/player/play');
            }

            // Update display after a short delay
            setTimeout(() => this.fetchCurrentPlayback(), 500);
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    }

    async skipToPrevious() {
        if (!this.accessToken) return;
        
        try {
            await this.apiCall('POST', 'https://api.spotify.com/v1/me/player/previous');
            setTimeout(() => this.fetchCurrentPlayback(), 500);
        } catch (error) {
            console.error('Error skipping to previous:', error);
        }
    }

    async skipToNext() {
        if (!this.accessToken) return;
        
        try {
            await this.apiCall('POST', 'https://api.spotify.com/v1/me/player/next');
            setTimeout(() => this.fetchCurrentPlayback(), 500);
        } catch (error) {
            console.error('Error skipping to next:', error);
        }
    }

    async apiCall(method, url, body = null) {
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`
        };

        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const options = {
            method: method,
            headers: headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return fetch(url, options);
    }

    startPolling() {
        this.fetchCurrentPlayback();
        this.pollInterval = setInterval(() => {
            this.fetchCurrentPlayback();
        }, 3000); // Poll every 3 seconds
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    showPlayer() {
        this.loginBtn.classList.add('hidden');
        this.playerDiv.classList.remove('hidden');
    }

    hidePlayer() {
        this.loginBtn.classList.remove('hidden');
        this.playerDiv.classList.add('hidden');
    }

    handleAuthError() {
        this.isAuthenticated = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.saveTokens();
        this.stopPolling();
        this.hidePlayer();
    }

    saveTokens() {
        if (this.accessToken) {
            localStorage.setItem('spotifyAccessToken', this.accessToken);
        } else {
            localStorage.removeItem('spotifyAccessToken');
        }
        
        if (this.refreshToken) {
            localStorage.setItem('spotifyRefreshToken', this.refreshToken);
        } else {
            localStorage.removeItem('spotifyRefreshToken');
        }
    }

    loadTokens() {
        this.accessToken = localStorage.getItem('spotifyAccessToken');
        this.refreshToken = localStorage.getItem('spotifyRefreshToken');
    }
}

// Initialize Spotify manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spotifyManager = new SpotifyManager();
});

