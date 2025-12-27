# Product Requirements Document: All or Nothing - Dice Game PWA

## 1. Introduction/Overview

**All or Nothing** is a mobile-first Progressive Web Application (PWA) that delivers an engaging multiplayer dice game experience with real-time gameplay, 3D graphics, and peer-to-peer connectivity. The application provides an installable, offline-capable gaming platform optimized for mobile devices while supporting desktop browsers.

### Problem Statement
Players seeking casual, strategic dice games often face issues with:
- Complex installation processes requiring app stores
- Limited cross-platform compatibility
- Poor offline support
- Difficulty connecting with friends for multiplayer sessions

### Solution
All or Nothing addresses these challenges by providing an instant-play PWA with:
- Zero-friction deployment (web-based, installable)
- Cross-platform support (iOS, Android, Desktop)
- Peer-to-peer multiplayer using WebRTC (no server required)
- Offline-capable gameplay
- High-quality 3D dice animations
- Shareable room links for easy friend invitations

---

## 2. Goals

1. **Accessibility**: Enable players to start playing within seconds on any modern device without app store installation
2. **Engagement**: Provide visually appealing 3D dice mechanics and smooth animations that rival native apps
3. **Social Play**: Facilitate seamless multiplayer connections between friends using shareable room links
4. **Performance**: Deliver sub-second load times and 60fps animations on mobile devices
5. **Retention**: Support offline play and PWA installation to drive repeat usage
6. **Scalability**: Use peer-to-peer architecture to support unlimited concurrent games without server costs

---

## 3. User Stories

### Core Gameplay
- As a **new player**, I want to quickly understand the game rules through an interactive tutorial so I can start playing immediately
- As a **mobile user**, I want smooth 3D dice animations that feel realistic so the game experience is immersive
- As a **player**, I want to see my collected chips (green, red, heart) displayed clearly so I can track my progress toward winning
- As a **competitive player**, I want to know when I win (first to 3 green chips) with a celebratory screen

### Multiplayer Experience
- As a **game host**, I want to generate a unique room code and share a link so my friends can easily join my game
- As a **joining player**, I want to click a shared link and automatically join my friend's game without manual code entry
- As a **multiplayer participant**, I want to see dice rolls and chip updates in real-time so the game feels synchronized
- As a **social gamer**, I want to chat with my opponent during gameplay to enhance the social experience
- As a **player**, I want to see connection status notifications so I know when my opponent joins or disconnects

### Progressive Web App Features
- As a **mobile user**, I want to install the app to my home screen so it feels like a native app
- As a **returning user**, I want the app to work offline (with cached assets) so I can play without internet
- As a **performance-conscious user**, I want the app to load quickly even on slower connections

### Technical Features
- As a **developer/tester**, I want clear localhost setup instructions so I can test multiplayer features locally
- As a **privacy-conscious user**, I want peer-to-peer connections so my game data isn't stored on third-party servers

---

## 4. Functional Requirements

### 4.1 Progressive Web App (PWA)
1. The application **must** be installable on iOS, Android, and Desktop browsers
2. The application **must** include a valid `manifest.json` with app icons (192x192, 512x512)
3. The application **must** implement a service worker for offline caching
4. The application **must** cache critical assets (HTML, CSS, JS, Three.js library)
5. The application **must** use a mobile-optimized viewport with `user-scalable=no`
6. The application **must** support portrait orientation as primary mode
7. The application **must** display a themed splash screen during initial load

### 4.2 Game Mechanics
8. The game **must** support rolling three dice (green, red, yellow) per turn
9. The game **must** implement the following chip award rules:
   - **Triple** (all three dice show same number) → Award 1 green chip
   - **Pair** (two dice show same number) → Award 1 red chip
   - **No match** (all different numbers) → Award 1 heart chip
