# Testing Guide

## Automated Tests

### Unit Tests

Run pure game logic unit tests (no browser required):

```bash
npm test
```

This runs tests for:
- Dice outcomes and chip awards (triple → green, pair → red, else → heart)
- Chip accumulation
- Win detection (3+ green chips)
- Turn rotation logic
- Room capacity validation (max 2 players)

### E2E Tests (Playwright)

Run end-to-end multiplayer tests:

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with browser visible
npm run test:e2e:headed

# Debug E2E tests interactively
npm run test:e2e:debug
```

E2E tests cover:
- Room creation and joining via URL
- Player roster synchronization
- Chat message exchange between players
- Turn gating (roll button disabled when not your turn)
- Dice roll state sync
- Room full error handling

### Run All Tests

```bash
npm run test:all
```

### Environment Variables for E2E

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_URL` | Target URL for tests | `http://localhost:8080` |

Example for testing a deployed site:
```bash
TEST_URL=https://yourgame.github.io npm run test:e2e
```

---

## Manual Testing

### Test Your Changes Locally

1. **Start the server:**
   ```bash
   npm start
   ```
   (If port 8080 is busy, the app might already be running!)

2. **Open in browser:**
   - Go to `http://localhost:8080`

3. **Test Room Creation:**
   - Click "New Game"
   - Enter your name (e.g., "Player 1")
   - Click "Generate Room"
   - You should see a 6-character room code appear
   - Click "📋 Copy Link" button
   - The link should be copied to your clipboard

4. **Test Room Joining:**
   - Open a new browser tab (or incognito/private window)
   - Paste the link you copied
   - The room code should automatically appear in the "Room Code" field
   - Enter a different name (e.g., "Player 2")
   - Click "Start Game"

5. **Test Real-Time Features:**
   - Open the chat panel (💬 button)
   - Send messages - they should appear on both screens
   - Take turns rolling dice
   - Verify chip counts update on both screens
   - Test disconnection by toggling network (DevTools → Network → Offline)

6. **Verify URL Parameters:**
   - Check the URL bar - it should show: `http://localhost:8080?room=ABCD12`
   - The room code in the URL matches the one in the input field

## What's Tested

✅ **URL-based room joining** - Share links with `?room=CODE` parameter  
✅ **Copy Link button** - One-click copy of shareable room link  
✅ **Auto-fill from URL** - Room code automatically populated from URL  
✅ **Real-time game state** - Dice rolls sync via Firebase RTDB  
✅ **Turn-based play** - Roll button gated to current player  
✅ **Chat messaging** - Real-time chat with throttling  
✅ **Connection status** - Badges show offline/reconnecting states  
✅ **Win detection** - First to 3 green chips wins  

## Quick Deployment Tonight

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

**Fastest option (GitHub Pages):**
1. `git add .`
2. `git commit -m "Add multiplayer improvements"`
3. `git push`
4. Enable GitHub Pages in repo settings
5. Share the link with your cofounder!
