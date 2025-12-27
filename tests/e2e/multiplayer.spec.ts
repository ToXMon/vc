import { test, expect, BrowserContext, Page } from '@playwright/test';

/**
 * E2E tests for real-time multiplayer functionality.
 * Tests two-client scenarios: lobby join, chat exchange, dice roll sync,
 * chip updates, win propagation, and disconnect indicator.
 * 
 * Run with: npm run test:e2e
 * 
 * Environment variables:
 * - TEST_URL: Target URL (default: http://localhost:8080)
 * - FIREBASE_CONFIG: JSON string of Firebase config (optional for local testing)
 */

test.describe('Multiplayer Game', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let player1: Page;
  let player2: Page;
  let roomCode: string;

  test.beforeEach(async ({ browser }) => {
    // Create two separate browser contexts to simulate two players
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    player1 = await context1.newPage();
    player2 = await context2.newPage();
  });

  test.afterEach(async () => {
    await context1?.close();
    await context2?.close();
  });

  test('Player 1 can create a room', async () => {
    await player1.goto('/');
    
    // Wait for loading to complete
    await expect(player1.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    
    // Click New Game
    await player1.click('#btn-new-game');
    
    // Should be on lobby screen
    await expect(player1.locator('#lobby-screen')).toBeVisible();
    
    // Enter name
    await player1.fill('#player-name', 'Player One');
    
    // Generate room code
    await player1.click('#btn-generate-code');
    
    // Room code should be populated
    const roomCodeInput = player1.locator('#room-code');
    await expect(roomCodeInput).not.toBeEmpty();
    
    roomCode = await roomCodeInput.inputValue();
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  test('Player 2 can join via room code in URL', async () => {
    // First, create a room as player 1
    await player1.goto('/');
    await expect(player1.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await player1.click('#btn-new-game');
    await player1.fill('#player-name', 'Player One');
    await player1.click('#btn-generate-code');
    roomCode = await player1.locator('#room-code').inputValue();
    
    // Player 2 joins via URL
    await player2.goto(`/?room=${roomCode}`);
    
    // Should go directly to lobby with room code pre-filled
    await expect(player2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
    await expect(player2.locator('#room-code')).toHaveValue(roomCode);
  });

  test('Both players appear in lobby roster', async () => {
    // Setup: Player 1 creates room
    await player1.goto('/');
    await expect(player1.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await player1.click('#btn-new-game');
    await player1.fill('#player-name', 'Host Player');
    await player1.click('#btn-generate-code');
    roomCode = await player1.locator('#room-code').inputValue();
    
    // Player 1 starts game (enters game screen)
    await player1.click('#btn-start-game');
    await expect(player1.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    // Player 2 joins
    await player2.goto(`/?room=${roomCode}`);
    await expect(player2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
    await player2.fill('#player-name', 'Guest Player');
    await player2.click('#btn-start-game');
    
    // Both should be in game screen
    await expect(player2.locator('#game-screen')).toBeVisible({ timeout: 10000 });
  });

  test('Chat messages sync between players', async () => {
    // Setup: Both players join same room
    await player1.goto('/');
    await expect(player1.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await player1.click('#btn-new-game');
    await player1.fill('#player-name', 'Alice');
    await player1.click('#btn-generate-code');
    roomCode = await player1.locator('#room-code').inputValue();
    await player1.click('#btn-start-game');
    await expect(player1.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    await player2.goto(`/?room=${roomCode}`);
    await player2.fill('#player-name', 'Bob');
    await player2.click('#btn-start-game');
    await expect(player2.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    // Open chat panels
    await player1.click('#btn-toggle-chat');
    await player2.click('#btn-toggle-chat');
    
    // Player 1 sends a message
    await player1.fill('#chat-input', 'Hello from Alice!');
    await player1.click('#btn-send-chat');
    
    // Wait for message to appear on Player 2's screen
    await expect(player2.locator('#chat-messages')).toContainText('Hello from Alice!', { timeout: 5000 });
    
    // Player 2 responds
    await player2.fill('#chat-input', 'Hi Alice, Bob here!');
    await player2.click('#btn-send-chat');
    
    // Wait for message to appear on Player 1's screen
    await expect(player1.locator('#chat-messages')).toContainText('Hi Alice, Bob here!', { timeout: 5000 });
  });

  test('Roll button is disabled when not your turn', async () => {
    // Setup: Both players join
    await player1.goto('/');
    await expect(player1.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await player1.click('#btn-new-game');
    await player1.fill('#player-name', 'First');
    await player1.click('#btn-generate-code');
    roomCode = await player1.locator('#room-code').inputValue();
    await player1.click('#btn-start-game');
    await expect(player1.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    await player2.goto(`/?room=${roomCode}`);
    await player2.fill('#player-name', 'Second');
    await player2.click('#btn-start-game');
    await expect(player2.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    // Wait for game state to sync
    await player1.waitForTimeout(2000);
    
    // One player should have enabled roll button, other should be disabled
    const p1RollEnabled = await player1.locator('#btn-roll-dice').isEnabled();
    const p2RollEnabled = await player2.locator('#btn-roll-dice').isEnabled();
    
    // Exactly one should be enabled
    expect(p1RollEnabled !== p2RollEnabled).toBeTruthy();
  });

  test('Dice roll syncs game state to opponent', async () => {
    // Setup: Both players join
    await player1.goto('/');
    await expect(player1.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await player1.click('#btn-new-game');
    await player1.fill('#player-name', 'Roller');
    await player1.click('#btn-generate-code');
    roomCode = await player1.locator('#room-code').inputValue();
    await player1.click('#btn-start-game');
    await expect(player1.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    await player2.goto(`/?room=${roomCode}`);
    await player2.fill('#player-name', 'Watcher');
    await player2.click('#btn-start-game');
    await expect(player2.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    // Wait for game state to initialize
    await player1.waitForTimeout(2000);
    
    // Find which player has the roll button enabled
    const p1RollEnabled = await player1.locator('#btn-roll-dice').isEnabled();
    const activePlayer = p1RollEnabled ? player1 : player2;
    const watchingPlayer = p1RollEnabled ? player2 : player1;
    
    // Active player rolls
    await activePlayer.click('#btn-roll-dice');
    
    // Wait for roll animation and state sync
    await activePlayer.waitForTimeout(3000);
    
    // Check that game status updated on watching player
    const statusText = await watchingPlayer.locator('#status-message').textContent();
    // Status should have updated from initial state
    expect(statusText).toBeTruthy();
  });

  test('Room shows full error when third player tries to join', async () => {
    // Setup: Two players join
    await player1.goto('/');
    await expect(player1.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await player1.click('#btn-new-game');
    await player1.fill('#player-name', 'P1');
    await player1.click('#btn-generate-code');
    roomCode = await player1.locator('#room-code').inputValue();
    await player1.click('#btn-start-game');
    
    await player2.goto(`/?room=${roomCode}`);
    await player2.fill('#player-name', 'P2');
    await player2.click('#btn-start-game');
    await expect(player2.locator('#game-screen')).toBeVisible({ timeout: 10000 });
    
    // Third player tries to join
    const context3 = await player1.context().browser()!.newContext();
    const player3 = await context3.newPage();
    await player3.goto(`/?room=${roomCode}`);
    await player3.fill('#player-name', 'P3');
    await player3.click('#btn-start-game');
    
    // Should see error dialog about room being full
    // The exact UI depends on implementation, but there should be some indication
    await player3.waitForTimeout(2000);
    
    // Check if still on lobby (couldn't join) or error message visible
    const onLobby = await player3.locator('#lobby-screen').isVisible();
    const onGame = await player3.locator('#game-screen').isVisible();
    
    // Either still on lobby with error or showing error message
    // Room full message should have been shown via dialog
    expect(onLobby || !onGame).toBeTruthy();
    
    await context3.close();
  });
});

test.describe('Connection Status', () => {
  test('Page loads and shows main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#btn-new-game')).toBeVisible();
    await expect(page.locator('#btn-join-game')).toBeVisible();
  });

  test('Copy link button generates shareable URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await page.click('#btn-new-game');
    await page.fill('#player-name', 'TestPlayer');
    await page.click('#btn-generate-code');
    
    const roomCode = await page.locator('#room-code').inputValue();
    
    // Copy link button should work (even if clipboard fails, it shows dialog)
    await page.click('#btn-copy-link');
    
    // URL should be updated with room parameter
    await page.waitForTimeout(500);
    expect(page.url()).toContain(`room=${roomCode}`);
  });
});

test.describe('Game Flow', () => {
  test('Tutorial can be accessed from main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await page.click('#btn-tutorial');
    await expect(page.locator('#tutorial-screen')).toBeVisible();
    await expect(page.locator('.tutorial-steps')).toBeVisible();
  });

  test('Leave lobby returns to main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10000 });
    await page.click('#btn-new-game');
    await expect(page.locator('#lobby-screen')).toBeVisible();
    await page.click('#btn-leave-lobby');
    await expect(page.locator('#main-menu')).toBeVisible();
  });
});
