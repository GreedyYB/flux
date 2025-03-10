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

// Game constants - match those in client
const BOARD_SIZE = 8;
const LINE_LENGTH = 4;

// Generate a random 6-character room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Server-side game logic
// Check if a move would create a line longer than 4
function wouldCreateLineTooLong(board, row, col, color) {
    // Temporarily place piece
    const originalValue = board[row][col];
    board[row][col] = { color: color, protectionLevel: 0 };
    
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];
    
    let tooLong = false;
    
    // Check each direction
    for (const [dr, dc] of directions) {
        let count = 1;  // Start with the placed piece
        
        // Count in positive direction
        for (let i = 1; i < BOARD_SIZE; i++) {
            const r = row + i * dr;
            const c = col + i * dc;
            
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
                board[r][c] && board[r][c].color === color) {
                count++;
            } else {
                break;
            }
        }
        
        // Count in negative direction
        for (let i = 1; i < BOARD_SIZE; i++) {
            const r = row - i * dr;
            const c = col - i * dc;
            
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
                board[r][c] && board[r][c].color === color) {
                count++;
            } else {
                break;
            }
        }
        
        if (count > LINE_LENGTH) {
            tooLong = true;
            break;
        }
    }
    
    // Restore original state
    board[row][col] = originalValue;
    
    return tooLong;
}

// Check for lines of exactly 4 pieces
function checkForLines(board, row, col, color) {
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];
    
    let linesFormed = 0;
    const piecesToRemove = [];
    const vectors = []; // Store vector information for visualization
    
    // Check each direction
    for (const [dr, dc] of directions) {
        let count = 1;  // Start with the placed piece
        let linePositions = [{row, col, shouldRemove: false}]; // Last placed piece becomes node
        
        // Count in positive direction
        for (let i = 1; i < LINE_LENGTH; i++) {
            const r = row + i * dr;
            const c = col + i * dc;
            
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
                board[r][c] && board[r][c].color === color) {
                count++;
                // Check if this piece is already a node (has protection level)
                const isNode = board[r][c].protectionLevel > 0;
                linePositions.push({row: r, col: c, shouldRemove: !isNode});
            } else {
                break;
            }
        }
        
        // Count in negative direction
        for (let i = 1; i < LINE_LENGTH; i++) {
            const r = row - i * dr;
            const c = col - i * dc;
            
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
                board[r][c] && board[r][c].color === color) {
                count++;
                // Check if this piece is already a node (has protection level)
                const isNode = board[r][c].protectionLevel > 0;
                linePositions.push({row: r, col: c, shouldRemove: !isNode});
            } else {
                break;
            }
        }
        
        // If we have a line of exactly 4
        if (count === LINE_LENGTH) {
            linesFormed++;
            
            // Add to vectors for client visualization
            let directionName;
            if (dr === 0 && dc === 1) directionName = 'horizontal';
            else if (dr === 1 && dc === 0) directionName = 'vertical';
            else if (dr === 1 && dc === 1) directionName = 'diagonal-right';
            else directionName = 'diagonal-left';
            
            vectors.push({
                positions: linePositions,
                direction: directionName
            });
            
            // Add pieces to remove
            for (const pos of linePositions) {
                // Skip the last placed piece and existing nodes
                if (pos.shouldRemove) {
                    piecesToRemove.push({row: pos.row, col: pos.col});
                }
            }
        }
    }
    
    return {
        linesFormed: linesFormed,
        piecesToRemove: piecesToRemove,
        vectors: vectors
    };
}

