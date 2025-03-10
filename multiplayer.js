// multiplayer.js - Client-side multiplayer functionality

// Initialize variables
let socket;
let roomCode = null;
let playerColor = null;
let isMultiplayerMode = false;
let isProcessingMove = false;

// Initialize multiplayer connection
function initializeMultiplayer() {
    // Connect to the server with explicit URL
    const serverUrl = window.location.origin;
    console.log("Connecting to server at:", serverUrl);
    socket = io(serverUrl);
    
    // Add connection status logging
    socket.on('connect', () => {
        console.log('Socket connected successfully, ID:', socket.id);
    });
    
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });
    
    // Setup all socket event listeners
    setupSocketListeners();
    
    console.log('Multiplayer initialized');
}

// Set up Socket.io event listeners
function setupSocketListeners() {
    // Room created event
socket.on('roomCreated', (data) => {
    console.log("Room created data received:", data);
    
    if (!data || data.roomCode === undefined) {
        console.error("Invalid room data received:", data);
        if (typeof window.showNotification === 'function') {
            window.showNotification("Error creating room. Please try again.");
        }
        return;
    }
    
    roomCode = data.roomCode;
    playerColor = data.playerColor;
    isMultiplayerMode = true;
    
    // Initialize game with server state
    if (data.gameState) {
        initializeGameWithServerState(data.gameState);
    }
    
    // Update UI to show room code and waiting for opponent
    showRoomCode(roomCode);
    showWaitingMessage();
    
    console.log(`Room created: ${roomCode}, You are: ${playerColor}`);
});
    
    // Room joined event
    socket.on('roomJoined', (data) => {
        roomCode = data.roomCode;
        playerColor = data.playerColor;
        isMultiplayerMode = true;
        
        // Update UI to show room code
        showRoomCode(roomCode);
        
        // Initialize game with server state
        initializeGameWithServerState(data.gameState);
        
        console.log(`Joined room: ${roomCode}, You are: ${playerColor}`);
    });
    
    // Opponent joined event
    socket.on('opponentJoined', (data) => {
        // Hide waiting message and start the game
        hideWaitingMessage();
        
        // Update game with server state
        updateGameWithServerState(data.gameState);
        
        // Show notification
        if (typeof window.showNotification === 'function') {
            window.showNotification('Opponent joined! Game starting...');
        }
        
        console.log('Opponent joined the game');
    });
    
    // Game update event (new unified event for moves and state updates)
    socket.on('gameUpdate', (data) => {
        // Process the move animation
        const move = data.move;
        
        // If this is a move with vectors (creates a node), animate it
        if (move && move.linesFormed > 0) {
            animateVectorMove(move, () => {
                // After animation completes, update the entire board state
                updateGameWithServerState(data.gameState);
                
                // Check for game over
                if (data.gameOver) {
                    handleGameOver(data.winner);
                }
            });
        } else {
            // Regular move - just update the state
            updateGameWithServerState(data.gameState);
            
            // Check for game over
            if (data.gameOver) {
                handleGameOver(data.winner);
            }
        }
    });
    
    // Game error
    socket.on('gameError', (data) => {
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Error: ${data.message}`);
        }
        console.error('Game error:', data.message);
        
        // Reset processing flag
        isProcessingMove = false;
    });
    
    // Room error
    socket.on('roomError', (data) => {
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Error: ${data.message}`);
        }
        console.error('Room error:', data.message);
    });
    
    // Opponent disconnected
    socket.on('opponentDisconnected', (data) => {
        const opponentColor = data && data.playerColor ? data.playerColor : 
                             (playerColor === 'white' ? 'black' : 'white');
        
        if (typeof window.showNotification === 'function') {
            window.showNotification(`${capitalize(opponentColor)} player disconnected`);
        }
        
        handleOpponentDisconnect();
    });
}

// Handle opponent disconnect
function handleOpponentDisconnect() {
    // Show message in game log
    if (typeof window.addSystemMessage === 'function') {
        window.addSystemMessage("Opponent disconnected. Game ended.");
    }
    
    // Optional: Show a button to return to home screen
    const messagesContent = document.getElementById('messages-content');
    if (messagesContent) {
        const disconnectMsg = document.createElement('div');
        disconnectMsg.className = 'message-entry';
        disconnectMsg.innerHTML = '<button id="return-home" style="margin-top: 10px;">Return to Home</button>';
        messagesContent.appendChild(disconnectMsg);
        
        document.getElementById('return-home').addEventListener('click', () => {
            resetLocalGame();
            showHomeScreen();
        });
    }
}

