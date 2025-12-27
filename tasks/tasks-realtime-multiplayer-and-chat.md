# Tasks: Real-Time Multiplayer and Chat

## High-Level Tasks
- [x] 0.0 Create feature branch
- [x] 1. Set up Firebase RTDB client config and anonymous rules for rooms/chat
- [x] 2. Implement room lifecycle: create/join via URL, lobby roster, presence, host handling, cleanup
- [x] 3. Sync game state via RTDB transactions: turn validation, dice results, chip updates, win/finish flow
- [x] 4. Build real-time chat experience with throttling, pruning, and error handling
- [x] 5. Add connection/offline UX: status badges, action gating, reconnection/backoff behavior
- [x] 6. Add automated tests: reducer unit tests and Playwright two-client E2E for lobby, chat, sync, win, disconnect
- [x] 7. Update deployment/docs and developer ergonomics (env setup, scripts, GitHub Pages notes)

## Parent Tasks and Sub-Tasks

### 0.0 Create feature branch ✅
- [x] 0.0.1 Verify we are on a dedicated feature branch (copilot/add-mobile-dice-game) or create one if needed.
- [x] 0.0.2 Push branch to origin to share work-in-progress.

### 1. Set up Firebase RTDB client config and anonymous rules for rooms/chat ✅
- [x] 1.1 Add Firebase config placeholders (apiKey, authDomain, databaseURL, etc.) and local env guidance.
- [x] 1.2 Create a Firebase client bootstrap module to initialize app + RTDB singleton and expose helpers.
- [x] 1.3 Add Firebase Realtime Database security rules file for anonymous, room-scoped writes (rooms/{roomId}).
- [x] 1.4 Wire npm scripts/docs for deploying rules (or manual console copy) and loading config in static hosting.

### 2. Implement room lifecycle: create/join via URL, lobby roster, presence, host handling, cleanup ✅
- [x] 2.1 Add room id generator (6–12 chars) and lobby creation flow; write initial room metadata to RTDB.
- [x] 2.2 Auto-join via `?room={roomId}` link; fetch room, validate capacity (max 2), and show friendly rejection if full/closed.
- [x] 2.3 Implement lobby roster UI: player names, ready/connected status, host indicator, start control gated to host with 2 players.
- [x] 2.4 Presence: write presence node per client with `onDisconnect` to mark offline; reflect opponent presence within 2s.
- [x] 2.5 Cleanup/leave: remove listeners, release presence, transfer host on host exit, and mark room closed when empty/finished.

### 3. Sync game state via RTDB transactions: turn validation, dice results, chip updates, win/finish flow ✅
- [x] 3.1 Define RTDB state shape under rooms/{roomId}/state (status, currentPlayer, dice, chips per player, winnerId, updatedAt).
- [x] 3.2 Implement transaction for dice roll + turn advance that validates active player, writes dice, and applies chip award rules.
- [x] 3.3 Apply chip rules: triple → green chip; pair → red chip; none → heart chip; update per-player counts.
- [x] 3.4 Detect win: first to 3 green chips sets status=finished and winnerId; broadcast to both clients.
- [x] 3.5 Enforce action gating: disable roll when not your turn or when offline; show inline error/toast on failed writes.

### 4. Build real-time chat experience with throttling, pruning, and error handling ✅
- [x] 4.1 Implement chat data model under rooms/{roomId}/chat with sender name, message, timestamp.
- [x] 4.2 Add client-side length validation (<=240 chars) and throttle (e.g., 1 msg/sec) before writing to RTDB.
- [x] 4.3 Live subscription renders chat updates in order; show send errors/retries; disable when offline.
- [x] 4.4 Prune chat list to last N (e.g., 50) on new message write to bound costs; clear chat on room close.

### 5. Add connection/offline UX: status badges, action gating, reconnection/backoff behavior ✅
- [x] 5.1 Surface connection status badge (connected/reconnecting/offline) and inline errors for blocked actions.
- [x] 5.2 Add exponential backoff reconnect attempts and UI indicator while reconnecting.
- [x] 5.3 Hide/disable multiplayer entry points when offline; preserve solo/offline play intact.

### 6. Add automated tests: reducer unit tests and Playwright two-client E2E for lobby, chat, sync, win, disconnect ✅
- [x] 6.1 Add pure game-state reducer tests for dice outcomes, chip awards, turn rotation, max 2 players, and win detection.
- [x] 6.2 Add Playwright two-context E2E covering lobby join, chat exchange, dice roll sync, chip update, win propagation, disconnect indicator.
- [x] 6.3 Wire npm scripts (npm test / npm run test:e2e) headless-friendly; document env (target URL, Firebase config).

### 7. Update deployment/docs and developer ergonomics (env setup, scripts, GitHub Pages notes) ✅
- [x] 7.1 Document Firebase config setup, rules deployment, and GitHub Pages hosting steps in README/DEPLOYMENT.
- [x] 7.2 Update TESTING/QUICKSTART with multiplayer + Playwright instructions and env variables.
- [x] 7.3 Add notes on data cleanup expectations and cost/pruning strategy.

## Relevant Files

- scripts/game.js - Core game logic; integrate multiplayer state and turn gating.
- scripts/dice3d.js - Dice rendering; display synced dice results.
- scripts/websocket.js - Existing multiplayer transport; replace or bypass with Firebase RTDB layer.
- scripts/lib/three.min.js - 3D dependency (likely untouched but referenced by dice visuals).
- index.html - UI entry; wire Firebase config, lobby/chat panels, status badges.
- styles/main.css - Styles for lobby, chat, presence, badges, tooltips/toasts.
- service-worker.js - Ensure PWA/offline still works; maybe adjust cache for new assets.
- package.json - Add dependencies (Firebase, Playwright) and test scripts.
- firebase-rules.json (new) - RTDB security rules for room-scoped writes.
- scripts/firebase.js or scripts/data/firebase.js (new) - Firebase bootstrap and RTDB helpers.
- tests/unit/game-reducer.test.js (new) - Reducer unit tests.
- tests/e2e/playwright.config.ts (new) - Playwright setup.
- tests/e2e/multiplayer.spec.ts (new) - Two-client E2E scenarios.

### Notes

- Unit tests should live near the code under test; adjust paths to repo conventions if different.
- Public Firebase config values are safe for client inclusion; keep docs clear on free-tier usage.
- If repo already has test conventions, align filenames/locations accordingly.
