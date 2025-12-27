# Tasks: Room Sharing Feature Implementation

Based on PRD: [prd-room-sharing.md](prd-room-sharing.md)

## Overview

This task list implements the seamless room code sharing experience, including auto-dismissing loading states, share modal with copy/native share functionality, and persistent share access in the lobby.

---

## Task 1: Create Share Modal HTML Structure

**File:** `index.html`

**Description:** Add the share modal markup that will display the room code and sharing options.

**Requirements:**
- Add a new modal div with id `share-modal`
- Include prominent room code display
- Add "Copy to Clipboard" button with id `btn-copy-code`
- Add "Share" button with id `btn-native-share` for Web Share API
- Add close button to dismiss modal
- Style-ready with appropriate classes

**Acceptance Criteria:**
- [ ] Modal is hidden by default
- [ ] Room code is displayed prominently
- [ ] Copy and Share buttons are clearly visible
- [ ] Close button/dismiss area exists

---

## Task 2: Add Share Modal and Toast Notification Styles

**File:** `styles/main.css`

**Description:** Create CSS styles for the share modal, buttons, and "Copied!" toast feedback.

**Requirements:**
- Modal overlay styling (centered, dark backdrop)
- Modal container with game-consistent styling (use existing CSS variables)
- Large, readable room code display
- Button styling for copy and share actions
- Toast notification for "Copied!" feedback
- Mobile-first responsive design
- Smooth animations for modal open/close

**Acceptance Criteria:**
- [ ] Modal matches game's visual style
- [ ] Buttons are touch-friendly (minimum 44px tap targets)
- [ ] Toast appears and auto-dismisses
- [ ] Works on mobile and desktop

---

## Task 3: Implement Share Modal Controller in game.js

**File:** `scripts/game.js`

**Description:** Add methods to show/hide the share modal and handle share actions.

**New Methods:**
- `showShareModal(roomCode)` - Display modal with room code
- `hideShareModal()` - Close the modal
- `copyRoomCode()` - Copy code to clipboard with feedback
- `nativeShare(roomCode)` - Trigger Web Share API if available
- `showCopiedToast()` - Display "Copied!" feedback

**Requirements:**
- Check for Web Share API availability (`navigator.share`)
- Hide native share button if API not available
- Format share message: "Join my All or Nothing game! Room: [CODE]"
- Auto-dismiss toast after 2 seconds

**Acceptance Criteria:**
- [ ] Modal can be opened and closed programmatically
- [ ] Copy to clipboard works with visual feedback
- [ ] Native share triggers device share sheet on mobile
- [ ] Graceful fallback when Web Share API unavailable

---

## Task 4: Update Room Creation Flow to Show Share Modal

**File:** `scripts/game.js`

**Description:** Modify `startGameFromLobby()` to show the share modal automatically after successful room creation (host only).

**Changes to `startGameFromLobby()`:**
- After successful `createRoom()` call, trigger `showShareModal(roomCode)`
- Only show for host (room creator), not for joiners
- Modal should appear after transitioning to game screen

**Acceptance Criteria:**
- [ ] Share modal appears automatically after room creation
- [ ] Does NOT appear when joining an existing room
- [ ] Modal shows correct room code

---

## Task 5: Add Persistent Share Button to Game Screen

**File:** `index.html`

**Description:** Add an "Invite" button to the game header that allows re-opening the share modal at any time.

**Changes:**
- Add button with id `btn-invite` to `.game-header` or near room code display
- Icon: "📤" or "Share" text

**File:** `scripts/game.js`

**Changes:**
- Add event listener for `btn-invite` that calls `showShareModal()`
- Ensure room code is accessible from game screen

**Acceptance Criteria:**
- [ ] Invite button visible in game screen header
- [ ] Clicking opens share modal with current room code
- [ ] Works throughout the game session

---

## Task 6: Fix Game Status Bar Persistence Issue

**Files:** `scripts/game.js`, `styles/main.css`

**Description:** The `#game-status` bar (showing "Game starting..." or "Waiting for opponent...") persists on screen and disrupts the user experience. It should auto-hide or update appropriately.

