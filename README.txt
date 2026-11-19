MY DIGITAL NOTEBOOK — SETUP GUIDE

FILES
- index.html: page structure
- style.css: design, colors, responsive layout, light/dark themes
- app.js: all interactive features and note storage

HOW TO RUN
1. Extract the ZIP file.
2. Open the extracted folder in Visual Studio Code.
3. Install the "Live Server" extension if you do not already have it.
4. Right-click index.html and choose "Open with Live Server".
5. Try creating, editing, favoriting, searching, and deleting notes.

FEATURES
- Create, edit, and delete notes
- Search notes by title, text, or folder
- Favorites and recent notes
- Study, Personal, Ideas, and Work folders
- Five note card colors
- Light mode and dark mode
- Responsive layout for desktop, tablet, and mobile
- Notes saved in this browser using localStorage

IMPORTANT
Notes are stored only in the current browser on the current device. They do not automatically sync to another device. Clearing browser data may remove saved notes. Export/cloud backup is not included in this starter project.

If the buttons do not work, make sure app.js is in the same folder as index.html and that the script line in index.html is:
<script src="app.js" defer></script>

The Google Fonts import in style.css needs internet; the app itself can use fallback fonts without it.
