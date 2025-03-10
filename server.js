const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Game rooms storage
const gameRooms = {};

// Generate a random 6-character room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Create a new game room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        
        // Create the room
        gameRooms[roomCode] = {
            players: [{ id: socket.id, color: 'white' }],
            currentPlayer: 'white',
            board: Array(8).fill().map(() => Array(8).fill(null)),
            whiteScore: 0,
            blackScore: 0,
            gameOver: false,
            moveHistory: []
        };
        
        // Join the socket to the room
        socket.join(roomCode);
        
        // Send the room code back to the client
        socket.emit('roomCreated', { roomCode, playerColor: 'white' });
        console.log(`Room created: ${roomCode}`);
    });
    
    // Join an existing game room
    socket.on('joinRoom', (data) => {
        const { roomCode } = data;
        
        // Check if the room exists
        if (!gameRooms[roomCode]) {
            socket.emit('roomError', { message: 'Room not found' });
            return;
        }
        
        // Check if the room is full
        if (gameRooms[roomCode].players.length >= 2) {
            socket.emit('roomError', { message: 'Room is full' });
            return;
        }
        
        // Add the player to the room
        gameRooms[roomCode].players.push({ id: socket.id, color: 'black' });
        
        // Join the socket to the room
        socket.join(roomCode);
        
        // Notify the client they joined successfully
        socket.emit('roomJoined', { roomCode, playerColor: 'black', gameState: gameRooms[roomCode] });
        
        // Notify the other player that someone joined
        socket.to(roomCode).emit('opponentJoined', { gameState: gameRooms[roomCode] });
        
        console.log(`Player joined room: ${roomCode}`);
    });
    
    // Handle a player's move
    socket.on('makeMove', (data) => {
        const { roomCode, row, col } = data;
        
        // Validate the room
        if (!gameRooms[roomCode]) {
            socket.emit('gameError', { message: 'Room not found' });
            return;
        }
        
        // Get the game state
        const gameState = gameRooms[roomCode];
        
        // Find the player in the room
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex === -1) {
            socket.emit('gameError', { message: 'You are not in this room' });
            return;
        }
        
        const playerColor = gameState.players[playerIndex].color;
        
        // Validate it's the player's turn
        if (playerColor !== gameState.currentPlayer) {
            socket.emit('gameError', { message: 'Not your turn' });
            return;
        }
        
        // Pass the move to all players in the room
        io.to(roomCode).emit('moveMade', { row, col, playerColor });
    });
    
    // Handle game events like vector formation, node creation, etc.
    socket.on('gameEvent', (data) => {
        const { roomCode, eventType, eventData } = data;
        
        // Validate the room
        if (!gameRooms[roomCode]) return;
        
        // Update the game state based on event type
        switch (eventType) {
            case 'updateBoard':
                if (eventData.board) {
                    gameRooms[roomCode].board = eventData.board;
                }
                break;
                
            case 'switchPlayer':
                // Switch the current player
                gameRooms[roomCode].currentPlayer = 
                    gameRooms[roomCode].currentPlayer === 'white' ? 'black' : 'white';
                break;
                
            case 'updateScore':
                if (eventData.whiteScore !== undefined) {
                    gameRooms[roomCode].whiteScore = eventData.whiteScore;
                }
                if (eventData.blackScore !== undefined) {
                    gameRooms[roomCode].blackScore = eventData.blackScore;
                }
                break;
                
            case 'gameOver':
                gameRooms[roomCode].gameOver = true;
                break;
        }
        
        // Broadcast the event to all players in the room
        socket.to(roomCode).emit('gameEvent', { eventType, eventData });
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find any rooms the player was in
        for (const roomCode in gameRooms) {
            const playerIndex = gameRooms[roomCode].players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                // Notify other players in the room
                socket.to(roomCode).emit('opponentDisconnected');
                
                // If there are no players left, delete the room
                if (gameRooms[roomCode].players.length <= 1) {
                    delete gameRooms[roomCode];
                    console.log(`Room ${roomCode} deleted`);
                } else {
                    // Remove the player from the room
                    gameRooms[roomCode].players.splice(playerIndex, 1);
                }
            }
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});