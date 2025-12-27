import {
    createRoom,
    joinRoom,
    getRoom,
    setPresence,
    subscribeRoom,
    removePlayer,
    updateMetadata,
    closeRoom,
    generateRoomId,
    initializeGameState,
    subscribeGameState,
    rollDiceTransaction,
    isPlayerTurn,
    getGameState,
    resetGameState,
    sendChatMessage,
    subscribeChat,
    clearChat
} from './firebase-room.js';

import { subscribeConnectionState } from './firebase.js';

// Main Game Logic for All or Nothing
class AllOrNothingGame {
    constructor() {
        this.dice3D = null;
        this.wsManager = null;
        this.currentScreen = 'loading';
        this.players = [];
        this.currentPlayerIndex = 0;
        this.maxPlayers = 6;
        this.gameState = 'menu'; // menu, lobby, playing, finished
        this.sounds = {
            enabled: true,
            volume: 0.5
        };
        
        this.roomUnsubscribe = null;
        this.presenceUnsubscribe = null;
        this.gameStateUnsubscribe = null;
        this.chatUnsubscribe = null;
        this.connectionUnsubscribe = null;
        this.isOnline = true;
        this.isHost = false;
        this.renderedChatIds = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimer = null;
        this.statusHideTimeout = null;
        this.init();
    }
    