// Create a new multiplayer game room
function createGameRoom() {
    if (socket) {
        socket.emit('createRoom');
    } else {
        console.error('Socket not initialized');
    }
}

// Join an existing game room
function joinGameRoom(code) {
    if (socket) {
        socket.emit('joinRoom', { roomCode: code });
    } else {
        console.error('Socket not initialized');
    }
}

// Make a move in multiplayer game
function makeMultiplayerMove(row, col) {
    if (!isMultiplayerMode || !socket || !roomCode) return false;
    
    // Prevent multiple rapid moves
    if (isProcessingMove) return false;
    isProcessingMove = true;
    
    // Send the move to the server
    socket.emit('makeMove', { roomCode, row, col });
    
    // Return true to indicate the move was sent
    // The server will validate it and send back a response
    return true;
}

// Initialize the game with a server state
function initializeGameWithServerState(gameState) {
    // First reset the local game
    resetLocalGame();
    
    // Then update with the server state
    updateGameWithServerState(gameState);
}

// Update the game with server state
function updateGameWithServerState(gameState) {
    if (!gameState || !window.state) return;
    
    // Update the board
    window.state.board = gameState.board;
    
    // Update other state properties
    window.state.currentPlayer = gameState.currentPlayer;
    window.state.whiteScore = gameState.whiteScore;
    window.state.blackScore = gameState.blackScore;
    window.state.moveCount = gameState.moveCount;
    window.state.lastMove = gameState.lastMove;
    window.state.gameOver = gameState.gameOver;
    window.state.gameStarted = gameState.gameStarted || (gameState.moveCount > 0);
    
    // Update game started class
    if (window.state.gameStarted) {
        document.body.classList.add('game-started');
        
        // Hide timer setup if visible
        const timerSetup = document.querySelector('#timer-setup');
        if (timerSetup && timerSetup.style.display !== 'none') {
            timerSetup.style.display = 'none';
        }
    }
    
    // Update the board display
    if (typeof window.updateBoard === 'function') {
        window.updateBoard();
    }
    
    // Update scores
    if (typeof window.updateScores === 'function') {
        window.updateScores();
    }
    
    // Update turn indicators
    updateTurnIndicators();
    
    // Reset processing flag
    isProcessingMove = false;
}

// Reset the local game state
function resetLocalGame() {
    if (typeof window.resetGame === 'function') {
        window.resetGame();
    }
}

// Animate a vector move (when a node is created)
function animateVectorMove(move, callback) {
    if (!move || !window.state) {
        if (callback) callback();
        return;
    }
    
    // Place the piece first
    if (typeof window.placeIon === 'function') {
        window.placeIon(move.row, move.col, move.playerColor);
    } else {
        // Fallback
        window.state.board[move.row][move.col] = {
            color: move.playerColor,
            protectionLevel: move.linesFormed > 0 ? move.linesFormed : 0
        };
    }
    
    // If there are vectors to animate
    if (move.linesFormed > 0 && move.vectors && move.vectors.length > 0) {
        // Use the client's vector animation if available
        if (typeof window.processVectorsSequentially === 'function') {
            window.processVectorsSequentially(
                move.vectors, 
                move.row, 
                move.col, 
                move.linesFormed, 
                callback
            );
        } else {
            // No animation support, just call the callback
            if (callback) callback();
        }
    } else {
        // No vectors, just call the callback
        if (callback) callback();
    }
}

// Handle game over
function handleGameOver(winner) {
    if (!window.state) return;
    
    // Set game over flag
    window.state.gameOver = true;
    
    // Show game over message
    const winnerName = capitalize(winner);
    const message = `Game Over! ${winnerName} wins!`;
    
    // Add system message
    if (typeof window.addSystemMessage === 'function') {
        window.addSystemMessage(message);
    }
    
    // Show banner
    const gameOverBanner = document.getElementById('game-over-banner');
    if (gameOverBanner) {
        gameOverBanner.textContent = message;
        gameOverBanner.style.display = 'block';
    }
    
    // Enable review mode if available
    if (typeof window.enableReviewMode === 'function') {
        window.enableReviewMode();
    }
}