10. The game **must** track chips for each player in three categories: green, red, heart
11. The game **must** declare a winner when any player collects 3 green chips
12. The game **must** support up to 6 players in a game session
13. The game **must** implement turn-based gameplay with clear turn indicators

### 4.3 3D Dice Rendering
14. The application **must** render 3D dice using Three.js library
15. Dice **must** display realistic rolling animations with physics-based movement
16. Each die **must** be color-coded (green, red, yellow) for visual distinction
17. Dice animations **must** run at 60fps on modern mobile devices
18. The application **must** provide a dedicated 3D rendering canvas for dice display

### 4.4 User Interface
19. The application **must** include the following screens:
    - Loading screen with animated dice loader
    - Main menu with New Game, Join Game, Tutorial, Settings options
    - Lobby screen for room creation/joining
    - Tutorial screen explaining game rules
    - Game screen with dice area, player sections, and chat
    - Winner screen with play again/exit options
20. Player sections **must** display:
    - Player name
    - Current turn indicator
    - Collected chips (visual representation)
21. The UI **must** use mobile-optimized touch targets (minimum 44x44px)
22. The UI **must** implement smooth transitions between screens
23. The application **must** display a "Roll Dice" button during the active player's turn
24. The application **must** show real-time status messages for game events

### 4.5 Multiplayer - Real-time Peer-to-Peer
25. The application **must** implement peer-to-peer multiplayer using WebRTC (PeerJS)
26. The application **must** allow players to create a game room with a unique peer ID
27. The application **must** generate shareable URLs with room codes for easy joining
28. The application **must** support URL-based auto-join (clicking shared link auto-fills room code)
29. The application **must** synchronize the following game state in real-time:
    - Dice roll results
    - Chip collection updates
    - Turn changes
    - Chat messages
    - Winner detection
30. The application **must** display connection status notifications ("Player connected", "Player disconnected")
31. The application **must** provide a "Copy Link" button to share room URLs
32. The application **must** work without a custom backend server (using PeerJS cloud signaling)

### 4.6 Lobby System
33. The lobby **must** allow players to enter their name (max 15 characters)
34. The lobby **must** provide a "Generate Room" button to create a new peer ID
35. The lobby **must** display room code in user-friendly format (e.g., "Room: PEER_A")
36. The lobby **must** show a list of connected players
37. The lobby **must** provide a "Start Game" button to transition to gameplay
38. The lobby **must** allow players to leave and return to main menu

### 4.7 Chat System
39. The application **must** include an in-game chat interface (collapsible/expandable)
40. Chat **must** support real-time message delivery between connected peers
41. Chat messages **must** display sender name and message content
42. Chat **must** include a toggle button to show/hide the chat panel
43. Chat **must** support sending messages via button click or Enter key

### 4.8 Tutorial System
44. The application **must** provide a tutorial screen explaining:
    - Game objective (first to 3 green chips wins)
    - Dice rolling mechanics
    - Chip collection rules (triple, pair, no match)
    - Winning conditions
45. The tutorial **must** be accessible from the main menu
46. The tutorial **must** provide a "Got It!" button to return to main menu

### 4.9 Settings & Audio (Placeholder)
47. The application **must** include a settings button in the main menu
48. The application **must** support future audio implementation (sound effects and background music)
49. Audio settings **must** include volume control and enable/disable toggle

### 4.10 Performance Requirements
50. Initial page load **must** complete within 3 seconds on 3G connections
51. Screen transitions **must** complete within 300ms
52. Dice roll animations **must** complete within 2-3 seconds
53. Peer-to-peer message latency **must** be under 200ms for real-time chat
54. The application **must** handle graceful degradation on slower devices

### 4.11 Deployment & Testing
55. The application **must** be deployable to static hosting (GitHub Pages, Netlify, Vercel)
56. The application **must** provide localhost testing instructions using http-server
57. The application **must** support incognito/private window testing for local multiplayer simulation
58. The application **must** handle URL parameters for room code persistence

