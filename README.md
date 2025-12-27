# All or Nothing - Dice Game PWA

A fully-featured, mobile-optimized Progressive Web Application (PWA) dice game with world-class design and engaging gameplay.

## Overview

**Product Name:** All or Nothing  
**Product Type:** Progressive Web Application (PWA)  
**Target Platforms:** Mobile (iOS, Android) and Desktop browsers  
**Version:** 1.0

## Features

### 🎮 Game Mechanics
- **6 Player Support**: Six individual player sections for multiplayer gameplay
- **Chip System**: Collect green, red, and heart chips based on dice rolls
- **3D Dice**: Three dice (green, red, yellow) with realistic 3D rendering
- **Winning Conditions**: First to collect three green chips wins!

### 🎨 User Interface
- **Modern Design**: Clean, minimalist UI inspired by top game developers
- **Responsive Layout**: Optimized for various mobile screen sizes
- **Smooth Animations**: Fluid transitions for dice rolling and chip collection
- **Audio Feedback**: Sound effects and background music (when assets are provided)

### 🌐 Real-Time Features
- **WebSocket Ready**: Real-time multiplayer support (simulation mode included)
- **Lobby System**: Create or join game rooms with unique codes
- **Chat Functionality**: In-game chat for player interaction
- **Live Updates**: Real-time game state synchronization

### ⚡ Performance
- **PWA Features**: Installable, offline-capable with service worker
- **Lazy Loading**: Optimized asset loading for fast performance
- **3D Graphics**: Powered by Three.js for smooth dice animations

## Installation

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/ToXMon/vc.git
   cd vc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### PWA Installation

When accessing the app through a supported browser, you can install it as a PWA:
- **Chrome/Edge**: Click the install icon in the address bar
- **Safari (iOS)**: Tap Share → Add to Home Screen
- **Android**: Tap the menu → Install App

## How to Play

### Objective
Be the first player to collect three green chips in a row, or have the most chips when time runs out.

### Gameplay
1. **Start a Game**: Create a new game or join using a room code
2. **Roll Dice**: On your turn, tap the "Roll Dice" button
3. **Collect Chips**: Based on your dice results:
   - **Triple (all same)**: Earn a green chip 🟢
   - **Pair (two same)**: Earn a red chip 🔴
   - **No match**: Earn a heart chip ❤️
4. **Win**: First to collect 3 green chips wins!

## Project Structure

```
/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── package.json            # Node.js dependencies
├── styles/
│   └── main.css           # All CSS styles
├── scripts/
│   ├── game.js            # Main game logic
│   ├── dice3d.js          # 3D dice rendering with Three.js
│   └── websocket.js       # WebSocket manager for multiplayer
└── assets/
    ├── icon-192.svg       # App icon (192x192)
    ├── icon-512.svg       # App icon (512x512)
    ├── sounds/            # Audio assets (optional)
    └── README.md          # Assets documentation
```

## Technologies

- **HTML5 & CSS3**: Modern web standards
- **JavaScript (ES6+)**: Game logic and interactions
- **Three.js**: 3D graphics rendering for dice
- **WebSocket**: Real-time multiplayer support
- **Service Worker**: PWA offline capabilities
- **Responsive Design**: Mobile-first approach

## Configuration

### Audio Assets
To enable sound effects, add the following MP3 files to `assets/sounds/`:
- `dice-roll.mp3` - Dice rolling sound
- `chip-collect.mp3` - Chip collection sound
- `win.mp3` - Victory sound
- `background.mp3` - Background music

The game works without these files, failing gracefully if they're not present.

### WebSocket Server
The game includes a simulation mode for development. To enable real multiplayer:
1. Set up a WebSocket server
2. Update the connection URL in `scripts/websocket.js`
3. Set `simulateMode = false` in the WebSocketManager constructor

### Firebase Realtime Database (Multiplayer)
Client-only multiplayer uses Firebase RTDB. Config keys are public and safe to commit.

1. In Firebase console, create a project and Realtime Database (start in locked or test mode as needed).
2. Copy `scripts/firebase-config.sample.js` to `scripts/firebase-config.js`.
3. Replace the placeholder values (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) with your project config from **Project settings → General → Your apps → SDK setup**.
4. Keep `scripts/firebase-config.js` in the repo for GitHub Pages/static hosting so the client can initialize Firebase at runtime.
5. Database rules: copy `firebase-rules.sample.json`, adjust as needed, and deploy via Firebase console or CLI (`firebase deploy --only database`). Ensure `databaseURL` matches your RTDB instance.
6. To deploy with Firebase CLI: install globally (`npm i -g firebase-tools`), run `firebase login`, `firebase init database` (select existing project, skip rules overwrite), and set your rules file path to `firebase-rules.sample.json` or your edited copy. Then `firebase deploy --only database`.

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- **Service Worker**: Caches resources for offline play
- **Lazy Loading**: Assets loaded on demand
- **Efficient Rendering**: Optimized 3D graphics with Three.js
- **Responsive Images**: SVG icons for crisp display at any size

## Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see LICENSE file for details

## Credits

Developed for the ToXMon/vc repository  
Design inspired by Monument Valley and modern game UI patterns