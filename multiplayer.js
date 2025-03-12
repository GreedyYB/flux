// Multiplayer.js - Handles Socket.io connections and multiplayer game functionality

// Define the multiplayer functionality in a self-contained object
const multiplayer = {
    socket: null,
    gameId: null,
    playerColor: null,
    isWaiting: false,
    isActive: false,
    
    // Initialize the multiplayer connection
initialize: function() {
    // Connect to the server if not already connected
    if (!this.socket) {
        console.log("Connecting to socket.io server...");
        this.socket = io();
        this.setupEventListeners();
    }
    
    // Join the multiplayer queue
    this.joinMultiplayerQueue();
},
    
       
    // Initialize the multiplayer connection
    initialize: function() {
        // Connect to the server if not already connected
        if (!this.socket) {
            // Connect to the same host that served the page
            this.socket = io();
            this.setupEventListeners();
        }
        
        // Join the multiplayer queue
        this.joinMultiplayerQueue();
    },
    
    // Set up all the Socket.io event listeners
    setupEventListeners: function() {
        if (!this.socket) return;
        
        // Waiting for opponent
        this.socket.on('waitingForOpponent', () => {
            this.isWaiting = true;
            this.showWaitingScreen();
        });
        
        // Game matched - both players found
this.socket.on('gameMatched', (data) => {
    this.isWaiting = false;
    this.isActive = true;
    this.gameId = data.gameId;
    this.playerColor = data.playerColor;
    
    // Update the game state with the server's state
    if (window.state && data.gameState) {
        // Copy relevant properties from server state to client state
        window.state.board = data.gameState.board;
        window.state.currentPlayer = data.gameState.currentPlayer;
        window.state.whiteScore = data.gameState.whiteScore;
        window.state.blackScore = data.gameState.blackScore;
        window.state.gameStarted = true;
        window.state.moveCount = data.gameState.moveCount;
        window.state.moveHistory = [];  // Start with empty history
        
        // Update the board display
        if (typeof window.updateBoard === 'function') {
            window.updateBoard();
        }
        
        // Update scores
        if (typeof window.updateScores === 'function') {
            window.updateScores();
        }
        
        // Hide waiting screen
        this.hideWaitingScreen();
        
        // Show game started notification
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Game started! You are playing as ${this.playerColor}`, 3000);
        }
        
        // Add system message
        if (typeof window.addSystemMessage === 'function') {
            window.addSystemMessage(`Game started! You are playing as ${this.playerColor}`);
        }
        
        // Add game-started class to body
        document.body.classList.add('game-started');
        
        // Hide timer setup without causing layout shifts
const timerSetupElement = document.getElementById('timer-setup');
if (timerSetupElement) {
    // Add these styles to preserve layout space but make element invisible
    timerSetupElement.style.visibility = 'hidden';
    timerSetupElement.style.opacity = '0';
    timerSetupElement.style.pointerEvents = 'none'; // Prevents interaction
}
    }
});
        
        // Game update after a move
this.socket.on('gameUpdate', (data) => {
    if (!window.state) return;
    
    // Save the current board state before updating it
    const currentBoard = JSON.parse(JSON.stringify(window.state.board));
    const prevPlayer = window.state.currentPlayer;
    const prevWhiteScore = window.state.whiteScore;
    const prevBlackScore = window.state.blackScore;
    const prevMoveCount = window.state.moveCount;
    
    // Update game state
    window.state.board = data.gameState.board;
    window.state.currentPlayer = data.gameState.currentPlayer;
    window.state.whiteScore = data.gameState.whiteScore;
    window.state.blackScore = data.gameState.blackScore;
    window.state.moveCount = data.gameState.moveCount;
    window.state.lastMove = data.gameState.lastMove;
    
    // Add to move history if this is a new move
    if (data.move && data.move.playerColor) {
        // Create a history entry if it doesn't exist
        if (!window.state.moveHistory) {
            window.state.moveHistory = [];
        }
        
        // Save the board state and game state for this move
        window.state.moveHistory.push({
            board: currentBoard,
            currentPlayer: prevPlayer,
            whiteScore: prevWhiteScore,
            blackScore: prevBlackScore,
            moveCount: prevMoveCount,
            lastMove: { row: data.move.row, col: data.move.col }
        });
        
        console.log("Added move to history. Total moves:", window.state.moveHistory.length);
    }
    
    // If the last move formed vectors, visualize them
    if (data.move && data.move.vectors && data.move.vectors.length > 0 && typeof window.processVectorsSequentially === 'function') {
        // Process the vectors with animations
        window.processVectorsSequentially(data.move.vectors, data.move.row, data.move.col, data.move.linesFormed, () => {
            // After animations, update the board
            if (typeof window.updateBoard === 'function') {
                window.updateBoard();
            }
        });
    } else {
        // No vectors, just update the board
        if (typeof window.updateBoard === 'function') {
            window.updateBoard();
        }
    }
    
    // Add move to game log
    if (data.move && typeof window.addGameLogEntry === 'function') {
        const notation = data.move.linesFormed > 0 ? 
            `${data.move.notation}` : 
            data.move.notation;
        window.addGameLogEntry(notation);
    }
    
    // Check for game over
    if (data.gameOver) {
        window.state.gameOver = true;
        
        // Save final board state for review mode
        window.state.finalBoardState = JSON.parse(JSON.stringify(window.state.board));
        
        // Show game over message
        if (typeof window.addSystemMessage === 'function') {
            const winner = data.winner.charAt(0).toUpperCase() + data.winner.slice(1);
            window.addSystemMessage(`Game Over! ${winner} wins!`);
        }
        
        // Show game over banner
        const gameOverBanner = document.getElementById('game-over-banner');
        if (gameOverBanner) {
            const winner = data.winner.charAt(0).toUpperCase() + data.winner.slice(1);
            gameOverBanner.textContent = `Game Over! ${winner} wins!`;
            gameOverBanner.style.display = 'block';
        }
        
        // Enable review mode
        if (typeof window.enableReviewMode === 'function') {
            window.enableReviewMode();
        }
    }
});
        
        // Game error
        this.socket.on('gameError', (data) => {
            if (typeof window.showNotification === 'function') {
                window.showNotification(data.message, 3000);
            }
        });
        
        // Opponent disconnected
       this.socket.on('opponentDisconnected', (data) => {
        this.isActive = false;
        if (typeof window.addSystemMessage === 'function') {
            const color = data.playerColor.charAt(0).toUpperCase() + data.playerColor.slice(1);
            window.addSystemMessage(`${color} player disconnected. Game ended.`);
        }
        
        if (typeof window.showNotification === 'function') {
            window.showNotification('Opponent disconnected. Game ended.', 3000);
        }
        
        // Show game over banner
        const gameOverBanner = document.getElementById('game-over-banner');
        if (gameOverBanner) {
            gameOverBanner.textContent = 'Game Over! Opponent disconnected.';
            gameOverBanner.style.display = 'block';
        }
        
        window.state.gameOver = true;
    });
    
    // Game error
    this.socket.on('gameError', (data) => {
        if (typeof window.showNotification === 'function') {
            window.showNotification(data.message, 3000);
        }
    });
    
    // Game termination
    this.socket.on('gameTerminated', (data) => {
        this.isActive = false;
        window.state.gameOver = true;
        
        // Get player info with proper capitalization
        const terminatingColor = data.terminatingPlayer.charAt(0).toUpperCase() + data.terminatingPlayer.slice(1);
        const winnerColor = data.winner.charAt(0).toUpperCase() + data.winner.slice(1);
        
        // Create message
        const message = `${terminatingColor} terminated the game. ${winnerColor} wins!`;
        
        // Show message in game log
        if (typeof window.addSystemMessage === 'function') {
            window.addSystemMessage(message);
        }
        
        // Show notification
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 3000);
        }
        
        // Show game over banner
        const gameOverBanner = document.getElementById('game-over-banner');
        if (gameOverBanner) {
            gameOverBanner.textContent = `Game Over! ${message}`;
            gameOverBanner.style.display = 'block';
        }
        
        // Enable review mode
        if (typeof window.enableReviewMode === 'function') {
            window.enableReviewMode();
        }
    });
},

// Join the multiplayer queue to find an opponent
joinMultiplayerQueue: function() {
    if (!this.socket) return;
    
    this.socket.emit('joinMultiplayerQueue');
    this.isWaiting = true;
    this.showWaitingScreen();
},

// Cancel waiting in the queue
cancelWaiting: function() {
    if (!this.socket || !this.isWaiting) return;
    
    this.socket.emit('cancelWaiting');
    this.isWaiting = false;
    this.hideWaitingScreen();
},

// Make a move in the multiplayer game
makeMove: function(row, col) {
    if (!this.socket || !this.isActive || !this.gameId) return;
    
    // Don't allow moves if it's not the player's turn
    if (window.state && window.state.currentPlayer !== this.playerColor) {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Not your turn", 2000);
        }
        return;
    }
    
    // Send the move to the server
    this.socket.emit('makeMove', {
        gameId: this.gameId,
        row: row,
        col: col
    });
},

// Terminate the multiplayer game
terminateGame: function() {
    if (!this.socket || !this.isActive || !this.gameId) return;
    
    // Send terminate event to server
    this.socket.emit('terminateGame', {
        gameId: this.gameId
    });
},
    
    // Create a simple waiting screen overlay
    showWaitingScreen: function() {
        let waitingScreen = document.getElementById('waiting-screen');
        
        if (!waitingScreen) {
            waitingScreen = document.createElement('div');
            waitingScreen.id = 'waiting-screen';
            waitingScreen.style.position = 'fixed';
            waitingScreen.style.top = '0';
            waitingScreen.style.left = '0';
            waitingScreen.style.width = '100%';
            waitingScreen.style.height = '100%';
            waitingScreen.style.backgroundColor = 'rgba(0,0,0,0.8)';
            waitingScreen.style.display = 'flex';
            waitingScreen.style.flexDirection = 'column';
            waitingScreen.style.alignItems = 'center';
            waitingScreen.style.justifyContent = 'center';
            waitingScreen.style.zIndex = '1000';
            waitingScreen.style.color = 'white';
            waitingScreen.style.fontSize = '24px';
            
            const waitingMessage = document.createElement('div');
            waitingMessage.textContent = 'Waiting for opponent...';
            waitingMessage.style.marginBottom = '20px';
            
            const spinner = document.createElement('div');
            spinner.style.border = '5px solid rgba(255,255,255,0.3)';
            spinner.style.borderTop = '5px solid white';
            spinner.style.borderRadius = '50%';
            spinner.style.width = '50px';
            spinner.style.height = '50px';
            spinner.style.animation = 'spin 1s linear infinite';
            
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.style.marginTop = '20px';
            cancelButton.style.padding = '10px 20px';
            cancelButton.style.border = 'none';
            cancelButton.style.borderRadius = '5px';
            cancelButton.style.backgroundColor = '#e74c3c';
            cancelButton.style.color = 'white';
            cancelButton.style.cursor = 'pointer';
            
            cancelButton.addEventListener('click', () => {
                this.cancelWaiting();
            });
            
            // Add keyframes for spinner animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            waitingScreen.appendChild(waitingMessage);
            waitingScreen.appendChild(spinner);
            waitingScreen.appendChild(cancelButton);
            
            document.body.appendChild(waitingScreen);
        } else {
            waitingScreen.style.display = 'flex';
        }
    },
    
    // Hide the waiting screen
    hideWaitingScreen: function() {
        const waitingScreen = document.getElementById('waiting-screen');
        if (waitingScreen) {
            waitingScreen.style.display = 'none';
        }
    },
    
    // Check if multiplayer mode is active
    isMultiplayerActive: function() {
        return this.isActive;
    },
    
    // Emit a game event to the server (for various updates)
emitGameEvent: function(eventName, data) {
    if (!this.socket || !this.isActive || !this.gameId) return;
    
    // Add gameId to the data
    const eventData = {
        ...data,
        gameId: this.gameId
    };
    
    this.socket.emit(eventName, eventData);
},

// Leave the current game and notify the opponent
leaveGame: function() {
    if (!this.socket || !this.isActive || !this.gameId) return;
    
    // Send leave game event to server
    this.socket.emit('leaveGame', {
        gameId: this.gameId
    });
    
    // Reset multiplayer state
    this.isActive = false;
    this.gameId = null;
},

// Play again after a game has ended
playAgain: function() {
    // Reset all multiplayer state
    this.isActive = false;
    this.gameId = null;
    
    // If socket exists, rejoin the queue
    if (this.socket) {
        // Reset the game state
        if (window.resetGame && typeof window.resetGame === 'function') {
            window.resetGame();
        }
        
        // Hide any game over messages
        const gameOverBanner = document.getElementById('game-over-banner');
        if (gameOverBanner) {
            gameOverBanner.style.display = 'none';
        }
        
        // Join the multiplayer queue again
        this.joinMultiplayerQueue();
    } else {
        // If socket doesn't exist, reinitialize
        this.initialize();
    }
}
};

// Export the multiplayer object to the window scope so other scripts can access it
window.multiplayer = multiplayer;