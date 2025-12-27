/**
 * Unit tests for game state reducer logic.
 * Tests dice outcomes, chip awards, turn rotation, max 2 players, and win detection.
 * 
 * Run with: npm test
 */

// Pure game logic functions extracted for testing
// These mirror the logic in firebase-room.js rollDiceTransaction

/**
 * Determine chip award based on dice values.
 * @param {number[]} values - Array of 3 dice values (1-6)
 * @returns {{ green: number, red: number, heart: number }}
 */
function calculateChipAward(values) {
  if (values.length !== 3) {
    throw new Error('Expected 3 dice values');
  }
  
  const [a, b, c] = values;
  const allSame = a === b && b === c;
  const hasPair = a === b || b === c || a === c;
  
  if (allSame) {
    return { green: 1, red: 0, heart: 0 };
  } else if (hasPair) {
    return { green: 0, red: 1, heart: 0 };
  } else {
    return { green: 0, red: 0, heart: 1 };
  }
}

/**
 * Apply chip award to player chips.
 * @param {{ green: number, red: number, heart: number }} currentChips
 * @param {{ green: number, red: number, heart: number }} award
 * @returns {{ green: number, red: number, heart: number }}
 */
function applyChipAward(currentChips, award) {
  return {
    green: currentChips.green + award.green,
    red: currentChips.red + award.red,
    heart: currentChips.heart + award.heart,
  };
}

/**
 * Check if player has won (3+ green chips).
 * @param {{ green: number, red: number, heart: number }} chips
 * @returns {boolean}
 */
function checkWin(chips) {
  return chips.green >= 3;
}

/**
 * Get next player in turn order.
 * @param {string[]} playerOrder
 * @param {string} currentPlayer
 * @returns {string}
 */
function getNextPlayer(playerOrder, currentPlayer) {
  const currentIndex = playerOrder.indexOf(currentPlayer);
  if (currentIndex === -1) {
    throw new Error('Current player not in order');
  }
  return playerOrder[(currentIndex + 1) % playerOrder.length];
}

/**
 * Validate game can accept a roll.
 * @param {{ status: string, currentPlayer: string }} state
 * @param {string} playerId
 * @returns {{ valid: boolean, error?: string }}
 */
function validateRoll(state, playerId) {
  if (state.status !== 'playing') {
    return { valid: false, error: 'Game is not in playing state' };
  }
  if (state.currentPlayer !== playerId) {
    return { valid: false, error: 'Not your turn' };
  }
  return { valid: true };
}

/**
 * Validate room capacity (max 2 players).
 * @param {string[]} currentPlayers
 * @param {string} newPlayerId
 * @returns {{ valid: boolean, error?: string }}
 */
function validateJoin(currentPlayers, newPlayerId) {
  if (currentPlayers.includes(newPlayerId)) {
    return { valid: true }; // Already in room
  }
  if (currentPlayers.length >= 2) {
    return { valid: false, error: 'room_full' };
  }
  return { valid: true };
}

// ========== Test Runner ==========

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assertEqual(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(message || 'Expected true');
  }
}

function assertFalse(value, message = '') {
  if (value) {
    throw new Error(message || 'Expected false');
  }
}

// ========== Tests ==========

// Chip Award Tests
test('Triple dice awards green chip', () => {
  const award = calculateChipAward([6, 6, 6]);
  assertEqual(award, { green: 1, red: 0, heart: 0 });
});

test('Triple ones awards green chip', () => {
  const award = calculateChipAward([1, 1, 1]);
  assertEqual(award, { green: 1, red: 0, heart: 0 });
});

test('Pair (first two match) awards red chip', () => {
  const award = calculateChipAward([3, 3, 5]);
  assertEqual(award, { green: 0, red: 1, heart: 0 });
});

test('Pair (last two match) awards red chip', () => {
  const award = calculateChipAward([2, 4, 4]);
  assertEqual(award, { green: 0, red: 1, heart: 0 });
});

test('Pair (first and last match) awards red chip', () => {
  const award = calculateChipAward([5, 2, 5]);
  assertEqual(award, { green: 0, red: 1, heart: 0 });
});

test('No match awards heart chip', () => {
  const award = calculateChipAward([1, 2, 3]);
  assertEqual(award, { green: 0, red: 0, heart: 1 });
});

test('All different values awards heart chip', () => {
  const award = calculateChipAward([4, 5, 6]);
  assertEqual(award, { green: 0, red: 0, heart: 1 });
});

// Chip Application Tests
test('Apply green chip to empty chips', () => {
  const result = applyChipAward({ green: 0, red: 0, heart: 0 }, { green: 1, red: 0, heart: 0 });
  assertEqual(result, { green: 1, red: 0, heart: 0 });
});

