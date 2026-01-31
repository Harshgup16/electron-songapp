# MySong Player

A pastel-themed desktop music player built with HTML, CSS, JavaScript, and ElectronJS. Features real-time JAM sessions where multiple users can listen together and sync playback across different locations.

## Features

- 🎵 **Music Player** - Play, pause, next, previous, and seek controls
- 🎨 **Pastel UI** - Beautiful purple/pink gradient design
- 📋 **Playlist Menu** - Browse and select songs from Supabase
- 🖼️ **Album Art** - Display cover images from database
- 🎸 **JAM Mode** - Real-time sync with other users worldwide
- 💜 **Animated Hearts** - Cute animations while playing

## JAM Feature

The JAM feature allows multiple users to listen together in real-time:

- Click **JAM** button to join a shared session
- See user count: `JAM (1)`, `JAM (3)`, etc.
- All playback actions sync across users (play, pause, next, seek)
- Works across different locations worldwide
- No authentication required - just click and JAM!

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Desktop:** ElectronJS
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Sync:** Supabase Realtime Channels (Presence + Broadcast)

## What's in this repo

| File / Folder | Purpose |
| --- | --- |
| `index.html` | Main HTML layout for the player UI |
| `styles.css` | All styles for the player interface |
| `script.js` | Frontend JavaScript - player logic & JAM sync |
| `main.js` | Electron main process - creates desktop window |
| `package.json` | Project metadata & dependencies |
| `assets/` | Images, icons, and other static assets |

## How to use

### 1. Clone This Repo

```
git clone https://github.com/harsh-gupta/mysong.git
cd mysong
```

### 2. Install Dependencies

Make sure you have Node.js installed, then run:

```
npm install
```

### 3. Run the App

```
npm run start
```

This will open MySong Player as a desktop application.

## Supabase Setup

Create a `songs` table in Supabase with these columns:

| Column | Type |
| --- | --- |
| `name` | text |
| `url` | text |
| `image_url` | text (optional) |

Add your Supabase credentials in `script.js`.

## Author

**Harsh Gupta**

## License

MIT
