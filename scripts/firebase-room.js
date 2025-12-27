// Firebase RTDB helpers for room lifecycle and presence.
// Wraps creation, join, presence, and basic listeners. UI/state wiring remains in game.js.
import { getFirebaseDatabase } from "./firebase.js";
import {
  ref,
  set,
  get,
  onValue,
  onDisconnect,
  serverTimestamp,
  update,
  child,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars
const ROOM_ID_LEN = 6;

export function generateRoomId(len = ROOM_ID_LEN) {
  let id = "";
  for (let i = 0; i < len; i++) {
    id += ROOM_ID_ALPHABET[Math.floor(Math.random() * ROOM_ID_ALPHABET.length)];
  }
  return id;
}

export async function createRoom({ roomId = generateRoomId(), hostId, hostName }) {
  if (!hostId) throw new Error("hostId required");
  const db = getFirebaseDatabase();
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    // regenerate on collision
    return createRoom({ roomId: generateRoomId(), hostId, hostName });
  }
  const now = Date.now();
  await set(roomRef, {
    metadata: {
      hostId,
      status: "lobby",
      createdAt: now,
    },
    players: {
      [hostId]: {
        name: hostName || "Host",
        joinedAt: now,
      },
    },
    presence: {},
    state: {
      status: "lobby",
      currentPlayer: null,
      dice: { g: 0, r: 0, y: 0 },
      chips: {},
      winnerId: null,
      updatedAt: now,
    },
    chat: {},
  });
  return { roomId };
}

export async function joinRoom({ roomId, playerId, playerName }) {
  if (!roomId || !playerId) throw new Error("roomId and playerId required");
  const db = getFirebaseDatabase();
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  if (!snap.exists()) {
    throw new Error("room_not_found");
  }
  const data = snap.val();
  const players = data.players || {};
  if (Object.keys(players).length >= 2 && !players[playerId]) {
    throw new Error("room_full");
  }
  const now = Date.now();
  await update(roomRef, {
    [`players/${playerId}`]: {
      name: playerName || "Player",
      joinedAt: now,
    },
  });
  return { roomId };
}

export async function getRoom(roomId) {
  const db = getFirebaseDatabase();
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  return snap.exists() ? snap.val() : null;
}

export function subscribeRoom(roomId, callback) {
  const db = getFirebaseDatabase();
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

export function subscribePresence(roomId, callback) {
  const db = getFirebaseDatabase();
  const presenceRef = ref(db, `rooms/${roomId}/presence`);
  return onValue(presenceRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });
}

export async function setPresence(roomId, playerId, connected) {
  const db = getFirebaseDatabase();
  const presenceRef = ref(db, `rooms/${roomId}/presence/${playerId}`);
  const now = Date.now();
  await set(presenceRef, { connected, lastSeen: now });
  onDisconnect(presenceRef)
    .set({ connected: false, lastSeen: Date.now() })
    .catch(() => {});
}

export async function updateMetadata(roomId, patch) {
  const db = getFirebaseDatabase();
  const metaRef = ref(db, `rooms/${roomId}/metadata`);
  await update(metaRef, patch);
}

export async function removePlayer(roomId, playerId) {
  const db = getFirebaseDatabase();
  const updates = {};
  updates[`players/${playerId}`] = null;
  updates[`presence/${playerId}`] = null;
  updates[`state/chips/${playerId}`] = null;
  await update(ref(db, `rooms/${roomId}`), updates);
}

export async function closeRoom(roomId) {
  const db = getFirebaseDatabase();
  await set(ref(db, `rooms/${roomId}`), null);
}

// ================================================================
// Game State Management (Task 3)
// ================================================================

/**
 * RTDB State Shape under rooms/{roomId}/state:
 * {
 *   status: 'lobby' | 'playing' | 'finished',
 *   currentPlayer: string (playerId of whose turn it is),
 *   playerOrder: [playerId1, playerId2], // turn order
 *   dice: { g: number, r: number, y: number }, // last roll
 *   chips: {
 *     [playerId]: { green: number, red: number, heart: number }
 *   },
 *   winnerId: string | null,
 *   updatedAt: number (timestamp)
 * }
 */