test('Apply chip awards accumulate', () => {
  let chips = { green: 0, red: 0, heart: 0 };
  chips = applyChipAward(chips, { green: 1, red: 0, heart: 0 });
  chips = applyChipAward(chips, { green: 0, red: 1, heart: 0 });
  chips = applyChipAward(chips, { green: 1, red: 0, heart: 0 });
  assertEqual(chips, { green: 2, red: 1, heart: 0 });
});

// Win Detection Tests
test('Player with 3 green chips wins', () => {
  assertTrue(checkWin({ green: 3, red: 0, heart: 0 }));
});

test('Player with more than 3 green chips wins', () => {
  assertTrue(checkWin({ green: 5, red: 2, heart: 1 }));
});

test('Player with 2 green chips has not won', () => {
  assertFalse(checkWin({ green: 2, red: 5, heart: 10 }));
});

test('Player with 0 green chips has not won', () => {
  assertFalse(checkWin({ green: 0, red: 0, heart: 0 }));
});

// Turn Rotation Tests
test('Turn advances from player 1 to player 2', () => {
  const order = ['player_a', 'player_b'];
  const next = getNextPlayer(order, 'player_a');
  assertEqual(next, 'player_b');
});

test('Turn wraps from player 2 back to player 1', () => {
  const order = ['player_a', 'player_b'];
  const next = getNextPlayer(order, 'player_b');
  assertEqual(next, 'player_a');
});

// Roll Validation Tests
test('Roll is valid when playing and correct player', () => {
  const state = { status: 'playing', currentPlayer: 'player_a' };
  const result = validateRoll(state, 'player_a');
  assertTrue(result.valid);
});

test('Roll is invalid when not your turn', () => {
  const state = { status: 'playing', currentPlayer: 'player_a' };
  const result = validateRoll(state, 'player_b');
  assertFalse(result.valid);
  assertEqual(result.error, 'Not your turn');
});

test('Roll is invalid when game is finished', () => {
  const state = { status: 'finished', currentPlayer: 'player_a' };
  const result = validateRoll(state, 'player_a');
  assertFalse(result.valid);
});

test('Roll is invalid when game is in lobby', () => {
  const state = { status: 'lobby', currentPlayer: null };
  const result = validateRoll(state, 'player_a');
  assertFalse(result.valid);
});

// Room Capacity Tests
test('First player can join empty room', () => {
  const result = validateJoin([], 'player_a');
  assertTrue(result.valid);
});

test('Second player can join room with one player', () => {
  const result = validateJoin(['player_a'], 'player_b');
  assertTrue(result.valid);
});

test('Third player cannot join full room', () => {
  const result = validateJoin(['player_a', 'player_b'], 'player_c');
  assertFalse(result.valid);
  assertEqual(result.error, 'room_full');
});

test('Existing player can rejoin', () => {
  const result = validateJoin(['player_a', 'player_b'], 'player_a');
  assertTrue(result.valid);
});

// Integration Test: Full Turn Sequence
test('Full turn sequence: roll, award, check win, advance', () => {
  // Initial state
  let state = {
    status: 'playing',
    currentPlayer: 'player_a',
    playerOrder: ['player_a', 'player_b'],
    chips: {
      player_a: { green: 2, red: 0, heart: 0 },
      player_b: { green: 0, red: 0, heart: 0 },
    },
  };
  
  // Validate roll
  const validation = validateRoll(state, 'player_a');
  assertTrue(validation.valid);
  
  // Roll triple
  const diceValues = [4, 4, 4];
  const award = calculateChipAward(diceValues);
  assertEqual(award, { green: 1, red: 0, heart: 0 });
  
  // Apply award
  state.chips.player_a = applyChipAward(state.chips.player_a, award);
  assertEqual(state.chips.player_a.green, 3);
  
  // Check win
  const hasWon = checkWin(state.chips.player_a);
  assertTrue(hasWon);
  
  // Game should be marked finished
  if (hasWon) {
    state.status = 'finished';
    state.winnerId = 'player_a';
  }
  
  assertEqual(state.status, 'finished');
  assertEqual(state.winnerId, 'player_a');
});

// ========== Run Tests ==========

async function runTests() {
  console.log('Running game reducer unit tests...\n');
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed++;
      console.log(`✓ ${name}`);
    } catch (err) {
      failed++;
      console.log(`✗ ${name}`);
      console.log(`  ${err.message}\n`);
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateChipAward,
    applyChipAward,
    checkWin,
    getNextPlayer,
    validateRoll,
    validateJoin,
    runTests,
  };
}

// Run if executed directly
if (typeof process !== 'undefined' && process.argv[1]?.includes('game-reducer.test.js')) {
  runTests();
}