### 4.12 Browser Compatibility
59. The application **must** support the following browsers:
    - Chrome/Edge (latest 2 versions)
    - Safari (latest 2 versions)
    - Mobile Safari (iOS 13+)
    - Chrome for Android (latest 2 versions)
60. The application **must** provide fallback messaging for unsupported browsers

---

## 5. Technical Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **3D Graphics**: Three.js (v0.160.0)
- **Multiplayer**: PeerJS (WebRTC peer-to-peer)
- **PWA**: Service Worker API, Web App Manifest
- **Dev Server**: http-server (local development)
- **Deployment**: Static hosting (GitHub Pages, Netlify, Vercel)

### File Structure
```
/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching
├── package.json            # Dependencies
├── styles/
│   └── main.css           # All styles
├── scripts/
│   ├── game.js            # Core game logic
│   ├── dice3d.js          # Three.js 3D dice
│   └── websocket.js       # PeerJS manager (peer-to-peer)
└── assets/
    └── icon-*.svg         # App icons
```

---

## 6. Non-Functional Requirements

### Security & Privacy
- Peer-to-peer connections ensure game data is not stored on third-party servers
- PeerJS signaling server only facilitates initial connection handshake
- No user authentication or personal data collection required

### Scalability
- Peer-to-peer architecture supports unlimited concurrent games without server infrastructure
- No backend server required (zero operational costs)

### Usability
- One-click room creation and joining via shareable links
- Tutorial available for first-time players
- Mobile-first design with touch-optimized controls

### Reliability
- Graceful handling of peer disconnections
- Offline-capable for cached assets
- Error notifications for connection issues

---

## 7. Success Metrics

1. **Load Time**: 90% of users experience initial load in < 3 seconds
2. **Install Rate**: 20% of users install the PWA to home screen
3. **Multiplayer Connection Success**: 95% of peer connections establish within 5 seconds
4. **Session Duration**: Average gameplay session > 5 minutes
5. **Frame Rate**: 3D dice animations maintain 60fps on 80% of devices
6. **Peer-to-Peer Latency**: Real-time message delivery < 200ms for 90% of connections

---

## 8. Future Enhancements (Out of Scope for v1.0)

- Audio system (sound effects, background music)
- Advanced game modes (tournaments, challenges)
- Player profiles and statistics tracking
- Spectator mode for non-players
- Advanced settings (difficulty levels, timer options)
- Native app versions (iOS/Android via Capacitor)
- Backend server for persistent rooms and matchmaking

---

## 9. Documentation & Resources

- **README.md**: Overview, installation, gameplay instructions
- **MULTIPLAYER.md**: Peer-to-peer multiplayer technical details
- **QUICKSTART.md**: Deployment and testing guide for cofounders
- **DEPLOYMENT.md**: Production deployment checklist
- **TESTING.md**: Testing procedures and test cases

---

## 10. Dependencies

### Runtime Dependencies
- `three`: ^0.160.0 (3D graphics rendering)
- PeerJS CDN (peer-to-peer connectivity via unpkg/jsdelivr)

### Development Dependencies
- `http-server`: ^14.1.1 (local development server)

---

## 11. Constraints & Assumptions

### Constraints
- Peer-to-peer connections may fail on restrictive corporate networks with WebRTC blocked
- Safari on iOS requires special handling for PWA installation
- 3D graphics performance depends on device GPU capabilities
- Offline gameplay limited to single-player or cached game states

### Assumptions
- Users have modern browsers with WebRTC support
- Users have stable internet connection for multiplayer (3G or better)
- Users understand basic dice game mechanics
- PeerJS cloud signaling server remains available and free

---

## Approval & Sign-off

**Version**: 1.0  
**Status**: Implemented  
**Date**: December 26, 2025  
**Branch**: `copilot/add-mobile-dice-game`  
**Pull Request**: #1 - Implement All or Nothing PWA dice game with 3D graphics and real-time multiplayer
