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
        this.playerContainer = document.getElementById('spotify-player-container');
        this.dragHandle = document.getElementById('spotify-drag-handle');
        this.albumArt = document.getElementById('album-art');
        this.songTitle = document.getElementById('song-title');
        this.songArtist = document.getElementById('song-artist');
        this.playPauseBtn = document.getElementById('spotify-play-pause');
        this.playIcon = document.getElementById('play-icon');
        this.pauseIcon = document.getElementById('pause-icon');
        this.prevBtn = document.getElementById('spotify-prev');
        this.nextBtn = document.getElementById('spotify-next');
        this.shuffleBtn = document.getElementById('spotify-shuffle');
        this.repeatBtn = document.getElementById('spotify-repeat');
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.progressHandle = document.getElementById('progress-handle');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        
        this.isDragging = false;
        this.currentPosition = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.lastUpdateTime = null;
        this.isToggling = false; // Prevent double toggles
        this.toggleStartTime = null; // Track when toggle started
        
        // Drag state
        this.isDraggingPlayer = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialLeft = 0;
        this.initialTop = 0;
        
        this.loadPlayerPosition();
        this.setupDragAndResize();
    }

    attachEventListeners() {
        this.loginBtn.addEventListener('click', () => this.initiateLogin());
        this.playPauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Play/Pause button clicked');
            this.togglePlayback();
        });
        this.prevBtn.addEventListener('click', () => this.skipToPrevious());
        this.nextBtn.addEventListener('click', () => this.skipToNext());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Progress bar seek functionality
        this.progressContainer.addEventListener('click', (e) => this.seekToPosition(e));
        this.progressContainer.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.seekToPosition(e);
        });
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.seekToPosition(e);
            }
        });
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    // Backend API endpoint
    get backendUrl() {
        // For Vercel deployment, use the same origin
        // For local development, use the local server
        if (window.SPOTIFY_BACKEND_URL) {
            return window.SPOTIFY_BACKEND_URL;
        }
        // Auto-detect: if on localhost, use local server; otherwise use same origin
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://127.0.0.1:3001';
        }
        return window.location.origin;
    }

    async initiateLogin() {
        try {
            // Get auth URL from backend
            const response = await fetch(`${this.backendUrl}/api/spotify/login`);
            const data = await response.json();
            
            if (!data.authUrl) {
                throw new Error('No auth URL received from server');
            }
            
            // Open Spotify auth in popup window
            const width = 500;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            
            const popup = window.open(
                data.authUrl,
                'Spotify Login',
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
            );
            
            // Listen for auth success message from popup
            const messageListener = (event) => {
                if (event.data && event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
                    const { tokens } = event.data;
                    this.accessToken = tokens.accessToken;
                    this.refreshToken = tokens.refreshToken;
                    this.saveTokens();
                    this.checkAuthStatus();
                    window.removeEventListener('message', messageListener);
                }
            };
            
            window.addEventListener('message', messageListener);
            
            // Check if popup was closed manually
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageListener);
                }
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            alert('Failed to initiate login. Make sure the backend server is running on port 3001.\n\nRun: npm start');
        }
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
            this.showPlayIcon();
            this.updateProgress(0, 0);
            return;
        }

        const track = playbackData.item;
        this.songTitle.textContent = track.name;
        this.songArtist.textContent = track.artists.map(a => a.name).join(', ');
        
        if (track.album.images && track.album.images.length > 0) {
            this.albumArt.src = track.album.images[0].url;
        }

        // Only update play/pause icon if we're not currently toggling
        // This prevents the icon from flipping back and forth
        if (!this.isToggling) {
            this.isPlaying = playbackData.is_playing;
            if (playbackData.is_playing) {
                this.showPauseIcon();
            } else {
                this.showPlayIcon();
            }
        }
        
        // Update shuffle and repeat states if available
        if (playbackData.shuffle_state !== undefined) {
            this.shuffleBtn.classList.toggle('active', playbackData.shuffle_state);
        }
        if (playbackData.repeat_state) {
            this.repeatBtn.classList.toggle('active', playbackData.repeat_state !== 'off');
        }
        
        // Update progress bar
        const position = playbackData.progress_ms || 0;
        const duration = track.duration_ms || 0;
        this.updateProgress(position, duration);
    }
    
    updateProgress(position, duration) {
        this.currentPosition = position;
        this.duration = duration;
        
        if (duration === 0) {
            this.progressBar.style.width = '0%';
            this.progressHandle.style.left = '0%';
            this.currentTimeEl.textContent = '0:00';
            this.totalTimeEl.textContent = '0:00';
            return;
        }
        
        const percentage = (position / duration) * 100;
        this.progressBar.style.width = `${percentage}%`;
        this.progressHandle.style.left = `${percentage}%`;
        
        this.currentTimeEl.textContent = this.formatTime(position);
        this.totalTimeEl.textContent = this.formatTime(duration);
    }
    
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    seekToPosition(e) {
        if (!this.duration) return;
        
        const rect = this.progressContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newPosition = Math.floor(this.duration * percentage);
        
        // Update UI immediately
        this.updateProgress(newPosition, this.duration);
        
        // Seek on Spotify
        this.seekTo(newPosition);
    }
    
    async seekTo(positionMs) {
        if (!this.accessToken) return;
        
        try {
            await this.apiCall('PUT', `https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`);
        } catch (error) {
            console.error('Error seeking:', error);
        }
    }
    
    showPlayIcon() {
        if (this.playIcon && this.pauseIcon) {
            // Use requestAnimationFrame to ensure smooth transition
            requestAnimationFrame(() => {
                this.playIcon.classList.remove('hidden');
                this.pauseIcon.classList.add('hidden');
            });
        }
    }
    
    showPauseIcon() {
        if (this.playIcon && this.pauseIcon) {
            // Use requestAnimationFrame to ensure smooth transition
            requestAnimationFrame(() => {
                this.playIcon.classList.add('hidden');
                this.pauseIcon.classList.remove('hidden');
            });
        }
    }

    async togglePlayback() {
        if (!this.accessToken) {
            console.warn('No access token available');
            return;
        }
        
        // Prevent rapid clicks, but don't block if stuck
        if (this.isToggling) {
            // If stuck for more than 1 second, reset and allow
            const timeSinceToggle = Date.now() - (this.toggleStartTime || 0);
            if (timeSinceToggle > 1000) {
                console.warn('Toggle flag was stuck, resetting');
                this.isToggling = false;
                this.toggleStartTime = null;
            } else {
                console.log('Toggle in progress, ignoring click (elapsed:', timeSinceToggle, 'ms)');
                return;
            }
        }
        
        this.isToggling = true;
        this.toggleStartTime = Date.now();
        
        // Always reset flag after max 2 seconds, even if something goes wrong
        const safetyTimeout = setTimeout(() => {
            if (this.isToggling) {
                console.warn('Toggle timeout - resetting flag');
                this.isToggling = false;
                this.toggleStartTime = null;
            }
        }, 2000);

        try {
            // Get current state first
            const response = await this.apiCall('GET', 'https://api.spotify.com/v1/me/player');
            
            if (!response.ok) {
                if (response.status === 204) {
                    // No active playback
                    clearTimeout(safetyTimeout);
                    this.isToggling = false;
                    this.toggleStartTime = null;
                    console.warn('No active playback device');
                    return;
                }
                throw new Error(`Failed to get player state: ${response.status}`);
            }
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('Failed to parse player state response');
            }
            
            // Handle case where player might not be available
            if (!data || data.item === null) {
                clearTimeout(safetyTimeout);
                this.isToggling = false;
                this.toggleStartTime = null;
                console.warn('No active playback device');
                return;
            }
            
            const isPlaying = data.is_playing;

            // Update UI instantly (optimistic update) - this is the new state
            const newPlayingState = !isPlaying;
            if (newPlayingState) {
                this.showPauseIcon();
                this.isPlaying = true;
            } else {
                this.showPlayIcon();
                this.isPlaying = false;
            }

            // Then make the API call with timeout
            const togglePromise = isPlaying 
                ? this.apiCall('PUT', 'https://api.spotify.com/v1/me/player/pause')
                : this.apiCall('PUT', 'https://api.spotify.com/v1/me/player/play');
            
            const toggleResponse = await Promise.race([
                togglePromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Toggle request timeout')), 3000)
                )
            ]);
            
            if (!toggleResponse.ok) {
                throw new Error(`Failed to toggle playback: ${toggleResponse.status}`);
            }

            clearTimeout(safetyTimeout);
            
            // Don't immediately fetch - trust the optimistic update
            // Only sync after a longer delay to avoid flickering
            setTimeout(() => {
                this.isToggling = false;
                this.toggleStartTime = null;
                // Only fetch if we're still polling (don't interrupt if user is interacting)
                if (!this.isDragging) {
                    this.fetchCurrentPlayback();
                }
            }, 1000);
        } catch (error) {
            clearTimeout(safetyTimeout);
            console.error('Error toggling playback:', error);
            // Always reset flags
            this.isToggling = false;
            this.toggleStartTime = null;
            
            // Revert the optimistic update
            setTimeout(() => {
                this.fetchCurrentPlayback();
            }, 200);
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

    async toggleShuffle() {
        if (!this.accessToken) return;
        
        try {
            const response = await this.apiCall('GET', 'https://api.spotify.com/v1/me/player');
            const data = await response.json();
            const currentState = data.shuffle_state;
            
            await this.apiCall('PUT', `https://api.spotify.com/v1/me/player/shuffle?state=${!currentState}`);
            this.shuffleBtn.classList.toggle('active', !currentState);
        } catch (error) {
            console.error('Error toggling shuffle:', error);
        }
    }

    async toggleRepeat() {
        if (!this.accessToken) return;
        
        try {
            const response = await this.apiCall('GET', 'https://api.spotify.com/v1/me/player');
            const data = await response.json();
            const currentState = data.repeat_state || 'off';
            
            // Cycle through: off -> context -> track
            let nextState = 'off';
            if (currentState === 'off') {
                nextState = 'context';
            } else if (currentState === 'context') {
                nextState = 'track';
            }
            
            await this.apiCall('PUT', `https://api.spotify.com/v1/me/player/repeat?state=${nextState}`);
            this.repeatBtn.classList.toggle('active', nextState !== 'off');
        } catch (error) {
            console.error('Error toggling repeat:', error);
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

        const response = await fetch(url, options);
        
        // If token expired, try to refresh
        if (response.status === 401 && this.refreshToken) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                // Retry the original request with new token
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                return fetch(url, { ...options, headers });
            }
        }
        
        return response;
    }

    async refreshAccessToken() {
        try {
            const response = await fetch(`${this.backendUrl}/api/spotify/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.accessToken;
                if (data.refreshToken) {
                    this.refreshToken = data.refreshToken;
                }
                this.saveTokens();
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return false;
    }

    startPolling() {
        this.fetchCurrentPlayback();
        this.lastUpdateTime = Date.now();
        this.pollInterval = setInterval(() => {
            // Only update progress if not dragging
            if (!this.isDragging) {
                this.fetchCurrentPlayback();
                this.lastUpdateTime = Date.now();
            } else {
                // Update local progress while dragging (smooth animation)
                if (this.duration > 0 && this.isPlaying) {
                    const elapsed = Date.now() - this.lastUpdateTime;
                    this.currentPosition = Math.min(this.currentPosition + elapsed, this.duration);
                    this.updateProgress(this.currentPosition, this.duration);
                    this.lastUpdateTime = Date.now();
                }
            }
        }, 1000); // Poll every 1 second for smoother progress updates
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
        this.loadPlayerPosition();
    }
    
    setupDragAndResize() {
        if (!this.playerContainer || !this.dragHandle) return;
        
        // Set fixed size
        this.playerContainer.style.width = '600px';
        this.playerContainer.style.height = 'auto';
        this.updateScale(600);
        
        // Drag functionality
        const startDrag = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isDraggingPlayer = true;
            const rect = this.playerContainer.getBoundingClientRect();
            this.dragStartX = e.clientX - rect.left;
            this.dragStartY = e.clientY - rect.top;
            this.initialLeft = parseInt(this.playerContainer.style.left) || 0;
            this.initialTop = parseInt(this.playerContainer.style.top) || 0;
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'move';
        };
        
        const onDrag = (e) => {
            if (!this.isDraggingPlayer) return;
            e.preventDefault();
            const overlay = document.getElementById('spotify-overlay');
            if (!overlay) return;
            const overlayRect = overlay.getBoundingClientRect();
            const newLeft = e.clientX - overlayRect.left - this.dragStartX;
            const newTop = e.clientY - overlayRect.top - this.dragStartY;
            
            // Constrain to overlay bounds
            const maxLeft = overlayRect.width - this.playerContainer.offsetWidth;
            const maxTop = overlayRect.height - this.playerContainer.offsetHeight;
            
            this.playerContainer.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
            this.playerContainer.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
            this.playerContainer.style.transform = 'none';
        };
        
        const stopDrag = () => {
            if (this.isDraggingPlayer) {
                this.isDraggingPlayer = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                this.savePlayerPosition();
            }
        };
        
        
        // Event listeners
        this.dragHandle.addEventListener('mousedown', startDrag);
        this.playerContainer.addEventListener('mousedown', (e) => {
            // Only start drag if clicking on empty space, not buttons or interactive elements
            const isInteractive = e.target.closest('button') || 
                                  e.target.closest('input') || 
                                  e.target.closest('#progress-container');
            if (!isInteractive && (e.target === this.playerContainer || e.target.closest('#spotify-drag-handle'))) {
                startDrag(e);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            onDrag(e);
        });
        
        document.addEventListener('mouseup', () => {
            stopDrag();
        });
    }
    
    savePlayerPosition() {
        if (!this.playerContainer) return;
        const position = {
            left: parseInt(this.playerContainer.style.left) || 0,
            top: parseInt(this.playerContainer.style.top) || 0,
            width: 600, // Fixed width
            height: 'auto' // Auto height
        };
        localStorage.setItem('spotifyPlayerPosition', JSON.stringify(position));
    }
    
    loadPlayerPosition() {
        if (!this.playerContainer) return;
        const saved = localStorage.getItem('spotifyPlayerPosition');
        if (saved) {
            try {
                const position = JSON.parse(saved);
                this.playerContainer.style.position = 'absolute';
                this.playerContainer.style.left = `${position.left}px`;
                this.playerContainer.style.top = `${position.top}px`;
                this.playerContainer.style.transform = 'none';
                // Fixed size - always 600px width
                this.playerContainer.style.width = '600px';
                this.playerContainer.style.height = 'auto';
                this.updateScale(600);
            } catch (e) {
                console.error('Failed to load player position:', e);
                this.setDefaultPosition();
            }
        } else {
            this.setDefaultPosition();
        }
    }
    
    updateScale(width) {
        if (!this.playerContainer) return;
        // Base width is 600px, so scale is always 1 at fixed size
        const scale = 1;
        this.playerContainer.style.setProperty('--scale', scale);
        this.playerContainer.style.setProperty('--container-width', width);
    }
    
    setDefaultPosition() {
        if (!this.playerContainer) return;
        // Find the overlay container (spotify-overlay)
        const overlay = document.getElementById('spotify-overlay');
        if (overlay) {
            const overlayRect = overlay.getBoundingClientRect();
            this.playerContainer.style.position = 'absolute';
            this.playerContainer.style.left = `${(overlayRect.width - 600) / 2}px`;
            this.playerContainer.style.top = `${overlayRect.height - 200}px`;
            this.playerContainer.style.transform = 'none';
            this.playerContainer.style.width = '600px';
            this.playerContainer.style.height = 'auto';
            this.updateScale(600);
        }
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