/**
 * Initialize game state when starting game from lobby.
 * Sets up player order and initial chip counts.
 */
export async function initializeGameState(roomId, playerIds) {
  if (!roomId || !playerIds || playerIds.length < 2) {
    throw new Error("initializeGameState requires roomId and at least 2 playerIds");
  }
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `rooms/${roomId}/state`);
  
  const initialChips = {};
  playerIds.forEach((pid) => {
    initialChips[pid] = { green: 0, red: 0, heart: 0 };
  });

  const now = Date.now();
  await set(stateRef, {
    status: "playing",
    currentPlayer: playerIds[0],
    playerOrder: playerIds,
    dice: { g: 0, r: 0, y: 0 },
    chips: initialChips,
    winnerId: null,
    updatedAt: now,
  });
}

/**
 * Subscribe to game state changes for real-time sync.
 */
export function subscribeGameState(roomId, callback) {
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `rooms/${roomId}/state`);
  return onValue(stateRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

/**
 * Perform a dice roll using a transaction to ensure atomicity.
 * Validates the current player, writes dice results, applies chip rules,
 * checks for win, and advances turn.
 * 
 * @param {string} roomId
 * @param {string} playerId - The player attempting to roll
 * @param {{ g: number, r: number, y: number }} diceResults - The dice values (1-6 each)
 * @returns {Promise<{ success: boolean, error?: string, state?: object }>}
 */
export async function rollDiceTransaction(roomId, playerId, diceResults) {
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `rooms/${roomId}/state`);

  const result = await runTransaction(stateRef, (currentState) => {
    if (!currentState) {
      // State doesn't exist; abort
      return;
    }

    // Validate game is in progress
    if (currentState.status !== "playing") {
      // Can't roll if game is not playing
      return; // abort transaction
    }

    // Validate it's this player's turn
    if (currentState.currentPlayer !== playerId) {
      return; // abort - not your turn
    }

    // Update dice values
    currentState.dice = {
      g: diceResults.g,
      r: diceResults.r,
      y: diceResults.y,
    };

    // Apply chip rules
    const values = [diceResults.g, diceResults.r, diceResults.y];
    const allSame = values[0] === values[1] && values[1] === values[2];
    const hasPair =
      values[0] === values[1] ||
      values[1] === values[2] ||
      values[0] === values[2];

    // Ensure chips object exists for this player
    if (!currentState.chips) {
      currentState.chips = {};
    }
    if (!currentState.chips[playerId]) {
      currentState.chips[playerId] = { green: 0, red: 0, heart: 0 };
    }

    if (allSame) {
      // Triple: award green chip
      currentState.chips[playerId].green += 1;
    } else if (hasPair) {
      // Pair: award red chip
      currentState.chips[playerId].red += 1;
    } else {
      // No match: award heart chip
      currentState.chips[playerId].heart += 1;
    }

    // Check win condition: first to 3 green chips wins
    if (currentState.chips[playerId].green >= 3) {
      currentState.status = "finished";
      currentState.winnerId = playerId;
    } else {
      // Advance to next player
      const order = currentState.playerOrder || [];
      const currentIndex = order.indexOf(playerId);
      const nextIndex = (currentIndex + 1) % order.length;
      currentState.currentPlayer = order[nextIndex];
    }

    currentState.updatedAt = Date.now();
    return currentState;
  });

  if (!result.committed) {
    return {
      success: false,
      error: "Transaction aborted: invalid state or not your turn",
    };
  }

  return { success: true, state: result.snapshot.val() };
}

/**
 * Check if it's the specified player's turn.
 */
export async function isPlayerTurn(roomId, playerId) {
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `rooms/${roomId}/state`);
  const snap = await get(stateRef);
  if (!snap.exists()) return false;
  const state = snap.val();
  return state.status === "playing" && state.currentPlayer === playerId;
}

/**
 * Get current game state.
 */
export async function getGameState(roomId) {
  const db = getFirebaseDatabase();
  const stateRef = ref(db, `rooms/${roomId}/state`);
  const snap = await get(stateRef);
  return snap.exists() ? snap.val() : null;
}