// Update turn indicators based on current player
function updateTurnIndicators() {
    if (!window.state) return;
    
    // Remove active player class from both scores
    document.querySelector('.white-score').classList.remove('active-player');
    document.querySelector('.black-score').classList.remove('active-player');
    
    // Add active player class to current player's score
    const activeScoreClass = window.state.currentPlayer === 'white' ? '.white-score' : '.black-score';
    document.querySelector(activeScoreClass).classList.add('active-player');
    
    // Show turn notification
    if (window.state.currentPlayer === playerColor) {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Your turn");
        }
    } else {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Opponent's turn");
        }
    }
}

// Helper function to capitalize first letter
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// UI Helper functions
function showRoomCode(code) {
    console.log("Showing room code:", code);
    
    // Create or update room code display
    let codeDisplay = document.getElementById('room-code-display');
    
    if (!codeDisplay) {
        codeDisplay = document.createElement('div');
        codeDisplay.id = 'room-code-display';
        codeDisplay.className = 'room-code';
        document.querySelector('.header-area').appendChild(codeDisplay);
    }
    
    codeDisplay.innerHTML = `<span>Room Code:</span> <strong>${code || 'None'}</strong>`;
    codeDisplay.style.display = 'block';
}

function showWaitingMessage() {
    // Show waiting for opponent message
    let waitingMsg = document.getElementById('waiting-message');
    
    if (!waitingMsg) {
        waitingMsg = document.createElement('div');
        waitingMsg.id = 'waiting-message';
        waitingMsg.className = 'waiting-message';
        waitingMsg.innerHTML = 'Waiting for opponent to join...';
        document.querySelector('.header-area').appendChild(waitingMsg);
    }
    
    waitingMsg.style.display = 'block';
}

function hideWaitingMessage() {
    const waitingMsg = document.getElementById('waiting-message');
    if (waitingMsg) {
        waitingMsg.style.display = 'none';
    }
}

function showHomeScreen() {
    // Hide game elements
    document.body.classList.remove('game-started');
    
    // Show home screen
    let homeScreen = document.getElementById('home-screen');
    if (!homeScreen) {
        // Create home screen if it doesn't exist
        createHomeScreenUI();
    } else {
        homeScreen.style.display = 'block';
    }
    
    // Hide multiplayer elements
    const roomCodeDisplay = document.getElementById('room-code-display');
    if (roomCodeDisplay) roomCodeDisplay.style.display = 'none';
    
    hideWaitingMessage();
    
    // Reset multiplayer state
    isMultiplayerMode = false;
    roomCode = null;
    playerColor = null;
}

// This function will be called from the HTML UI
function createHomeScreenUI() {
    // Create home screen container
    const homeScreen = document.createElement('div');
    homeScreen.id = 'home-screen';
    homeScreen.className = 'home-screen';
    
    // Create content
    homeScreen.innerHTML = `
        <h2>Flux - Multiplayer Mode</h2>
        <div class="home-buttons">
            <button id="create-game-btn" class="home-button">Create New Game</button>
            <div class="join-game-container">
                <button id="join-game-btn" class="home-button">Join Game</button>
                <input type="text" id="room-code-input" placeholder="Enter room code" maxlength="6">
            </div>
            <button id="back-to-game-btn" class="home-button">Back to Single Player</button>
        </div>
    `;
    
    // Add to the document
    document.body.insertBefore(homeScreen, document.querySelector('.header-area'));
    
    // Add event listeners
    document.getElementById('create-game-btn').addEventListener('click', () => {
        createGameRoom();
        homeScreen.style.display = 'none';
    });
    
    document.getElementById('join-game-btn').addEventListener('click', () => {
        const codeInput = document.getElementById('room-code-input');
        if (codeInput) {
            const code = codeInput.value.trim().toUpperCase();
            if (code.length === 6) {
                joinGameRoom(code);
                homeScreen.style.display = 'none';
            } else {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('Please enter a valid 6-character room code');
                }
            }
        }
    });
    
    document.getElementById('back-to-game-btn').addEventListener('click', () => {
        isMultiplayerMode = false;
        homeScreen.style.display = 'none';
        const timerSetup = document.querySelector('#timer-setup');
        if (timerSetup) {
            timerSetup.style.display = 'flex';
        }
    });
}

// Export functions for use in flux.js
window.multiplayer = {
    initialize: initializeMultiplayer,
    createRoom: createGameRoom,
    joinRoom: joinGameRoom,
    makeMove: makeMultiplayerMove,
    showHomeScreen: showHomeScreen,
    isMultiplayerActive: () => isMultiplayerMode
};