Project Plan: "Focus-Study" Website

This document outlines the features, technical considerations, and development plan for building a personalized study dashboard website.

1. Project Goal

To create a single-page web application that centralizes study tools—a timer, to-do list, internal calendar, and music controls—all set against a calming animated background to maximize focus and productivity.

2. Core Features

Calming Animated Background: A subtle, non-distracting video loop to create a focused atmosphere.

Spotify Integration: Display the currently playing song and provide basic controls (pause/skip).

Study Timer: A timer to track study sessions, with functionality for breaks (Pomodoro-style).

Internal Calendar: A built-in calendar to view the month and add/see simple tasks or events.

To-Do List: A simple, persistent list for managing session-specific tasks.

3. Feature Breakdown & Implementation Plan

a. Calming Animated Background

Description: A gentle, looping video clip (e.g., a slow-moving landscape, abstract motion, or calm waves) that serves as the page background.

Implementation:

HTML: Use an HTML5 <video> tag. You will need to source a video file (e.g., .mp4, .webm) that is suitable for a continuous loop.

Attributes: The video tag should include autoplay, loop, muted, and playsinline to ensure it starts automatically, repeats, has no sound, and works on mobile devices.

<video autoplay loop muted playsinline id="bg-video">
  <source src="path/to/your/video.mp4" type="video/mp4">
</video>


CSS: Use CSS to fix the video to the background and cover the entire screen.

#bg-video {
  position: fixed;
  right: 0;
  bottom: 0;
  min-width: 100%;
  min-height: 100%;
  z-index: -1;
  object-fit: cover; /* Ensures video covers screen without distortion */
  filter: brightness(0.7); /* Optional: Darken video to make text readable */
}


Priority: Medium.

b. To-Do List

Description: A simple widget where users can add tasks, check them off, and delete them.

Implementation:

UI: An <input> field for new tasks and a <ul> to list them. Each list item will have a checkbox and a delete button.

Logic: Use JavaScript to handle adding, removing, and toggling the "done" state of tasks.

Persistence: Use localStorage to save the to-do list in the user's browser.

Priority: High. This is a core feature that can be built without external dependencies.

c. Study Timer

Description: A timer that shows "Time Studied" (counting up) or "Time Remaining" (counting down, Pomodoro-style). Must include "Start," "Pause," "Reset," and "Take Break" buttons.

Implementation:

UI: Display for time (00:00:00), and control buttons.

Logic: Use JavaScript's setInterval() to update the timer every second.

State Management: Keep track of the timer's state (e.g., studying, on_break, paused).

Priority: High. Another core, self-contained feature.

d. Internal Calendar

Description: A built-in calendar widget that displays the current month, allows navigation, and lets the user add simple events to specific dates.

Implementation:

Recommendation: While you can build this from scratch, a library is highly recommended. FullCalendar.io is an excellent, feature-rich choice. A lighter alternative is vanilla-calendar-js.

UI: A grid-based month view with next/previous month buttons.

Logic:

Render the calendar using the chosen library.

Add functionality to allow a user to click on a date.

On-click, show a simple modal or input field to add an event for that date.

Persistence: Store the custom events in localStorage. Events should be saved as an array of objects, e.g., [{ "date": "2025-11-20", "title": "Math Quiz" }].

Priority: Medium. More complex than the to-do list, but a great core feature.

e. Spotify Integration

Description: Connect to the user's Spotify account to show the currently playing song, artist, and album art. Provide "Play/Pause" and "Next/Previous" buttons.

Implementation:

This is a complex feature requiring OAuth 2.0.

1. Authentication: The user must click a "Login with Spotify" button. This will redirect them to Spotify to grant permissions (scopes like user-read-playback-state and user-modify-playback-state).

2. API: Use the Spotify Web API.

GET /v1/me/player: To get the current playback state.

PUT /v1/me/player/pause: To pause.

PUT /v1/me/player/play: To resume.

POST /v1/me/player/next: To skip.

3. Backend (Recommended): A simple backend (like a serverless function) is needed to securely handle the OAuth token exchange and refresh tokens.

4. Polling: You will need to periodically (e.g., every few seconds) call the /v1/me/player endpoint to keep the display updated.

Priority: Low. This is the most complex feature. Save it for last.

4. Suggested Tech Stack

Frontend: HTML, CSS, JavaScript (ES6+)

Styling: Tailwind CSS (for rapidly building a modern, clean UI for the widgets).

Calendar View: FullCalendar.io (Recommended) or another lightweight JS calendar library.

APIs: Spotify Web API.

Persistence: localStorage (for to-do list, timer state, and calendar events).

5. Development Plan (Recommended Steps)

Step 1: Layout & Static UI:

Build the main HTML structure for the dashboard (e.g., using CSS Grid or Flexbox).

Create the static (non-functional) components: timer display, to-do list, calendar placeholder, and Spotify placeholder.

Apply styling with Tailwind CSS.

Step 2: Core Functionality (No APIs):

Implement the Study Timer logic in JavaScript.

Implement the To-Do List logic, including saving/loading from localStorage.

Step 3: Internal Calendar:

Integrate your chosen calendar library (e.g., FullCalendar.io).

Implement the logic for adding, viewing, and saving events to localStorage.

Step 4: Background:

Find a suitable, high-quality, looping video.

Add the Video Background using the HTML and CSS from section 3a.

Step 5: API Integration:

Set up a developer account with Spotify for Developers to get API keys.

Tackle Spotify: Implement the OAuth 2.0 flow. Fetch the current song and implement the play/pause/skip controls.

Step 6: Refine & Deploy:

Clean up the code, test all features, and ensure the layout is responsive.