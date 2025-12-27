# PRD: Real-Time Multiplayer & Chat (Firebase)

## 1. Introduction / Overview
A production-ready real-time multiplayer and chat layer for **All or Nothing** using **Firebase Realtime Database** (RTDB) so two players can play head-to-head with live dice sync and chat. Must run on static hosting (GitHub Pages), require no custom servers, and include automated tests (Playwright) to verify end-to-end sync.

## 2. Goals
- Deliver a working, reliable real-time experience (dice, chips, turns, chat) for 2-player matches.
- Use cheapest/easiest hosting compatible with GitHub Pages: Firebase RTDB free tier + client SDK only.
- Keep chat and game data ephemeral (in-memory per client, transient in RTDB per room; no long-term storage).
- Provide TDD coverage: headless Playwright scenarios validating sync, chat, and win conditions across two browser contexts.
- Preserve existing PWA/offline behavior for solo use; degrade gracefully when offline (disable online play/chat).

## 3. User Stories
- As a host, I can create a room and share a link so a friend joins instantly.
- As a joiner, I can open the link and enter the room without manual code entry.
- As a player, I see dice rolls, chips, and turn changes reflected in real time for both players.
- As a player, I can send and receive chat messages during the match.
- As a player, I get clear status for connection, reconnecting, and opponent disconnects.
- As a player, the game ends consistently for both peers when someone wins (3 green chips).
- As a returning user, I can still play locally/offline; online play requires connectivity.
- As a developer/tester, I can run automated tests to prove two-browser sync and chat work.

## 4. Functional Requirements (Numbered)

### Architecture & Platform
1. Must use Firebase Realtime Database (client SDK, no custom server) and be deployable on GitHub Pages.
2. Must namespace all game data under a `rooms/{roomId}` path; no user auth required (anonymous access via database rules).
3. Must store only transient match data (room metadata, players, game state, chat) and remove it when the room ends or times out.
4. Must handle network loss: UI shows offline state; block online actions until reconnected; attempt exponential backoff reconnect.

### Rooms & Lobby
5. Host can create a room; app generates a roomId (e.g., 6–12 chars) and writes initial room document in RTDB.
6. Room link includes `?room={roomId}` so joiners auto-resolve and join.
7. Lobby shows player names, ready/connected status, and allows host to start the game when 2 players present.
8. Leaving a room cleans up client listeners; host leaving transfers host role if possible or marks room closed.

### Players & Presence
9. Each client writes a presence entry (connected true/false, lastSeen) under the room; leverage RTDB `onDisconnect` to mark disconnect.
10. UI must reflect opponent presence (connected, reconnecting, disconnected) within 2 seconds of state change.

### Game State Sync
11. Single source of truth for game state stored at `rooms/{roomId}/state` (currentPlayer, dice results, chips per player, status: lobby/playing/finished).
12. Dice roll initiated by active player writes results + turn advance atomically (RTDB transaction) to prevent race conditions.
13. Chip awarding rules:
    - Triple (all dice equal) → add 1 green chip.
    - Pair (two equal) → add 1 red chip.
    - No match → add 1 heart chip.
14. Win condition: first player reaching 3 green chips sets state.status = finished and winnerId; both clients show winner screen.
15. Max players per room: 2 for this scope; reject additional join attempts with a friendly message.

### Chat
16. Chat messages stored under `rooms/{roomId}/chat` with sender name, message, timestamp.
17. Messages are ephemeral: purge on room close and prune to last N (e.g., 50) to bound cost.
18. Chat UI updates in real time; sending requires connection, with visible failure/retry on error.

### Security & Costs
19. Firebase security rules: room nodes writable only if room exists; chat/messages limited by length (e.g., 240 chars) and rate (client-enforced throttle, e.g., 1 msg/sec).
20. No PII stored beyond display name; no authentication required for MVP.
21. Prune stale rooms automatically via client cleanup on win/exit and optional TTL worker (scheduled cleanup is out-of-scope for GitHub Pages; accept orphaned data in free tier constraints).

### UI/UX
22. Add connection status badges (connected/reconnecting/offline) and inline error toasts for failed sends/rolls.
23. Disable actions when offline or not your turn; show tooltips/toasts explaining why.
24. Preserve existing PWA flow; if offline, hide/disable multiplayer entry points with guidance to reconnect.

### Compatibility & Performance
25. Must work on modern mobile/desktop browsers (Chrome/Edge/Safari); handle iOS WebView/PWA constraints.
26. Real-time updates should appear cross-clients within 200–500 ms on typical networks.

### Testing (TDD)
27. Provide Playwright tests that spin up two browser contexts, join the same room, and validate: lobby join, chat exchange, dice roll sync, chip update, win propagation, and disconnect handling.
28. Provide unit tests for game state reducer (dice → chips, turn advance, win detection) independent of transport.
29. CI-friendly: tests runnable via `npm test` (or `npm run test:e2e`), headless by default.

## 5. Non-Functional Requirements
- **Reliability:** Graceful handling of disconnects; UI feedback within 2 seconds.
- **Performance:** Initial load unchanged; real-time updates under 500 ms typical.
- **Cost:** Firebase free tier only; prune chat and rooms to stay within quota.
- **Privacy:** No accounts; minimal data (display names, transient game state).

## 6. Assumptions & Constraints
- GitHub Pages hosting (static); all logic in client; Firebase RTDB reachable from client.
- WebRTC/PeerJS removed for MVP replacement; no TURN/ICE servers required.
- iOS PWA limitations (no background sync); active tab required for updates.

## 7. Risks & Mitigations
- **Network instability:** Show reconnecting state; retry with backoff; block writes while offline.
- **Data contention:** Use RTDB transactions for dice roll + turn advance; validate active player before write.
- **Abuse/spam:** Client-side throttling; length limits; free-tier acceptable exposure.

## 8. Testing Plan (TDD)
- **Unit:** Pure game logic reducer tests (dice outcomes → chips, win detection, turn rotation, max 2 players).
- **Integration/E2E (Playwright):**
  - Host creates room, joiner enters via link, both see lobby status.
  - Chat: each sends a message; both receive and render.
  - Dice roll: host rolls; joiner sees results, chips update, turn changes.
  - Win path: force rolls to reach 3 green chips; both see winner screen.
  - Disconnect: close one context; other sees disconnected indicator.
- Tests run via `npm run test:e2e` (headless by default) and can target deployed GitHub Pages URL or local `http-server`.

## 9. Implementation Notes
- Add Firebase web SDK config (public keys OK) and RTDB rules tuned for anonymous, room-scoped writes.
- Introduce a small client data layer (subscribe/publish helpers) wrapping RTDB listeners and transactions.
- Remove or bypass PeerJS code paths; gate multiplayer entry on Firebase availability.
- Keep offline single-player path intact; multiplayer requires online check.

## 10. Out of Scope (v1)
- Authenticated users, profiles, persistent history.
- Matchmaking beyond direct room links.
- Spectators or >2-player rooms.
- Server-side cleanup/cron jobs.

## 11. Acceptance Criteria
- Two real browsers can play a full match with synced dice, chips, turns, and winner state via Firebase RTDB.
- Chat works bi-directionally in real time within the same room.
- Actions blocked when offline; clear user-facing status shown.
- Playwright E2E suite passes locally against the app.
- Deployed on GitHub Pages with Firebase config and functions working without custom servers.