/**
 * Reset game state for a new round (play again).
 */
export async function resetGameState(roomId) {
  const db = getFirebaseDatabase();
  const roomRef = ref(db, `rooms/${roomId}`);
  const snap = await get(roomRef);
  if (!snap.exists()) throw new Error("Room not found");

  const room = snap.val();
  const playerIds = Object.keys(room.players || {});
  if (playerIds.length < 2) throw new Error("Not enough players to restart");

  const initialChips = {};
  playerIds.forEach((pid) => {
    initialChips[pid] = { green: 0, red: 0, heart: 0 };
  });

  const now = Date.now();
  await update(ref(db, `rooms/${roomId}`), {
    "state/status": "playing",
    "state/currentPlayer": playerIds[0],
    "state/playerOrder": playerIds,
    "state/dice": { g: 0, r: 0, y: 0 },
    "state/chips": initialChips,
    "state/winnerId": null,
    "state/updatedAt": now,
    "metadata/status": "playing",
  });
}

// ================================================================
// Chat Functions (Task 4)
// ================================================================

const MAX_CHAT_MESSAGES = 50;
const CHAT_THROTTLE_MS = 1000;
const MAX_MESSAGE_LENGTH = 240;

// Track last message time per player for throttling
const lastMessageTime = new Map();

/**
 * Send a chat message with validation and throttling.
 * @param {string} roomId 
 * @param {string} playerId 
 * @param {string} playerName 
 * @param {string} message 
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendChatMessage(roomId, playerId, playerName, message) {
  // Validate message length
  if (!message || message.length === 0) {
    return { success: false, error: "Message cannot be empty" };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` };
  }

  // Throttle: 1 message per second
  const lastTime = lastMessageTime.get(playerId) || 0;
  const now = Date.now();
  if (now - lastTime < CHAT_THROTTLE_MS) {
    return { success: false, error: "Please wait before sending another message" };
  }

  const db = getFirebaseDatabase();
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  
  try {
    // Use push to auto-generate unique key
    const { push } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
    const newMessageRef = push(chatRef);
    
    await set(newMessageRef, {
      senderId: playerId,
      senderName: playerName,
      message: message.trim(),
      timestamp: now,
    });

    lastMessageTime.set(playerId, now);

    // Prune old messages to keep only the last N
    await pruneChat(roomId);

    return { success: true };
  } catch (err) {
    console.error("Failed to send chat message:", err);
    return { success: false, error: "Failed to send message" };
  }
}

/**
 * Prune chat to keep only the last N messages.
 */
async function pruneChat(roomId) {
  const db = getFirebaseDatabase();
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  
  try {
    const snap = await get(chatRef);
    if (!snap.exists()) return;

    const messages = snap.val();
    const keys = Object.keys(messages);
    
    if (keys.length <= MAX_CHAT_MESSAGES) return;

    // Sort by timestamp and remove oldest
    const sorted = keys
      .map((k) => ({ key: k, timestamp: messages[k].timestamp || 0 }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const toRemove = sorted.slice(0, keys.length - MAX_CHAT_MESSAGES);
    const updates = {};
    toRemove.forEach((item) => {
      updates[item.key] = null;
    });

    await update(chatRef, updates);
  } catch (err) {
    console.error("Failed to prune chat:", err);
  }
}

/**
 * Subscribe to chat messages.
 * @param {string} roomId 
 * @param {Function} callback - Called with array of messages
 * @returns {Function} Unsubscribe function
 */
export function subscribeChat(roomId, callback) {
  const db = getFirebaseDatabase();
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  
  return onValue(chatRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const data = snapshot.val();
    const messages = Object.entries(data)
      .map(([key, val]) => ({
        id: key,
        senderId: val.senderId,
        senderName: val.senderName,
        message: val.message,
        timestamp: val.timestamp,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    callback(messages);
  });
}

/**
 * Clear all chat messages in a room.
 */
export async function clearChat(roomId) {
  const db = getFirebaseDatabase();
  await set(ref(db, `rooms/${roomId}/chat`), null);
}