// Process a move on the server
function processMove(gameState, row, col, playerColor) {
    // Create a deep copy of the board for validation
    const boardCopy = JSON.parse(JSON.stringify(gameState.board));
    
    // Validate the cell is empty
    if (boardCopy[row][col] !== null) {
        return { valid: false, message: "Cell is already occupied" };
    }
    
    // Validate the move doesn't create a line longer than 4
    if (wouldCreateLineTooLong(boardCopy, row, col, playerColor)) {
        return { valid: false, message: "Move would create a line longer than 4 ions" };
    }
    
    // Update move counter
    gameState.moveCount++;
    
    // Place the piece
    gameState.board[row][col] = { color: playerColor, protectionLevel: 0 };
    
    // Update last move
    gameState.lastMove = { row, col };
    
    // Get position label (for notation)
    const positionLabel = String.fromCharCode(65 + col) + (BOARD_SIZE - row);
    
    // Check for lines formed
    const linesInfo = checkForLines(gameState.board, row, col, playerColor);
    
    let nodeCreated = false;
    let gameOver = false;
    let winner = null;
    let nodeLabel = positionLabel;
    
    if (linesInfo.linesFormed > 0) {
        nodeCreated = true;
        
        // Update the protection level of the placed piece
        gameState.board[row][col].protectionLevel = linesInfo.linesFormed;
        
        // Update score
        if (playerColor === 'white') {
            gameState.whiteScore += linesInfo.linesFormed;
        } else {
            gameState.blackScore += linesInfo.linesFormed;
        }
        
        // Create node label (for notation)
        nodeLabel = linesInfo.linesFormed > 1 ? 
            `${positionLabel}N${linesInfo.linesFormed}` : 
            `${positionLabel}N`;
        
        // Remove pieces that form the vector (except nodes)
        for (const pos of linesInfo.piecesToRemove) {
            gameState.board[pos.row][pos.col] = null;
        }
        
        // Check for nexus (game over condition)
        const nexusResult = checkForNexus(gameState.board);
        if (nexusResult) {
            gameState.gameOver = true;
            gameOver = true;
            winner = nexusResult.winner;
        }
    }
    
    // Add to move history
    gameState.moveHistory.push({
        playerColor,
        row,
        col,
        notation: nodeCreated ? nodeLabel : positionLabel,
        linesFormed: linesInfo.linesFormed,
        vectors: linesInfo.vectors,
        boardState: JSON.parse(JSON.stringify(gameState.board))
    });
    
    // Switch players
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    
    return {
        valid: true,
        gameState,
        move: {
            playerColor,
            row,
            col,
            notation: nodeCreated ? nodeLabel : positionLabel,
            linesFormed: linesInfo.linesFormed,
            vectors: linesInfo.vectors
        },
        gameOver,
        winner
    };
}

// Check for a Nexus (game over condition)
function checkForNexus(board) {
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];

    // Check each cell
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];

            // Skip empty cells or non-nodes
            if (!piece || piece.protectionLevel === 0) continue;

            const color = piece.color;

            // Check each direction
            for (const [dr, dc] of directions) {
                let nodeCount = 1;
                let positions = [{ row, col }];

                // Check for 3 more nodes in this direction
                for (let i = 1; i < 4; i++) {
                    const r = row + i * dr;
                    const c = col + i * dc;

                    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
                        board[r][c] &&
                        board[r][c].color === color &&
                        board[r][c].protectionLevel > 0) {
                        nodeCount++;
                        positions.push({ row: r, col: c });
                    } else {
                        break;
                    }
                }

                // If we found a Nexus
                if (nodeCount === 4) {
                    return {
                        winner: color,
                        positions: positions
                    };
                }
            }
        }
    }

    return null;
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Create a new game room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        
        // Create the room with initial game state
        gameRooms[roomCode] = {
            players: [{ id: socket.id, color: 'white' }],
            currentPlayer: 'white',
            board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)),
            whiteScore: 0,
            blackScore: 0,
            gameOver: false,
            moveCount: 0,
            lastMove: null,
            moveHistory: [],
            gameStarted: false
        };
        
        // Join the socket to the room
        socket.join(roomCode);
        
        // Send the room code back to the client
        socket.emit('roomCreated', { 
            roomCode, 
            playerColor: 'white',
            gameState: gameRooms[roomCode]
        });
        
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
        
        // Mark game as started
        gameRooms[roomCode].gameStarted = true;
        
        // Join the socket to the room
        socket.join(roomCode);
        
        // Send current game state to the joining player
        socket.emit('roomJoined', { 
            roomCode, 
            playerColor: 'black', 
            gameState: gameRooms[roomCode] 
        });
        
        // Notify the other player that someone joined
        socket.to(roomCode).emit('opponentJoined', { 
            gameState: gameRooms[roomCode] 
        });
        
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
        
        // Process the move on the server
        const result = processMove(gameState, row, col, playerColor);
        
        if (!result.valid) {
            socket.emit('gameError', { message: result.message });
            return;
        }
        
        // Send the updated game state to all players
        io.to(roomCode).emit('gameUpdate', {
            move: result.move,
            gameState: gameState,
            gameOver: result.gameOver,
            winner: result.winner
        });
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find any rooms the player was in
        for (const roomCode in gameRooms) {
            const playerIndex = gameRooms[roomCode].players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                // Get player color
                const playerColor = gameRooms[roomCode].players[playerIndex].color;
                
                // Notify other players in the room
                socket.to(roomCode).emit('opponentDisconnected', { playerColor });
                
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
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});