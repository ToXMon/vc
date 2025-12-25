// WebSocket Manager for Real-time Multiplayer
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.messageHandlers = {};
        
        // Simulate WebSocket for demo (replace with real WebSocket server)
        this.simulateMode = true;
    }
    
    connect(serverUrl = 'ws://localhost:8080') {
        if (this.simulateMode) {
            console.log('Running in simulation mode (no real WebSocket server)');
            this.isConnected = true;
            this.playerId = this.generateId();
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(serverUrl);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.playerId = this.generateId();
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    // Fall back to simulation mode on connection error
                    this.simulateMode = true;
                    this.isConnected = true;
                    this.playerId = this.generateId();
                    console.log('Falling back to simulation mode');
                    resolve();
                };
                
                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.isConnected = false;
                    this.attemptReconnect(serverUrl);
                };
            } catch (error) {
                console.error('Failed to connect:', error);
                reject(error);
            }
        });
    }
    
    attemptReconnect(serverUrl) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            const delay = Math.min(2000 * this.reconnectAttempts, 30000);
            setTimeout(() => {
                this.connect(serverUrl);
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.trigger('connectionFailed');
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    
    send(type, data) {
        const message = {
            type,
            data,
            playerId: this.playerId,
            roomCode: this.roomCode,
            timestamp: Date.now()
        };
        
        if (this.simulateMode) {
            console.log('Simulated send:', message);
            // Simulate response for demo
            this.simulateResponse(type, data);
            return;
        }
        
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket not connected');
        }
    }
    
    handleMessage(rawData) {
        try {
            const message = JSON.parse(rawData);
            const handler = this.messageHandlers[message.type];
            
            if (handler) {
                handler(message.data);
            } else {
                console.warn('No handler for message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }
    
    on(messageType, handler) {
        this.messageHandlers[messageType] = handler;
    }
    
    trigger(eventType, data = {}) {
        const handler = this.messageHandlers[eventType];
        if (handler) {
            handler(data);
        }
    }
    
    // Simulation methods for demo without real server
    simulateResponse(type, data) {
        setTimeout(() => {
            switch(type) {
                case 'createRoom':
                    this.roomCode = this.generateRoomCode();
                    this.trigger('roomCreated', { roomCode: this.roomCode });
                    break;
                    
                case 'joinRoom':
                    this.roomCode = data.roomCode;
                    this.trigger('roomJoined', { 
                        roomCode: this.roomCode,
                        players: this.generateMockPlayers()
                    });
                    break;
                    
                case 'chat':
                    this.trigger('chatMessage', {
                        playerId: this.playerId,
                        playerName: this.playerName,
                        message: data.message,
                        timestamp: Date.now()
                    });
                    break;
                    
                case 'rollDice':
                    this.trigger('diceRolled', {
                        playerId: this.playerId,
                        results: data.results
                    });
                    break;
                    
                case 'gameAction':
                    this.trigger('gameUpdate', data);
                    break;
            }
        }, 100);
    }
    
    generateId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return 'player_' + crypto.randomUUID();
        }
        // Fallback for environments without crypto.randomUUID
        return 'player_' + Math.random().toString(36).slice(2, 11);
    }
    
    generateRoomCode() {
        // Generate a 6-character alphanumeric room code
        return Math.random().toString(36).slice(2, 8).toUpperCase();
    }
    
    generateMockPlayers() {
        return [
            { id: this.playerId, name: this.playerName, ready: true }
        ];
    }
    
    // Room Management
    createRoom(playerName) {
        this.playerName = playerName;
        this.send('createRoom', { playerName });
    }
    
    joinRoom(roomCode, playerName) {
        this.playerName = playerName;
        this.send('joinRoom', { roomCode, playerName });
    }
    
    leaveRoom() {
        this.send('leaveRoom', {});
        this.roomCode = null;
    }
    
    // Chat
    sendChatMessage(message) {
        this.send('chat', { message });
    }
    
    // Game Actions
    rollDice(results) {
        this.send('rollDice', { results });
    }
    
    sendGameAction(action) {
        this.send('gameAction', action);
    }
    
    updatePlayerState(state) {
        this.send('playerState', state);
    }
}

// Export for use in main game script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}
