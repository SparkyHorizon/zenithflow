# Focus-Study Dashboard

A single-page web application that centralizes study tools—a timer, to-do list, and music controls—all set against a calming animated background to maximize focus and productivity.

## Layout

The dashboard features a split-screen design:
- **Left Panel**: Wide area displaying the looping background video with Timer widget in the top-left corner and Spotify controls overlaid at the bottom
- **Right Sidebar**: Resizable panel containing a Notion-inspired notes editor with editable title and emoji picker

## Features


### ✅ Notes Editor
- Notion-style block editor with “+” menu and slash commands
- Create headings (H1, H2, H3)
- Bullet lists, numbered lists, and checkboxes
- Custom checkbox UI that matches the Notion look
- Emoji picker and editable title
- Resizable sidebar; wrap-around text with multi-line support
- Auto-saves to localStorage as you type

### ✅ Animated Background
- Calming video background (when video file is provided)
- Graceful fallback to gradient background if video fails to load
- Non-distracting, focus-enhancing atmosphere
- Full-screen display on the left panel

### ⚠️ Spotify Integration
- UI structure is complete
- Overlaid on the background video at the bottom of the left panel
- **Note**: Full OAuth implementation requires a backend server
- See `spotify.js` for implementation details and setup instructions

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools or installation required!

### Setup

1. **Clone or download this repository**

2. **Add a background video (optional)**
   - Place a video file named `background.mp4` in `assets/video/`
   - The video should be calming and suitable for looping
   - If no video is provided, a beautiful gradient background will be used instead

3. **Open the application**
   - Simply open `index.html` in your web browser
   - Or use a local web server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (http-server)
     npx http-server
     ```
   - Then navigate to `http://localhost:8000`

## Usage

### Study Timer
- Click **Start** to begin tracking time
- Use **Pause** to temporarily stop the timer
- **Reset** clears the timer back to zero (or 25:00 in Pomodoro mode)
- **Take Break** starts a 5-minute break timer
- Check **Pomodoro Mode** for 25-minute focused sessions

### Notes Editor
- Start typing to create blocks; press `Enter` to add a new block, `Shift+Enter` for a line break
- Hover a block and click the **+** icon (or type `/`) to open the block menu
- Available blocks: Text, Heading 1/2/3, Bulleted list, Numbered list, To-do list (with custom checkbox)
- Click the checkbox to toggle tasks
- Use the emoji button to insert emoji into the title or the focused block
- Drag the right edge of the sidebar to resize the notes area
- Your notes and title are automatically saved as you type

### Spotify (Requires Backend Setup)
The Spotify integration UI is ready, but requires backend implementation for OAuth. To complete this feature:

1. Register your app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Set up a backend server to handle OAuth 2.0 flow
3. Update `spotify.js` with your API endpoints
4. See the code comments in `spotify.js` for implementation details

## File Structure

```
zenithflow/
├── index.html          # Main HTML file
├── styles.css          # Custom CSS styles
├── main.js            # Initialization and utilities
├── timer.js           # Study timer functionality
├── notes.js           # Rich text notes editor functionality
├── spotify.js         # Spotify integration (requires backend)
├── assets/
│   └── video/
│       └── background.mp4  # Background video (optional)
└── README.md          # This file
```

## Technologies Used

- **HTML5**: Structure and semantic markup
- **CSS3**: Styling and animations
- **JavaScript (ES6+)**: Interactive functionality
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Custom Notion-style block editor**: Vanilla JS implementation
- **localStorage**: Client-side data persistence

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- All data is stored locally in your browser using localStorage
- Data is browser-specific (won't sync across devices)
- The application works offline once loaded
- Background video is optional - a gradient fallback is provided
- Layout is optimized for desktop viewing with a split-screen design

## Future Enhancements

- Backend integration for Spotify OAuth
- Cloud sync for todos
- Multiple timer presets
- Sound notifications for timer completion
- Dark/light theme toggle
- Export/import functionality

## License

This project is open source and available for personal and educational use.

