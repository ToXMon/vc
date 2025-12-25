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
        
        this.init();
    }
    
    init() {
        console.log('Initializing All or Nothing...');
        
        // Initialize WebSocket Manager
        this.wsManager = new WebSocketManager();
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupWebSocketHandlers();
        
        // Hide loading screen and show main menu
        setTimeout(() => {
            this.hideLoading();
            this.showScreen('main-menu');
        }, 1500);
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
    }
    
    setupWebSocketHandlers() {
        this.wsManager.on('roomCreated', (data) => {
            document.getElementById('room-code').value = data.roomCode;
            document.getElementById('current-room-code').textContent = `Room: ${data.roomCode}`;
            this.updatePlayerList([{ id: this.wsManager.playerId, name: this.wsManager.playerName }]);
        });
        
        this.wsManager.on('roomJoined', (data) => {
            document.getElementById('current-room-code').textContent = `Room: ${data.roomCode}`;
            this.updatePlayerList(data.players);
        });
        
        this.wsManager.on('chatMessage', (data) => {
            this.addChatMessage(data.playerName, data.message);
        });
        
        this.wsManager.on('diceRolled', (data) => {
            this.handleDiceRoll(data);
        });
        
        this.wsManager.on('gameUpdate', (data) => {
            this.updateGameState(data);
        });
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
        this.wsManager.connect().then(() => {
            console.log('Connected to game server');
        }).catch(err => {
            console.log('Running in offline mode');
        });
    }
    
    joinGame() {
        this.showScreen('lobby-screen');
        this.wsManager.connect().then(() => {
            console.log('Connected to game server');
        }).catch(err => {
            console.log('Running in offline mode');
        });
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
        this.wsManager.createRoom(playerName);
    }
    
    startGameFromLobby() {
        const playerName = document.getElementById('player-name').value.trim() || 'Player';
        const roomCodeInput = document.getElementById('room-code');
        const normalizedRoomCode = roomCodeInput.value.trim().toUpperCase();
        
        // Normalize input so the displayed value matches what we validate/send
        roomCodeInput.value = normalizedRoomCode;
        
        if (!normalizedRoomCode) {
            this.showConfirmationDialog('Please enter or generate a room code', () => {});
            return;
        }
        
        // Client-side validation: 6 alphanumeric characters (A-Z, 0-9)
        const roomCodePattern = /^[A-Z0-9]{6}$/;
        if (!roomCodePattern.test(normalizedRoomCode)) {
            this.showConfirmationDialog(
                'Invalid room code format. Please enter a 6-character code using letters and numbers only.',
                () => {}
            );
            return;
        }
        
        // Initialize players
        this.initializePlayers(playerName);
        
        // Show game screen
        this.showScreen('game-screen');
        
        // Initialize 3D dice
        if (!this.dice3D) {
            this.dice3D = new Dice3D('dice-canvas-container');
        }
        
        // Start game
        this.gameState = 'playing';
        this.currentPlayerIndex = 0;
        this.updateTurnIndicator();
        this.enableRollButton();
        
        this.playSound('background-music', true);
    }
    
    leaveLobby() {
        this.wsManager.leaveRoom();
        this.showScreen('main-menu');
    }
    
    initializePlayers(mainPlayerName) {
        this.players = [];
        
        // Add main player
        this.players.push({
            id: this.wsManager.playerId,
            name: mainPlayerName,
            chips: { green: [], red: [], heart: [] },
            isActive: true
        });
        
        // Add AI/placeholder players
        const playerNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
        for (let i = 0; i < 5; i++) {
            this.players.push({
                id: `ai_${i}`,
                name: playerNames[i],
                chips: { green: [], red: [], heart: [] },
                isActive: false
            });
        }
        
        // Update UI
        this.updatePlayerAreas();
    }
    
    updatePlayerList(players) {
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';
        
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            playerList.appendChild(li);
        });
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
    rollDice() {
        if (!this.dice3D || this.dice3D.isRolling) return;
        
        this.disableRollButton();
        this.playSound('audio-dice-roll');
        
        const results = this.dice3D.rollDice();
        
        setTimeout(() => {
            this.processDiceResults(results);
            this.nextTurn();
        }, 2000); // Match the dice animation duration
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
    
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.wsManager.sendChatMessage(message);
            input.value = '';
        }
    }
    
    addChatMessage(sender, message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `<span class="sender">${sender}:</span> ${message}`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    playAgain() {
        // Reset game
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
        this.updateTurnIndicator();
        this.enableRollButton();
        this.playSound('background-music', true);
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
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new AllOrNothingGame();
});
