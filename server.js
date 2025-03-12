const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Game constants - match those in client
const BOARD_SIZE = 8;
const LINE_LENGTH = 4;

// Waiting players queue and active games storage
let waitingPlayer = null;
const activeGames = {};
let gameCounter = 0;

// Generate a simple game ID
function generateGameId() {
    return `game_${++gameCounter}`;
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
    
    // Player wants to join multiplayer queue
    socket.on('joinMultiplayerQueue', () => {
        console.log('Player joining multiplayer queue:', socket.id);
        
        if (waitingPlayer === null) {
            // This is the first player, put them in waiting
            waitingPlayer = {
                id: socket.id,
                color: 'white'  // First player is always white
            };
            
            // Notify player they're waiting
            socket.emit('waitingForOpponent');
            console.log(`Player ${socket.id} waiting for opponent`);
        } else {
            // We have a player waiting, match them up!
            const gameId = generateGameId();
            
            // Create the game with initial game state
            activeGames[gameId] = {
                players: [
                    waitingPlayer,
                    { id: socket.id, color: 'black' }
                ],
                currentPlayer: 'white',
                board: Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null)),
                whiteScore: 0,
                blackScore: 0,
                gameOver: false,
                moveCount: 0,
                lastMove: null,
                moveHistory: [],
                gameStarted: true
            };
            
            // Join both sockets to the game room
            socket.join(gameId);
            const waitingSocket = io.sockets.sockets.get(waitingPlayer.id);
            if (waitingSocket) {
                waitingSocket.join(gameId);
            }
            
            // Notify both players
            socket.emit('gameMatched', { 
                gameId, 
                playerColor: 'black',
                gameState: activeGames[gameId]
            });
            
            io.to(waitingPlayer.id).emit('gameMatched', { 
                gameId, 
                playerColor: 'white',
                gameState: activeGames[gameId]
            });
            
            console.log(`Players matched in game: ${gameId}`);
            
            // Reset waiting player
            waitingPlayer = null;
        }
    });
    
    // Player cancels waiting for match
    socket.on('cancelWaiting', () => {
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
            console.log(`Player ${socket.id} canceled waiting`);
        }
    });
    
    // Handle a player's move
    socket.on('makeMove', (data) => {
        const { gameId, row, col } = data;
        
        // Validate the game
        if (!activeGames[gameId]) {
            socket.emit('gameError', { message: 'Game not found' });
            return;
        }
        
        // Get the game state
        const gameState = activeGames[gameId];
        
        // Find the player in the game
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex === -1) {
            socket.emit('gameError', { message: 'You are not in this game' });
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
        io.to(gameId).emit('gameUpdate', {
            move: result.move,
            gameState: gameState,
            gameOver: result.gameOver,
            winner: result.winner
        });
    });

    // Handle player terminating the game
    socket.on('terminateGame', (data) => {
        const { gameId } = data;
        
        // Validate the game
        if (!activeGames[gameId]) {
            socket.emit('gameError', { message: 'Game not found' });
            return;
        }
        
        // Get the game state
        const gameState = activeGames[gameId];
        
        // Find the player in the game
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex === -1) {
            socket.emit('gameError', { message: 'You are not in this game' });
            return;
        }
        
        // Get player color
        const playerColor = gameState.players[playerIndex].color;
        
        // Mark game as over
        gameState.gameOver = true;
        
        // Winner is the opposite player
        const winner = playerColor === 'white' ? 'black' : 'white';
        
        // Notify both players
        io.to(gameId).emit('gameTerminated', {
            terminatingPlayer: playerColor,
            winner: winner
        });
        
        console.log(`Game ${gameId} terminated by player ${playerColor}`);
    });

    // Handle player leaving the game intentionally
    socket.on('leaveGame', (data) => {
        const { gameId } = data;
        
        // Validate the game
        if (!activeGames[gameId]) {
            return;
        }
        
        // Get the game state
        const gameState = activeGames[gameId];
        
        // Find the player in the game
        const playerIndex = gameState.players.findIndex(p => p.id === socket.id);
        
        if (playerIndex === -1) {
            return;
        }
        
        // Get player color
        const playerColor = gameState.players[playerIndex].color;
        
        // Notify other player
        for (const player of gameState.players) {
            if (player.id !== socket.id) {
                io.to(player.id).emit('opponentDisconnected', { playerColor });
            }
        }
        
        // Remove the game
        delete activeGames[gameId];
        console.log(`Game ${gameId} ended due to player ${playerColor} leaving`);
    });
    
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // If waiting player disconnects
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
            return;
        }
        
        // Check all active games
        for (const gameId in activeGames) {
            const game = activeGames[gameId];
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                // Get player color
                const playerColor = game.players[playerIndex].color;
                
                // Notify other player
                for (const player of game.players) {
                    if (player.id !== socket.id) {
                        io.to(player.id).emit('opponentDisconnected', { playerColor });
                    }
                }
                
                // Remove the game
                delete activeGames[gameId];
                console.log(`Game ${gameId} ended due to player disconnect`);
                break;
            }
        }
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});