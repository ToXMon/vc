// PeerJS Manager for Real-time Multiplayer (Peer-to-Peer)
class WebSocketManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        this.isConnected = false;
        this.isHost = false;
        this.messageHandlers = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            try {
                // Generate unique peer ID
                this.playerId = this.generateId();
                
                // Initialize PeerJS with free cloud server
                this.peer = new Peer(this.playerId, {
                    debug: 2 // Set to 0 for production
                });
                
                this.peer.on('open', (id) => {
                    console.log('PeerJS connected with ID:', id);
                    this.isConnected = true;
                    this.playerId = id;
                    resolve();
                });
                
                this.peer.on('error', (error) => {
                    console.error('PeerJS error:', error);
                    reject(error);
                });
                
                // Listen for incoming connections (when someone joins your room)
                this.peer.on('connection', (conn) => {
                    console.log('Incoming connection from:', conn.peer);
                    this.setupConnection(conn);
                });
                
            } catch (error) {
                console.error('Failed to initialize PeerJS:', error);
                reject(error);
            }
        });
    }
    
    setupConnection(conn) {
        this.connection = conn;
        
        conn.on('open', () => {
            console.log('Connection established with peer:', conn.peer);
            
            // Send welcome message with your player info
            this.send('playerJoined', {
                playerId: this.playerId,
                playerName: this.playerName
            });
            
            this.trigger('peerConnected', { peerId: conn.peer });
        });
        
        conn.on('data', (data) => {
            console.log('Received data:', data);
            this.handleMessage(data);
        });
        
        conn.on('close', () => {
            console.log('Connection closed');
            this.connection = null;
            this.trigger('peerDisconnected');
        });
        
        conn.on('error', (error) => {
            console.error('Connection error:', error);
        });
    }
    
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.isConnected = false;
    }
    
    send(type, data) {
        const message = {
            type,
            data,
            playerId: this.playerId,
            playerName: this.playerName,
            roomCode: this.roomCode,
            timestamp: Date.now()
        };
        
        if (this.connection && this.connection.open) {
            console.log('Sending:', message);
            this.connection.send(message);
        } else {
            console.warn('No active connection to send message');
        }
    }
    
    handleMessage(message) {
        try {
            const handler = this.messageHandlers[message.type];
            
            if (handler) {
                handler(message.data, message);
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
    
    // Room Management
    createRoom(playerName) {
        this.playerName = playerName;
        this.isHost = true;
        
        // Use peer ID as room code (first 6 chars)
        this.roomCode = this.playerId.substring(0, 6).toUpperCase();
        
        console.log('Room created:', this.roomCode);
        console.log('Your Peer ID:', this.playerId);
        
        // Update URL with room code
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.set('room', this.playerId); // Store full peer ID in URL
            window.history.pushState({}, '', url);
        }
        
        this.trigger('roomCreated', { 
            roomCode: this.roomCode,
            fullPeerId: this.playerId 
        });
    }
    
    joinRoom(roomCode, playerName) {
        this.playerName = playerName;
        this.isHost = false;
        this.roomCode = roomCode;
        
        console.log('Attempting to join room (peer):', roomCode);
        
        // Connect to the host's peer ID
        const conn = this.peer.connect(roomCode, {
            reliable: true
        });
        
        this.setupConnection(conn);
        
        // Update URL with room code
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.set('room', roomCode);
            window.history.pushState({}, '', url);
        }
        
        this.trigger('roomJoined', { 
            roomCode: roomCode,
            players: [{ id: this.playerId, name: playerName, ready: true }]
        });
    }
    
    leaveRoom() {
        this.send('leaveRoom', {});
        this.disconnect();
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
    
    generateId() {
        // Generate a unique ID for peer connections
        return 'peer_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
}

// Export for use in main game script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketManager;
}