**Current Behavior:**
- `#game-status` div is always visible with a fixed position
- Shows "Game starting..." initially, then "Waiting for opponent..."
- Never hides even when game is fully active

**Required Changes:**

1. **Auto-hide the status bar** after game successfully starts:
   - Hide `#game-status` when both players are connected and game begins
   - Or fade out after 2 seconds once game state is "playing"

2. **Add show/hide methods for game status:**
   - `showGameStatus(message)` - display with message
   - `hideGameStatus()` - hide the status bar
   - `hideGameStatusDelayed(ms)` - auto-hide after delay

3. **CSS Updates:**
   - Add `.hidden` class support for `#game-status`
   - Add fade-out transition for smooth dismissal

4. **Trigger Points:**
   - In `handleGameStateUpdate()` - when state.status === 'playing' and it's a player's turn, hide status after brief delay
   - In `startGameFromLobby()` - show "Connecting..." then auto-dismiss
   - After dice roll resolves - don't need persistent "Waiting" message

**Acceptance Criteria:**
- [ ] Status bar auto-hides within 2 seconds after game starts
- [ ] Status bar doesn't block UI during active gameplay
- [ ] Status updates are temporary notifications, not persistent overlays
- [ ] Error states still show appropriate messages

---

## Task 7: Wire Up Event Listeners for Share Modal

**File:** `scripts/game.js`

**Description:** Connect all share modal buttons to their handlers.

**Event Listeners to Add in `setupEventListeners()`:**
- `btn-copy-code` → `copyRoomCode()`
- `btn-native-share` → `nativeShare()`
- `btn-close-share` or modal overlay click → `hideShareModal()`

**Acceptance Criteria:**
- [ ] All buttons trigger correct actions
- [ ] Modal dismissible via close button
- [ ] Modal dismissible by clicking outside (optional)

---

## Task 8: Update Existing Copy Link Button in Lobby

**File:** `scripts/game.js`

**Description:** Enhance the existing `btn-copy-link` in the lobby to use the new toast feedback system.

**Changes:**
- Update `copyRoomLink()` to use new `showCopiedToast()` instead of confirmation dialog
- Make feedback less intrusive (toast vs. modal)

**Acceptance Criteria:**
- [ ] Copy button in lobby shows toast feedback
- [ ] No blocking modal for simple copy action

---

## Task 9: Testing & Edge Cases

**Description:** Manual testing checklist and edge case handling.

**Test Scenarios:**
1. Create room → share modal appears → copy works → dismiss modal
2. Create room → use native share → share sheet opens → cancel → no error
3. Join existing room → no share modal appears
4. Game screen → click invite → share modal opens
5. Offline scenario → appropriate error handling
6. Desktop browser without Web Share API → share button hidden
7. Loading state → always dismisses within 2 seconds

**Edge Cases to Handle:**
- Clipboard API not available (older browsers)
- Web Share API cancellation handling
- Empty room code state

---

## Implementation Order

1. **Task 1** - HTML structure (foundation)
2. **Task 2** - CSS styles (visual foundation)
3. **Task 3** - Core JavaScript methods
4. **Task 6** - Fix loading issue (quick win)
5. **Task 4** - Auto-show share modal on room creation
6. **Task 5** - Persistent invite button
7. **Task 7** - Wire up event listeners
8. **Task 8** - Enhance lobby copy button
9. **Task 9** - Testing

---

## Files Modified

| File | Changes |
|------|---------|
| `index.html` | Add share modal HTML, invite button in game header |
| `styles/main.css` | Share modal styles, toast notification styles |
| `scripts/game.js` | Share modal methods, event listeners, loading fix |

---

## Estimated Effort

- **Total:** ~3-4 hours for a developer familiar with the codebase
- **Task 1-2:** 30 minutes (HTML/CSS)
- **Task 3:** 45 minutes (core logic)
- **Task 4-5:** 30 minutes (integration)
- **Task 6:** 20 minutes (bug fix)
- **Task 7-8:** 20 minutes (wiring)
- **Task 9:** 45 minutes (testing)
