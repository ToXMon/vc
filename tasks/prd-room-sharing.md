# PRD: Seamless Room Code Sharing Experience

## Introduction/Overview

When a user creates a multiplayer room in the All or Nothing dice game, they need an easy and frictionless way to share the room code with friends. Currently, after room creation, a loading popup persists on the screen, disrupting the user experience. This feature enhances the room creation flow by automatically presenting share options and ensuring the loading state resolves gracefully.

**Problem:** Users experience friction when trying to share room codes with friends, and a lingering loading popup degrades the post-room-creation experience.

**Solution:** Implement a seamless share flow with copy-to-clipboard and native share capabilities, auto-dismiss loading states, and persistent access to share functionality in the lobby.

## Goals

1. **Reduce friction** in sharing room codes by at least 50% (measured by fewer steps to share)
2. **Eliminate loading popup persistence** - loading states auto-dismiss within 1-2 seconds after room creation
3. **Increase multiplayer adoption** by making it easier to invite friends
4. **Provide multiple sharing options** that work across devices (clipboard + native share)

## User Stories

### US-1: Room Creator Shares Code Immediately
**As a** room creator,  
**I want** a share popup to appear automatically after I create a room,  
**So that** I can quickly invite my friend without searching for the room code.

### US-2: Room Creator Uses Native Share
**As a** mobile user who created a room,  
**I want** to use my device's native share dialog,  
**So that** I can share the room code via my preferred messaging app (WhatsApp, iMessage, etc.).

### US-3: Room Creator Copies Code to Clipboard
**As a** room creator,  
**I want** to copy the room code to my clipboard with one tap,  
**So that** I can paste it into any app or conversation.

### US-4: Room Creator Accesses Share Later
**As a** room creator waiting in the lobby,  
**I want** to access the share options at any time,  
**So that** I can invite additional friends or re-share if needed.

### US-5: Smooth Loading Transition
**As a** user creating or joining a room,  
**I want** the loading indicator to disappear automatically,  
**So that** I'm not stuck looking at a loading screen after the action is complete.

## Functional Requirements

### Loading State Management

1. **FR-1:** The system must auto-dismiss the loading popup within 1-2 seconds after successful room creation or joining.
2. **FR-2:** The system must display appropriate error messages if room creation/joining fails, and dismiss the loading popup.
3. **FR-3:** The loading popup must not persist indefinitely under any circumstance.

### Share Popup (Auto-Display)

4. **FR-4:** The system must display a share modal/popup automatically after a room is successfully created (after loading dismisses).
5. **FR-5:** The share popup must display the room code prominently and clearly.
6. **FR-6:** The share popup must include a "Copy to Clipboard" button.
7. **FR-7:** The share popup must include a "Share" button that triggers the device's native share dialog (Web Share API).
8. **FR-8:** If the Web Share API is not available (e.g., desktop browsers without support), the "Share" button must be hidden or disabled, with copy-to-clipboard as the primary option.
9. **FR-9:** The share popup must be dismissible via a close button or tapping outside the modal.
10. **FR-10:** The share message format must be: "Join my All or Nothing game! Room: [ROOM_CODE]"

### Persistent Share Access in Lobby

11. **FR-11:** The room lobby UI must include a visible "Share" or "Invite" button at all times while in the lobby.
12. **FR-12:** Clicking the lobby share button must open the same share modal with copy and native share options.
13. **FR-13:** The room code must be visible in the lobby UI even without opening the share modal.

### Clipboard Feedback

14. **FR-14:** When the user copies the room code, the system must display visual feedback (e.g., "Copied!" toast or button state change).
15. **FR-15:** The copy feedback must auto-dismiss after 2 seconds.

### Native Share Integration

16. **FR-16:** The native share dialog must pre-fill with the share message: "Join my All or Nothing game! Room: [ROOM_CODE]"
17. **FR-17:** The system must handle share cancellation gracefully (no errors shown to user).

## Non-Functional Requirements

- **NFR-1:** Share actions must complete within 100ms (perceived instant)
- **NFR-2:** The share UI must be mobile-first and touch-friendly
- **NFR-3:** The feature must work offline (copy to clipboard) if the room was already created

## Out of Scope

- QR code generation for room sharing
- Deep-link URLs that auto-join rooms
- Share analytics/tracking
- Social media-specific sharing integrations

## Success Criteria

1. Loading popup no longer persists after room creation
2. Users can share room code within 2 taps of creating a room
3. Both copy-to-clipboard and native share work on supported devices
4. Share functionality remains accessible throughout the lobby experience
