// multiplayer.js - Handles the client-side multiplayer functionality

// Initialize variables
let socket;
let roomCode = null;
let playerColor = null;
let isMultiplayerMode = false;

// Initialize multiplayer connection
function initializeMultiplayer() {
    // Connect to the server
    socket = io();
    
    // Setup all socket event listeners
    setupSocketListeners();
    
    console.log('Multiplayer initialized');
}

// Set up Socket.io event listeners
function setupSocketListeners() {
    // Room created event
    socket.on('roomCreated', (data) => {
        roomCode = data.roomCode;
        playerColor = data.playerColor;
        isMultiplayerMode = true;
        
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
        
        // Initialize the game with the received state
        initializeMultiplayerGame(data.gameState);
        
        console.log(`Joined room: ${roomCode}, You are: ${playerColor}`);
    });
    
    // Opponent joined event
    socket.on('opponentJoined', (data) => {
        // Hide waiting message and start the game
        hideWaitingMessage();
        startMultiplayerGame(data.gameState);
        
        // Show notification
        showNotification('Opponent joined! Game starting...');
        
        console.log('Opponent joined the game');
    });
    
    // Move made event
    socket.on('moveMade', (data) => {
        // Handle the move made by the opponent
        if (data.playerColor !== playerColor) {
            handleOpponentMove(data.row, data.col);
        }
    });
    
    // Game event
    socket.on('gameEvent', (data) => {
        // Handle various game events
        handleGameEvent(data.eventType, data.eventData);
    });
    
    // Opponent disconnected
    socket.on('opponentDisconnected', () => {
        showNotification('Opponent disconnected');
        handleOpponentDisconnect();
    });
    
    // Room error
    socket.on('roomError', (data) => {
        showNotification(`Error: ${data.message}`);
        console.error('Room error:', data.message);
    });
    
    // Game error
    socket.on('gameError', (data) => {
        showNotification(`Error: ${data.message}`);
        console.error('Game error:', data.message);
    });
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
    
    // Ensure it's the player's turn
    if (state.currentPlayer !== playerColor) {
        showNotification("Not your turn");
        return false;
    }
    
    // Send the move to the server
    socket.emit('makeMove', { roomCode, row, col });
    return true;
}

// Handle an opponent's move
function handleOpponentMove(row, col) {
    // Execute the move locally
    handleCellClick(row, col);
}

// Emit a game event to other players
function emitGameEvent(eventType, eventData) {
    if (!isMultiplayerMode || !socket || !roomCode) return;
    
    socket.emit('gameEvent', { roomCode, eventType, eventData });
}

// Handle game events from other players
function handleGameEvent(eventType, eventData) {
    switch (eventType) {
        case 'updateBoard':
            // Update the local board
            if (eventData.board) {
                state.board = eventData.board;
                updateBoard();
            }
            break;
            
        case 'switchPlayer':
            // Update the current player
            switchToNextPlayer();
            break;
            
        case 'updateScore':
            // Update scores
            if (eventData.whiteScore !== undefined) {
                state.whiteScore = eventData.whiteScore;
            }
            if (eventData.blackScore !== undefined) {
                state.blackScore = eventData.blackScore;
            }
            updateScores();
            break;
            
        case 'gameOver':
            // Handle game over
            state.gameOver = true;
            if (eventData.winner) {
                showGameOverMessage(eventData.winner);
            }
            break;
    }
}

// Initialize a multiplayer game with received state
function initializeMultiplayerGame(gameState) {
    // Reset the local game state
    resetGame();
    
    // Update with server state
    if (gameState) {
        state.board = gameState.board;
        state.currentPlayer = gameState.currentPlayer;
        state.whiteScore = gameState.whiteScore;
        state.blackScore = gameState.blackScore;
        state.gameOver = gameState.gameOver;
        state.gameStarted = true;
    }
    
    // Update the UI
    updateBoard();
    updateScores();
}

// Start a multiplayer game
function startMultiplayerGame(gameState) {
    // Update the UI to show the game has started
    document.querySelector('#timer-setup').style.display = 'none';
    document.body.classList.add('game-started');
    
    // Initialize with the game state
    state.gameStarted = true;
    initializeMultiplayerGame(gameState);
    
    // Show whose turn it is
    updatePlayerTurnIndicator();
}

// Handle opponent disconnection
function handleOpponentDisconnect() {
    // End the game or offer to wait for reconnection
    addSystemMessage("Opponent disconnected. Game ended.");
    
    // Optional: Show a button to return to home screen
    if (getElement('messages-content')) {
        const disconnectMsg = document.createElement('div');
        disconnectMsg.className = 'message-entry';
        disconnectMsg.innerHTML = '<button id="return-home" style="margin-top: 10px;">Return to Home</button>';
        getElement('messages-content').appendChild(disconnectMsg);
        
        document.getElementById('return-home').addEventListener('click', () => {
            resetGame();
            showHomeScreen();
        });
    }
}

// UI Helper functions
function showRoomCode(code) {
    // Create or update room code display
    let codeDisplay = document.getElementById('room-code-display');
    
    if (!codeDisplay) {
        codeDisplay = document.createElement('div');
        codeDisplay.id = 'room-code-display';
        codeDisplay.className = 'room-code';
        document.querySelector('.header-area').appendChild(codeDisplay);
    }
    
    codeDisplay.innerHTML = `<span>Room Code:</span> <strong>${code}</strong>`;
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
}

function updatePlayerTurnIndicator() {
    // Update whose turn it is based on currentPlayer and playerColor
    if (state.currentPlayer === playerColor) {
        showNotification("Your turn");
    } else {
        showNotification("Opponent's turn");
    }
}

// Initialize multiplayer when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // This will be called from the main flux.js
    // Initialization will happen when the player selects multiplayer mode
});

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
        const code = document.getElementById('room-code-input').value.trim().toUpperCase();
        if (code.length === 6) {
            joinGameRoom(code);
            homeScreen.style.display = 'none';
        } else {
            showNotification('Please enter a valid 6-character room code');
        }
    });
    
    document.getElementById('back-to-game-btn').addEventListener('click', () => {
        isMultiplayerMode = false;
        homeScreen.style.display = 'none';
        document.querySelector('#timer-setup').style.display = 'flex';
    });
}

// Export functions for use in flux.js
window.multiplayer = {
    initialize: initializeMultiplayer,
    createRoom: createGameRoom,
    joinRoom: joinGameRoom,
    makeMove: makeMultiplayerMove,
    emitGameEvent: emitGameEvent,
    showHomeScreen: showHomeScreen,
    isMultiplayerActive: () => isMultiplayerMode
};