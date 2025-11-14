// Main initialization and utility functions

document.addEventListener('DOMContentLoaded', () => {
    // Ensure all components are initialized
    console.log('Focus-Study Dashboard initialized');
    
    // Handle video loading errors gracefully
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        console.log('Video element found:', bgVideo);
        console.log('Video source:', bgVideo.querySelector('source')?.src);
        
        bgVideo.addEventListener('error', (e) => {
            console.error('Background video failed to load:', e);
            console.warn('Video error details:', bgVideo.error);
            console.warn('Using fallback background.');
            // Don't hide the video, let the gradient show through
        });
        
        bgVideo.addEventListener('loadstart', () => {
            console.log('Video loading started');
        });
        
        bgVideo.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
        });
        
        // Check if video source exists
        bgVideo.addEventListener('loadeddata', () => {
            console.log('Background video loaded successfully');
            console.log('Video dimensions:', bgVideo.videoWidth, 'x', bgVideo.videoHeight);
        });
        
        // Try to play the video
        bgVideo.play().then(() => {
            console.log('Video playback started');
        }).catch((error) => {
            console.error('Video play failed:', error);
        });
    } else {
        console.error('Video element not found!');
    }
    
    // Left-side resize handle for notes box
    const resizeHandle = document.getElementById('resize-handle-left');
    const notesContainer = document.getElementById('notes-container');
    
    if (resizeHandle && notesContainer) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = notesContainer.offsetWidth;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const diff = startX - e.clientX; // Inverted because we're resizing from left
            const newWidth = startWidth + diff;
            const minWidth = 320; // matches min-width in CSS
            const maxWidth = window.innerWidth * 0.65; // matches max-width in CSS
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                notesContainer.style.width = `${newWidth}px`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
    
    // Prevent form submission on Enter in todo input (already handled in todo.js)
    // Add any other global utilities here
    
    // Fullscreen button functionality
    const fullscreenButton = document.getElementById('fullscreen-button');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    const fullscreenExitIcon = document.getElementById('fullscreen-exit-icon');
    
    if (fullscreenButton) {
        // Function to update icon based on fullscreen state
        const updateFullscreenIcon = () => {
            if (document.fullscreenElement || document.webkitFullscreenElement || 
                document.mozFullScreenElement || document.msFullscreenElement) {
                fullscreenIcon.classList.add('hidden');
                fullscreenExitIcon.classList.remove('hidden');
            } else {
                fullscreenIcon.classList.remove('hidden');
                fullscreenExitIcon.classList.add('hidden');
            }
        };
        
        // Toggle fullscreen
        fullscreenButton.addEventListener('click', async () => {
            try {
                if (!document.fullscreenElement && !document.webkitFullscreenElement && 
                    !document.mozFullScreenElement && !document.msFullscreenElement) {
                    // Enter fullscreen
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    } else if (document.documentElement.webkitRequestFullscreen) {
                        await document.documentElement.webkitRequestFullscreen();
                    } else if (document.documentElement.mozRequestFullScreen) {
                        await document.documentElement.mozRequestFullScreen();
                    } else if (document.documentElement.msRequestFullscreen) {
                        await document.documentElement.msRequestFullscreen();
                    }
                } else {
                    // Exit fullscreen
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        await document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        await document.msExitFullscreen();
                    }
                }
            } catch (error) {
                console.error('Error toggling fullscreen:', error);
            }
        });
        
        // Listen for fullscreen changes to update icon
        document.addEventListener('fullscreenchange', updateFullscreenIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
        document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
        document.addEventListener('MSFullscreenChange', updateFullscreenIcon);
        
        // Initialize icon state
        updateFullscreenIcon();
    }
});