    init() {
        console.log('Initializing All or Nothing...');
        
        // Initialize WebSocket Manager (legacy) and Firebase room helpers (new)
        this.wsManager = new WebSocketManager();
        this.roomId = null;
        this.playerId = null;
        this.playerName = null;
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupWebSocketHandlers();
        this.setupConnectionMonitoring();
        
        // Check for room code in URL
        this.checkURLParameters();
        
        // Hide loading screen and show main menu
        setTimeout(() => {
            this.hideLoading();
            // If there's a room code in URL, go straight to lobby
            const urlParams = new URLSearchParams(window.location.search);
            const roomCode = urlParams.get('room');
            if (roomCode && roomCode.length === 6) {
                this.showScreen('lobby-screen');
                document.getElementById('room-code').value = roomCode.toUpperCase();
                this.roomId = roomCode.toUpperCase();
            } else {
                this.showScreen('main-menu');
            }
        }, 1500);
    }
    
    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        if (roomCode && roomCode.length === 6) {
            // Valid room code found in URL
            console.log('Room code from URL:', roomCode);
            this.roomId = roomCode.toUpperCase();
        }
    }
    
    updateURL(roomCode) {
        if (roomCode) {
            const url = new URL(window.location);
            url.searchParams.set('room', roomCode);
            window.history.pushState({}, '', url);
        }
    }
    
    setupEventListeners() {
        // Main Menu
        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('btn-join-game').addEventListener('click', () => {
            this.joinGame();
        });
        
        document.getElementById('btn-tutorial').addEventListener('click', () => {
            this.showTutorial();
        });
        
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showSettings();
        });
        
        // Lobby
        document.getElementById('btn-generate-code').addEventListener('click', () => {
            this.generateRoomCode();
        });
        
        document.getElementById('btn-copy-link').addEventListener('click', () => {
            this.copyRoomLink();
        });
        
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.startGameFromLobby();
        });
        
        document.getElementById('btn-leave-lobby').addEventListener('click', () => {
            this.leaveLobby();
        });
        
        // Tutorial
        document.getElementById('btn-close-tutorial').addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        // Game
        document.getElementById('btn-roll-dice').addEventListener('click', () => {
            this.rollDice();
        });
        
        document.getElementById('btn-menu').addEventListener('click', () => {
            this.pauseGame();
        });
        
        // Chat
        document.getElementById('btn-toggle-chat').addEventListener('click', () => {
            this.toggleChat();
        });
        
        document.getElementById('btn-send-chat').addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        // Winner Screen
        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.playAgain();
        });
        
        document.getElementById('btn-exit-game').addEventListener('click', () => {
            this.exitToMenu();
        });
        
        // Share Modal
        document.getElementById('btn-copy-code').addEventListener('click', () => {
            this.copyRoomCode();
        });
        
        document.getElementById('btn-native-share').addEventListener('click', () => {
            this.nativeShare();
        });
        
        document.getElementById('btn-close-share').addEventListener('click', () => {
            this.hideShareModal();
        });
        
        document.getElementById('share-modal').addEventListener('click', (e) => {
            // Close modal when clicking overlay (not content)
            if (e.target.id === 'share-modal') {
                this.hideShareModal();
            }
        });
        
        // Invite button in game header
        document.getElementById('btn-invite').addEventListener('click', () => {
            this.showShareModal(this.roomId);
        });
    }
    
    setupWebSocketHandlers() {
        // Room events
        this.wsManager.on('roomCreated', (data) => {
            document.getElementById('room-code').value = data.roomCode;
            document.getElementById('current-room-code').textContent = `Room: ${data.roomCode}`;
            this.updatePlayerList([{ id: this.wsManager.playerId, name: this.wsManager.playerName }]);
        });
        
        this.wsManager.on('roomJoined', (data) => {
            document.getElementById('current-room-code').textContent = `Room: ${data.roomCode}`;
            this.updatePlayerList(data.players);
        });
        
        // Peer connection events
        this.wsManager.on('peerConnected', (data) => {
            console.log('Peer connected:', data.peerId);
            this.showNotification('Player connected!');
        });
        
        this.wsManager.on('peerDisconnected', (data) => {
            console.log('Peer disconnected');
            this.showNotification('Player disconnected');
        });
        
        // Player joined the room
        this.wsManager.on('playerJoined', (data, fullMessage) => {
            console.log('Player joined:', data);
            const newPlayer = {
                id: fullMessage.playerId,
                name: fullMessage.playerName,
                ready: true
            };
            
            // Add to player list if not already there
            if (!this.players.find(p => p.id === newPlayer.id)) {
                if (this.players.length < 2) {
                    this.players.push({
                        id: newPlayer.id,
                        name: newPlayer.name,
                        chips: { green: [], red: [], heart: [] },
                        isActive: true
                    });
                }
            }
            
            this.updatePlayerList(this.players.map(p => ({ id: p.id, name: p.name, ready: true })));
            this.updatePlayerAreas();
            this.showNotification(`${newPlayer.name} joined the game!`);
        });
        
        // Chat messages
        this.wsManager.on('chat', (data, fullMessage) => {
            this.addChatMessage(fullMessage.playerName || 'Player', data.message);
        });
        
        // Dice roll from other player
        this.wsManager.on('rollDice', (data, fullMessage) => {
            console.log('Received dice roll from peer:', data);
            this.handleRemoteDiceRoll(data.results, fullMessage.playerId);
        });
        
        // Game state updates
        this.wsManager.on('gameAction', (data) => {
            this.updateGameState(data);
        });
        
        this.wsManager.on('playerState', (data, fullMessage) => {
            this.handleRemotePlayerState(data, fullMessage.playerId);
        });
    }
    
    setupConnectionMonitoring() {
        // Monitor Firebase connection state
        this.connectionUnsubscribe = subscribeConnectionState((isConnected) => {
            this.handleConnectionChange(isConnected);
        });
        
        // Also listen for browser online/offline events
        window.addEventListener('online', () => this.handleBrowserOnline());
        window.addEventListener('offline', () => this.handleBrowserOffline());
    }
    
    handleConnectionChange(isConnected) {
        const wasOnline = this.isOnline;
        this.isOnline = isConnected;
        
        console.log('Connection state changed:', isConnected ? 'online' : 'offline');
        
        if (isConnected) {
            // Just reconnected
            this.reconnectAttempts = 0;
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.hideConnectionBadge();
            
            if (!wasOnline && this.roomId) {
                // Re-establish presence
                this.setPresence(true);
                this.showNotification('Reconnected!');
            }
            
            // Re-enable UI based on current game state
            if (this.gameState === 'playing') {
                this.refetchGameState();
            }
        } else {
            // Just went offline
            this.showConnectionBadge('offline');
            this.disableRollButton();
            
            // Start reconnection attempts with exponential backoff
            this.attemptReconnect();
        }
    }
    
    handleBrowserOnline() {
        console.log('Browser reports online');
        // Firebase will handle the actual reconnection
        this.showConnectionBadge('reconnecting');
    }
    
    handleBrowserOffline() {
        console.log('Browser reports offline');
        this.isOnline = false;
        this.showConnectionBadge('offline');
        this.disableRollButton();
    }
    
    attemptReconnect() {
        if (this.isOnline) return;
        
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            this.showConnectionBadge('offline');
            this.updateStatusMessage('Connection lost. Please refresh the page.');
            return;
        }
        
        this.showConnectionBadge('reconnecting');
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);
        console.log(`Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        this.reconnectTimer = setTimeout(() => {
            if (!this.isOnline) {
                // Firebase handles actual reconnection; we just show status
                this.attemptReconnect();
            }
        }, delay);
    }
    
    async refetchGameState() {
        if (!this.roomId) return;
        try {
            const state = await getGameState(this.roomId);
            if (state) {
                this.handleGameStateUpdate(state);
            }
        } catch (err) {
            console.error('Failed to refetch game state:', err);
        }
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen, .menu-screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
            this.currentScreen = screenId;
        }
    }
    
    // Main Menu Actions
    startNewGame() {
        this.showScreen('lobby-screen');
        // Firebase flow: we defer actual room creation until startGameFromLobby
        this.playerId = this.playerId || this.generateLocalPlayerId();
    }
    
    joinGame() {
        this.showScreen('lobby-screen');
        this.playerId = this.playerId || this.generateLocalPlayerId();
        // If URL has room, it will prefill and we will validate on start
    }
    
    showTutorial() {
        this.showScreen('tutorial-screen');
    }
    
    showSettings() {
        // TODO: Create a proper settings screen in the HTML
        // For now, use a simple modal approach
        this.showConfirmationDialog(
            `Sound is currently ${this.sounds.enabled ? 'ON' : 'OFF'}. Toggle sound?`,
            () => {
                this.sounds.enabled = !this.sounds.enabled;
                console.log('Sound toggled:', this.sounds.enabled);
            }
        );
    }
    
    // Lobby Actions
    generateRoomCode() {
        const playerName = document.getElementById('player-name').value.trim() || 'Player';
        this.playerName = playerName;
        // Generate room id (6 chars) for Firebase flow
        this.roomId = generateRoomId();
        document.getElementById('room-code').value = this.roomId;
        this.updateURL(this.roomId);
        document.getElementById('current-room-code').textContent = `Room: ${this.roomId}`;
    }
    
    copyRoomLink() {
        const roomCode = document.getElementById('room-code').value.trim();
        if (!roomCode) {
            this.showToast('Please generate a room code first', 'error');
            return;
        }
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showToast('Room link copied!', 'success');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showShareDialog(shareUrl);
            });
        } else {
            this.showShareDialog(shareUrl);
        }
    }
    
    showShareDialog(shareUrl) {
        const message = `Share this link with your cofounder:\n\n${shareUrl}`;
        this.showConfirmationDialog(message, () => {});
    }

    // ================================================================
    // Share Modal Methods
    // ================================================================
    
    showShareModal(roomCode) {
        if (!roomCode) return;
        
        const modal = document.getElementById('share-modal');
        const codeDisplay = document.getElementById('share-room-code');
        const nativeShareBtn = document.getElementById('btn-native-share');
        
        // Update room code display
        codeDisplay.textContent = roomCode;
        
        // Check if Web Share API is available
        if (navigator.share) {
            nativeShareBtn.classList.remove('hidden');
        } else {
            nativeShareBtn.classList.add('hidden');
        }
        
        // Reset copy button state
        const copyBtn = document.getElementById('btn-copy-code');
        copyBtn.classList.remove('copied');
        copyBtn.querySelector('.btn-text').textContent = 'Copy Code';
        
        // Show modal
        modal.classList.remove('hidden');
    }
    
    hideShareModal() {
        const modal = document.getElementById('share-modal');
        modal.classList.add('hidden');
    }
    
    copyRoomCode() {
        const roomCode = this.roomId;
        if (!roomCode) return;
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        const shareText = `Join my All or Nothing game! Room: ${roomCode}\n${shareUrl}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                // Visual feedback on button
                const copyBtn = document.getElementById('btn-copy-code');
                copyBtn.classList.add('copied');
                copyBtn.querySelector('.btn-text').textContent = 'Copied!';
                
                // Show toast
                this.showToast('Copied to clipboard!', 'success');
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.querySelector('.btn-text').textContent = 'Copy Code';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showToast('Failed to copy', 'error');
            });
        } else {
            // Fallback for older browsers
            this.showConfirmationDialog(`Copy this: ${shareText}`, () => {});
        }
    }
    
    async nativeShare() {
        const roomCode = this.roomId;
        if (!roomCode) return;
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        const shareData = {
            title: 'All or Nothing - Dice Game',
            text: `Join my All or Nothing game! Room: ${roomCode}`,
            url: shareUrl
        };
        
        try {
            await navigator.share(shareData);
            // User shared successfully (or cancelled - we don't get feedback on cancel)
        } catch (err) {
            // User cancelled or error occurred
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
            }
            // Don't show error for user cancellation
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    generateLocalPlayerId() {
        return 'player_' + Math.random().toString(36).slice(2, 10);
    }

    async setPresence(connected = true) {
        if (!this.roomId || !this.playerId) return;
        try {
            await setPresence(this.roomId, this.playerId, connected);
        } catch (err) {
            console.error('Failed to set presence', err);
        }
    }
    
    async startGameFromLobby() {
        const playerName = document.getElementById('player-name').value.trim() || 'Player';
        const roomCodeInput = document.getElementById('room-code');
        const roomCode = roomCodeInput.value.trim();
        
        if (!playerName) {
            this.showConfirmationDialog('Please enter your name', () => {});
            return;
        }
        
        if (!roomCode) {
            this.showConfirmationDialog('Please enter or generate a room code', () => {});
            return;
        }
        this.playerName = playerName;
        this.playerId = this.playerId || this.generateLocalPlayerId();
        this.roomId = roomCode.toUpperCase();

        // Show connecting status
        this.showGameStatus('Connecting...');

        try {
            // Decide host vs joiner based on whether room exists
            const existing = await getRoom(this.roomId);
            const isCreatingRoom = !existing;
            
            if (isCreatingRoom) {
                await createRoom({ roomId: this.roomId, hostId: this.playerId, hostName: playerName });
                this.isHost = true;
            } else {
                await joinRoom({ roomId: this.roomId, playerId: this.playerId, playerName });
                this.isHost = existing.metadata && existing.metadata.hostId === this.playerId;
            }
            await this.setPresence(true);
            this.startRoomSubscriptions();
            this.showScreen('game-screen');
            if (!this.dice3D) {
                this.dice3D = new Dice3D('dice-canvas-container');
            }
            this.gameState = 'playing';
            // Disable roll button until game state subscription confirms it's our turn
            this.disableRollButton();
            
            // Show appropriate status and auto-hide
            if (isCreatingRoom) {
                this.showGameStatus('Waiting for opponent...');
                // Auto-hide status after 2 seconds and show share modal for host
                setTimeout(() => {
                    this.hideGameStatus();
                    this.showShareModal(this.roomId);
                }, 1500);
            } else {
                this.showGameStatus('Joined! Waiting for game to start...');
                // Auto-hide status after 2 seconds for joiners
                this.hideGameStatusDelayed(2000);
            }
            
            this.playSound('background-music', true);
        } catch (err) {
            console.error('Failed to start game via Firebase', err);
            this.hideGameStatus();
            const message = err && err.message === 'room_full'
                ? 'Room is full (max 2 players).'
                : 'Could not join or create room. Please try again.';
            this.showConfirmationDialog(message, () => {});
        }
    }
    
    async leaveLobby() {
        try {
            if (this.roomId && this.playerId) {
                await setPresence(this.roomId, this.playerId, false);
                await removePlayer(this.roomId, this.playerId);
                const room = await getRoom(this.roomId);
                if (room && room.players) {
                    const remaining = Object.keys(room.players);
                    if (remaining.length === 0) {
                        await closeRoom(this.roomId);
                    } else if (room.metadata && room.metadata.hostId === this.playerId) {
                        const newHost = remaining[0];
                        await updateMetadata(this.roomId, { hostId: newHost });
                    }
                }
            }
        } catch (err) {
            console.error('Error during leave/cleanup', err);
        }
        this.teardownRoomSubscriptions();
        this.wsManager.leaveRoom();
        this.showScreen('main-menu');
    }

    startRoomSubscriptions() {
        this.teardownRoomSubscriptions();
        if (!this.roomId) return;
        this.roomUnsubscribe = subscribeRoom(this.roomId, (room) => {
            this.handleRoomUpdate(room);
        });
        this.gameStateUnsubscribe = subscribeGameState(this.roomId, (state) => {
            this.handleGameStateUpdate(state);
        });
        this.chatUnsubscribe = subscribeChat(this.roomId, (messages) => {
            this.handleChatUpdate(messages);
        });
    }
    
    initializePlayers(mainPlayerName) {
        this.players = [];
        
        // Add main player
        this.players.push({
            id: this.playerId || this.wsManager.playerId,
            name: mainPlayerName,
            chips: { green: [], red: [], heart: [] },
            isActive: true
        });
        
        // For 2-player mode, add one opponent
        // In simulation mode, add AI placeholder
        // When real multiplayer is connected, this will be replaced by actual player
        this.players.push({
            id: 'player_2',
            name: 'Opponent',
            chips: { green: [], red: [], heart: [] },
            isActive: true
        });
        
        // Update UI
        this.updatePlayerAreas();
    }
    
    updatePlayerList(players, presenceMap = {}) {
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';
        
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            playerList.appendChild(li);
        });
        this.renderPresence(players, presenceMap);
    }

    renderPresence(players, presenceMap = {}) {
        const presenceEl = document.getElementById('presence-status');
        if (!presenceEl) return;
        presenceEl.innerHTML = '';
        players.forEach((p) => {
            const chip = document.createElement('span');
            chip.className = 'presence-chip';
            const dot = document.createElement('span');
            const presence = presenceMap[p.id];
            const statusClass = presence ? (presence.connected ? 'connected' : 'offline') : 'offline';
            dot.className = `presence-dot ${statusClass}`;
            chip.appendChild(dot);
            const label = document.createElement('span');
            label.textContent = p.name || 'Player';
            chip.appendChild(label);
            presenceEl.appendChild(chip);
        });
    }

    teardownRoomSubscriptions() {
        if (this.roomUnsubscribe) {
            this.roomUnsubscribe();
            this.roomUnsubscribe = null;
        }
        if (this.presenceUnsubscribe) {
            this.presenceUnsubscribe();
            this.presenceUnsubscribe = null;
        }
        if (this.gameStateUnsubscribe) {
            this.gameStateUnsubscribe();
            this.gameStateUnsubscribe = null;
        }
        if (this.chatUnsubscribe) {
            this.chatUnsubscribe();
            this.chatUnsubscribe = null;
        }
        this.renderedChatIds.clear();
    }

    async handleRoomUpdate(room) {
        if (!room) return;
        const players = Object.entries(room.players || {}).map(([id, val]) => ({ id, name: val.name || 'Player' }));
        this.updatePlayerList(players, room.presence || {});
        
        // Initialize game state when both players have joined and game hasn't started yet
        const state = room.state;
        if (this.isHost && players.length === 2 && state && state.status === 'lobby') {
            const playerIds = players.map(p => p.id);
            try {
                await initializeGameState(this.roomId, playerIds);
                this.showNotification('Game started!');
            } catch (err) {
                console.error('Failed to initialize game state:', err);
            }
        }
        
        // Update players array for local state
        this.players = players.map((p, idx) => ({
            id: p.id,
            name: p.name,
            chips: { green: [], red: [], heart: [] },
            isActive: true
        }));
        
        // Check connection status for all players
        const presence = room.presence || {};
        this.updateConnectionStatus(presence);
    }
    
    /**
     * Handle real-time game state updates from Firebase.
     * This syncs dice results, chip counts, turn state, and win condition.
     */
    handleGameStateUpdate(state) {
        if (!state) return;
        
        console.log('Game state update:', state);
        
        // Update local game state status
        this.gameState = state.status;
        
        // When game transitions to 'playing', hide the status bar
        if (state.status === 'playing' && state.playerOrder && state.playerOrder.length >= 2) {
            // Game has started with both players - hide status after brief delay
            this.hideGameStatusDelayed(1500);
        }
        
        // Update dice display if dice have been rolled
        if (state.dice && (state.dice.g || state.dice.r || state.dice.y)) {
            if (this.dice3D && !this.dice3D.isRolling) {
                // Show the dice values (visual sync for remote rolls)
                this.displayDiceValues(state.dice);
            }
        }
        
        // Sync chip counts from Firebase state
        this.syncChipsFromState(state);
        
        // Update turn indicator
        if (state.playerOrder && state.currentPlayer) {
            const currentPlayerData = this.players.find(p => p.id === state.currentPlayer);
            const indicator = document.getElementById('turn-indicator');
            if (currentPlayerData) {
                indicator.textContent = `${currentPlayerData.name}'s Turn`;
            }
            
            // Find current player index
            this.currentPlayerIndex = state.playerOrder.indexOf(state.currentPlayer);
            
            // Highlight active player area
            document.querySelectorAll('.player-area').forEach((area, idx) => {
                area.classList.toggle('active', idx === this.currentPlayerIndex);
            });
        }
        
        // Gate roll button based on turn and connection
        this.updateRollButtonState(state);
        
        // Check for game over
        if (state.status === 'finished' && state.winnerId) {
            this.handleGameFinished(state.winnerId);
        }
    }
    
    /**
     * Sync chip counts from Firebase state to local player objects.
     */
    syncChipsFromState(state) {
        if (!state.chips || !state.playerOrder) return;
        
        state.playerOrder.forEach((playerId, idx) => {
            const chips = state.chips[playerId];
            if (!chips) return;
            
            // Find or create player in local array
            let player = this.players.find(p => p.id === playerId);
            if (!player && idx < this.players.length) {
                player = this.players[idx];
                player.id = playerId;
            }
            if (!player) return;
            
            // Convert counts to arrays for UI compatibility
            player.chips = {
                green: new Array(chips.green || 0).fill(1),
                red: new Array(chips.red || 0).fill(1),
                heart: new Array(chips.heart || 0).fill(1)
            };
            
            this.updatePlayerChips(idx);
        });
    }
    
    /**
     * Display dice values after a remote roll (visual sync).
     */
    displayDiceValues(dice) {
        // The dice3D module handles visual display; this is for status updates
        const msg = `🎲 Rolled: ${dice.g}, ${dice.r}, ${dice.y}`;
        this.updateStatusMessage(msg);
    }
    
    /**
     * Update roll button state based on turn and connection.
     */
    updateRollButtonState(state) {
        const isMyTurn = state.currentPlayer === this.playerId;
        const isPlaying = state.status === 'playing';
        
        if (isMyTurn && isPlaying && this.isOnline) {
            this.enableRollButton();
            this.updateStatusMessage("Your turn! Roll the dice.");
        } else if (!this.isOnline) {
            this.disableRollButton();
            this.updateStatusMessage("Offline - Reconnecting...");
        } else if (!isPlaying) {
            this.disableRollButton();
        } else {
            this.disableRollButton();
            const currentPlayerData = this.players.find(p => p.id === state.currentPlayer);
            this.updateStatusMessage(`Waiting for ${currentPlayerData?.name || 'opponent'}...`);
        }
    }
    
    /**
     * Handle game finished state.
     */
    handleGameFinished(winnerId) {
        if (this.gameState === 'showing_winner') return; // Prevent duplicate
        this.gameState = 'showing_winner';
        
        const winnerIndex = this.players.findIndex(p => p.id === winnerId);
        const winner = this.players[winnerIndex];
        
        if (winnerIndex !== -1) {
            const winnerArea = document.getElementById(`player-${winnerIndex + 1}`);
            if (winnerArea) {
                winnerArea.classList.add('winner');
            }
        }
        
        this.playSound('audio-win');
        this.stopSound('background-music');
        
        setTimeout(() => {
            this.showWinnerScreen(winner || { name: 'Winner', chips: { green: [], red: [], heart: [] } });
        }, 2000);
    }
    
    /**
     * Update connection status indicators.
     */
    updateConnectionStatus(presence) {
        const presenceEl = document.getElementById('presence-status');
        if (!presenceEl) return;
        
        // Check if opponent is online
        let opponentOffline = false;
        this.players.forEach((p) => {
            if (p.id !== this.playerId) {
                const pres = presence[p.id];
                if (!pres || !pres.connected) {
                    opponentOffline = true;
                }
            }
        });
        
        if (opponentOffline) {
            this.showConnectionBadge('opponent-offline');
        } else {
            this.hideConnectionBadge();
        }
    }
    
    showConnectionBadge(status) {
        let badge = document.getElementById('connection-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'connection-badge';
            badge.className = 'connection-badge';
            document.body.appendChild(badge);
        }
        
        if (status === 'offline') {
            badge.textContent = '⚡ Offline';
            badge.className = 'connection-badge offline';
        } else if (status === 'reconnecting') {
            badge.textContent = '🔄 Reconnecting...';
            badge.className = 'connection-badge reconnecting';
        } else if (status === 'opponent-offline') {
            badge.textContent = '👤 Opponent disconnected';
            badge.className = 'connection-badge opponent-offline';
        }
        badge.style.display = 'block';
    }
    
    hideConnectionBadge() {
        const badge = document.getElementById('connection-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
    
    updatePlayerAreas() {
        this.players.forEach((player, index) => {
            const playerArea = document.getElementById(`player-${index + 1}`);
            if (playerArea) {
                playerArea.querySelector('.player-name').textContent = player.name;
                this.updatePlayerChips(index);
            }
        });
    }
    
    updatePlayerChips(playerIndex) {
        const player = this.players[playerIndex];
        const playerArea = document.getElementById(`player-${playerIndex + 1}`);
        if (!playerArea) return;
        
        const chipContainer = playerArea.querySelector('.chip-container');
        
        // Incrementally update chip rows instead of clearing and rebuilding
        const chipTypes = ['green', 'red', 'heart'];
        
        chipTypes.forEach(type => {
            const desiredCount = player.chips[type] ? player.chips[type].length : 0;
            
            // Find existing row for this chip type
            let row = chipContainer.querySelector(`.chip-row[data-type="${type}"]`);
            
            if (desiredCount === 0) {
                // Remove existing row if no chips of this type are needed
                if (row && row.parentNode === chipContainer) {
                    chipContainer.removeChild(row);
                }
                return;
            }
            
            // Create row if it does not exist yet
            if (!row) {
                row = document.createElement('div');
                row.className = 'chip-row';
                row.setAttribute('data-type', type);
                chipContainer.appendChild(row);
            }
            
            const currentChips = row.querySelectorAll('.chip').length;
            
            // Add missing chips
            if (currentChips < desiredCount) {
                const toAdd = desiredCount - currentChips;
                for (let i = 0; i < toAdd; i++) {
                    const chip = document.createElement('span');
                    chip.className = `chip ${type} active chip-collect-animation`;
                    row.appendChild(chip);
                }
            } else if (currentChips > desiredCount) {
                // Remove extra chips if somehow there are more than needed
                const toRemove = currentChips - desiredCount;
                for (let i = 0; i < toRemove; i++) {
                    row.removeChild(row.lastChild);
                }
            }
        });
    }
    
    // Game Actions
    async rollDice() {
        if (!this.dice3D || this.dice3D.isRolling) return;
        
        // Check if we're online and it's our turn
        if (!this.isOnline) {
            this.showNotification('Cannot roll while offline');
            return;
        }
        
        // Double-check turn validation
        const canRoll = await isPlayerTurn(this.roomId, this.playerId);
        if (!canRoll) {
            this.showNotification("Not your turn!");
            return;
        }
        
        this.disableRollButton();
        this.playSound('audio-dice-roll');
        
        // Generate dice results locally
        const visualResults = this.dice3D.rollDice();
        
        // Convert to Firebase format { g, r, y }
        const diceResults = {
            g: visualResults[0],
            r: visualResults[1],
            y: visualResults[2]
        };
        
        // Wait for animation to complete
        setTimeout(async () => {
            try {
                // Submit roll to Firebase with transaction
                const result = await rollDiceTransaction(this.roomId, this.playerId, diceResults);
                
                if (!result.success) {
                    this.showNotification(result.error || 'Roll failed');
                    // Re-enable if still our turn
                    const stillMyTurn = await isPlayerTurn(this.roomId, this.playerId);
                    if (stillMyTurn) {
                        this.enableRollButton();
                    }
                    return;
                }
                
                // Success - state update will come via subscription
                this.showRollResult(diceResults);
                
            } catch (err) {
                console.error('Dice roll transaction failed:', err);
                this.showNotification('Roll failed - please try again');
            }
        }, 2000); // Match dice animation duration
    }
    
    showRollResult(dice) {
        const values = [dice.g, dice.r, dice.y];
        const allSame = values[0] === values[1] && values[1] === values[2];
        const hasPair = values[0] === values[1] || values[1] === values[2] || values[0] === values[2];
        
        if (allSame) {
            this.updateStatusMessage('🎲 Triple! Green chip earned!');
            this.playSound('audio-chip-collect');
        } else if (hasPair) {
            this.updateStatusMessage('🎲 Pair! Red chip earned!');
            this.playSound('audio-chip-collect');
        } else {
            this.updateStatusMessage('🎲 No match. Heart chip earned!');
            this.playSound('audio-chip-collect');
        }
    }
    
    handleRemoteDiceRoll(results, playerId) {
        // Handle dice roll from the other player
        console.log('Remote player rolled:', results);
        
        if (this.dice3D) {
            // Optionally animate the dice for the remote player
            this.dice3D.rollDice();
        }
        
        // Find the player and update their chips
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            this.processDiceResultsForPlayer(results, playerIndex);
            // Don't call nextTurn here - the remote player will handle their turn
        }
    }
    
    processDiceResultsForPlayer(results, playerIndex) {
        if (!results) return;
        
        console.log('Processing dice results for player', playerIndex, ':', results);
        
        const player = this.players[playerIndex];
        if (!player) return;
        
        const allSame = results[0] === results[1] && results[1] === results[2];
        const twoSame = results[0] === results[1] || results[1] === results[2] || results[0] === results[2];
        
        if (allSame) {
            player.chips.green.push(results[0]);
            this.playSound('audio-chip-collect');
        } else if (twoSame) {
            player.chips.red.push(1);
            this.playSound('audio-chip-collect');
        } else {
            player.chips.heart.push(1);
            this.playSound('audio-chip-collect');
        }
        
        this.updatePlayerChips(playerIndex);
        
        // Check for winner
        if (player.chips.green.length >= 3) {
            this.endGame(playerIndex);
        }
    }
    
    processDiceResults(results) {
        if (!results) return;
        
        console.log('Dice results:', results);
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // Game logic: Add chips based on dice results
        // Simple rule: if all three dice show same number, add green chip
        // If two match, add red chip
        // Otherwise add heart chip
        
        const allSame = results[0] === results[1] && results[1] === results[2];
        const twoSame = results[0] === results[1] || results[1] === results[2] || results[0] === results[2];
        
        if (allSame) {
            currentPlayer.chips.green.push(results[0]);
            this.updateStatusMessage('🎲 Triple! Green chip earned!');
            this.playSound('audio-chip-collect');
        } else if (twoSame) {
            currentPlayer.chips.red.push(1);
            this.updateStatusMessage('🎲 Pair! Red chip earned!');
            this.playSound('audio-chip-collect');
        } else {
            currentPlayer.chips.heart.push(1);
            this.updateStatusMessage('🎲 No match. Heart chip earned!');
            this.playSound('audio-chip-collect');
        }
        
        this.updatePlayerChips(this.currentPlayerIndex);
        
        // Check for winner
        if (currentPlayer.chips.green.length >= 3) {
            this.endGame(this.currentPlayerIndex);
        }
    }
    
    nextTurn() {
        // Remove active state from current player
        const currentArea = document.getElementById(`player-${this.currentPlayerIndex + 1}`);
        if (currentArea) {
            currentArea.classList.remove('active');
        }
        
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        // Add active state to new current player
        const nextArea = document.getElementById(`player-${this.currentPlayerIndex + 1}`);
        if (nextArea) {
            nextArea.classList.add('active');
        }
        
        this.updateTurnIndicator();
        
        // Enable roll button for human player (player 0)
        if (this.currentPlayerIndex === 0) {
            this.enableRollButton();
        } else {
            // AI turn
            setTimeout(() => {
                this.simulateAITurn();
            }, 1500);
        }
    }
    
    simulateAITurn() {
        // Simulate AI rolling dice
        this.rollDice();
    }
    
    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const currentPlayer = this.players[this.currentPlayerIndex];
        indicator.textContent = `${currentPlayer.name}'s Turn`;
    }
    
    updateStatusMessage(message) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
        
        // Fade effect
        statusMessage.style.opacity = '1';
        setTimeout(() => {
            statusMessage.style.opacity = '0.7';
        }, 2000);
    }
    
    // ================================================================
    // Game Status Bar Methods
    // ================================================================
    
    showGameStatus(message) {
        const gameStatus = document.getElementById('game-status');
        const statusMessage = document.getElementById('status-message');
        
        statusMessage.textContent = message;
        gameStatus.classList.remove('hidden');
        
        // Clear any pending hide timeout
        if (this.statusHideTimeout) {
            clearTimeout(this.statusHideTimeout);
            this.statusHideTimeout = null;
        }
    }
    
    hideGameStatus() {
        const gameStatus = document.getElementById('game-status');
        gameStatus.classList.add('hidden');
        
        // Clear any pending hide timeout
        if (this.statusHideTimeout) {
            clearTimeout(this.statusHideTimeout);
            this.statusHideTimeout = null;
        }
    }
    
    hideGameStatusDelayed(ms = 2000) {
        // Clear any existing timeout
        if (this.statusHideTimeout) {
            clearTimeout(this.statusHideTimeout);
        }
        
        this.statusHideTimeout = setTimeout(() => {
            this.hideGameStatus();
        }, ms);
    }
    
    enableRollButton() {
        const btn = document.getElementById('btn-roll-dice');
        btn.disabled = false;
        btn.style.opacity = '1';
    }
    
    disableRollButton() {
        const btn = document.getElementById('btn-roll-dice');
        btn.disabled = true;
        btn.style.opacity = '0.5';
    }
    
    pauseGame() {
        this.showConfirmationDialog(
            'Return to main menu? Game progress will be lost.',
            () => {
                this.exitToMenu();
            }
        );
    }
    
    endGame(winnerIndex) {
        this.gameState = 'finished';
        const winner = this.players[winnerIndex];
        
        // Mark winner's area
        const winnerArea = document.getElementById(`player-${winnerIndex + 1}`);
        if (winnerArea) {
            winnerArea.classList.add('winner');
        }
        
        this.playSound('audio-win');
        this.stopSound('background-music');
        
        setTimeout(() => {
            this.showWinnerScreen(winner);
        }, 2000);
    }
    
    showWinnerScreen(winner) {
        document.getElementById('winner-name').textContent = `${winner.name} Wins!`;
        
        const stats = document.getElementById('winner-stats');
        stats.innerHTML = `
            <p>Green Chips: ${winner.chips.green.length}</p>
            <p>Red Chips: ${winner.chips.red.length}</p>
            <p>Heart Chips: ${winner.chips.heart.length}</p>
        `;
        
        this.showScreen('winner-screen');
    }
    
    // Chat Functions
    toggleChat() {
        const chatPanel = document.getElementById('chat-panel');
        chatPanel.classList.toggle('collapsed');
    }
    
    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Check if online
        if (!this.isOnline) {
            this.showNotification('Cannot send message while offline');
            return;
        }
        
        // Disable input while sending
        input.disabled = true;
        const sendBtn = document.getElementById('btn-send-chat');
        sendBtn.disabled = true;
        
        try {
            const result = await sendChatMessage(
                this.roomId,
                this.playerId,
                this.playerName,
                message
            );
            
            if (result.success) {
                input.value = '';
            } else {
                this.showNotification(result.error || 'Failed to send message');
            }
        } catch (err) {
            console.error('Chat send error:', err);
            this.showNotification('Failed to send message');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }
    
    /**
     * Handle real-time chat updates from Firebase.
     */
    handleChatUpdate(messages) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        // Only render new messages to avoid flickering
        messages.forEach((msg) => {
            if (this.renderedChatIds.has(msg.id)) return;
            this.renderedChatIds.add(msg.id);
            
            const isMe = msg.senderId === this.playerId;
            this.renderChatMessage(msg.senderName, msg.message, isMe);
        });
    }
    
    renderChatMessage(sender, message, isMe = false) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isMe ? 'own' : ''}`;
        
        // Sanitize message to prevent XSS
        const sanitizedMessage = this.sanitizeHTML(message);
        const sanitizedSender = this.sanitizeHTML(sender);
        
        messageDiv.innerHTML = `<span class="sender">${sanitizedSender}:</span> ${sanitizedMessage}`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    addChatMessage(sender, message) {
        // Legacy method - now handled by handleChatUpdate for Firebase messages
        this.renderChatMessage(sender, message, sender === 'You');
    }
    
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
    
    /**
     * Show a non-blocking confirmation dialog consistent with the game's UI.
     * @param {string} message - Message to display to the user.
     * @param {Function} onConfirm - Callback when user confirms.
     * @param {Function} [onCancel] - Optional callback when user cancels.
     */
    showConfirmationDialog(message, onConfirm, onCancel) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        // Create modal container
        const modal = document.createElement('div');
        modal.style.backgroundColor = 'var(--secondary-dark)';
        modal.style.color = 'var(--text-light)';
        modal.style.padding = '2rem';
        modal.style.borderRadius = 'var(--radius-lg)';
        modal.style.boxShadow = 'var(--shadow-lg)';
        modal.style.maxWidth = '90%';
        modal.style.textAlign = 'center';

        const textEl = document.createElement('p');
        textEl.textContent = message;
        textEl.style.marginBottom = '1.5rem';
        textEl.style.fontSize = '1.1rem';
        modal.appendChild(textEl);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '1rem';
        buttonContainer.style.justifyContent = 'center';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'OK';
        confirmBtn.className = 'btn-primary';
        confirmBtn.style.padding = '0.75rem 1.5rem';
        confirmBtn.style.cursor = 'pointer';

        const removeDialog = () => {
            document.body.removeChild(overlay);
        };

        confirmBtn.onclick = () => {
            removeDialog();
            if (onConfirm) onConfirm();
        };

        buttonContainer.appendChild(confirmBtn);

        // Add cancel button if callback provided
        if (onCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'btn-secondary';
            cancelBtn.style.padding = '0.75rem 1.5rem';
            cancelBtn.style.cursor = 'pointer';

            cancelBtn.onclick = () => {
                removeDialog();
                onCancel();
            };

            buttonContainer.appendChild(cancelBtn);
        }

        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
    
    // Audio Functions
    playSound(soundId, loop = false) {
        if (!this.sounds.enabled) return;
        
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.volume = this.sounds.volume;
            audio.loop = loop;
            audio.play().catch(err => console.log('Audio play failed:', err));
        }
    }
    
    stopSound(soundId) {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
    
    // Game End Actions
    async playAgain() {
        try {
            // Reset game state in Firebase
            if (this.roomId) {
                await resetGameState(this.roomId);
            }
            
            // Reset local state
            this.players.forEach(player => {
                player.chips = { green: [], red: [], heart: [] };
            });
            
            this.currentPlayerIndex = 0;
            this.gameState = 'playing';
            
            // Reset UI
            document.querySelectorAll('.player-area').forEach(area => {
                area.classList.remove('active', 'winner');
            });
            
            this.updatePlayerAreas();
            this.showScreen('game-screen');
            this.disableRollButton(); // Will be enabled by state subscription
            this.playSound('background-music', true);
        } catch (err) {
            console.error('Failed to restart game:', err);
            this.showNotification('Could not restart game');
        }
    }
    
    exitToMenu() {
        this.stopSound('background-music');
        this.wsManager.leaveRoom();
        this.gameState = 'menu';
        this.showScreen('main-menu');
    }
    
    handleDiceRoll(data) {
        console.log('Dice rolled by:', data.playerId, 'Results:', data.results);
    }
    
    updateGameState(data) {
        console.log('Game state updated:', data);
    }
    
    handleRemotePlayerState(data, playerId) {
        // Update the remote player's state (chips, score, etc.)
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1 && data) {
            this.players[playerIndex] = { ...this.players[playerIndex], ...data };
            this.updatePlayerChips(playerIndex);
        }
    }
    
    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(11, 166, 166, 0.95);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new AllOrNothingGame();
});
