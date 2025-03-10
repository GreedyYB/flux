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
        if (typeof window.showNotification === 'function') {
            window.showNotification('Opponent joined! Game starting...');
        }
        
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
        if (typeof window.showNotification === 'function') {
            window.showNotification('Opponent disconnected');
        }
        handleOpponentDisconnect();
    });
    
    // Room error
    socket.on('roomError', (data) => {
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Error: ${data.message}`);
        }
        console.error('Room error:', data.message);
    });
    
    // Game error
    socket.on('gameError', (data) => {
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Error: ${data.message}`);
        }
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
    if (window.state && window.state.currentPlayer !== playerColor) {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Not your turn");
        }
        return false;
    }
    
    // Send the move to the server
    socket.emit('makeMove', { roomCode, row, col });
    return true;
}

// Handle an opponent's move
function handleOpponentMove(row, col) {
    try {
        // Skip the multiplayer check when processing opponent's move
        if (!window.state) return;
        
        // Get opponent's color (opposite of player's color)
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        
        // Save current board state to history
        if (typeof window.saveCurrentStateToHistory === 'function') {
            window.saveCurrentStateToHistory();
        }
        
        // Place opponent's ion directly
        if (typeof window.placeIon === 'function') {
            window.placeIon(row, col, opponentColor);
        } else {
            // Fallback if placeIon isn't available
            window.state.board[row][col] = {
                color: opponentColor,
                protectionLevel: 0
            };
        }
        
        // Update last move
        window.state.lastMove = { row, col };
        
        // Increment move counter
        window.state.moveCount++;
        
        // Get position label for game log
        const positionLabel = String.fromCharCode(65 + col) + (8 - row);
        
        // Check for vectors/lines just like in handleCellClick
        const checkLines = function() {
            if (typeof window.checkForLines === 'function') {
                return window.checkForLines(row, col, opponentColor);
            }
            return { linesFormed: 0 };
        };
        
        const linesInfo = checkLines();
        
        if (linesInfo.linesFormed > 0) {
            // Update protection level
            window.state.board[row][col].protectionLevel = linesInfo.linesFormed;
            
            // Update score
            if (opponentColor === 'white') {
                window.state.whiteScore += linesInfo.linesFormed;
            } else {
                window.state.blackScore += linesInfo.linesFormed;
            }
            
            // Add to game log with N notation
            const nodeLabel = linesInfo.linesFormed > 1 ? 
                `${positionLabel}<span class="node-marker">N</span>${linesInfo.linesFormed}` : 
                `${positionLabel}<span class="node-marker">N</span>`;
            
            if (typeof window.addGameLogEntry === 'function') {
                window.addGameLogEntry(nodeLabel);
            }
        } else {
            // Just add position to log
            if (typeof window.addGameLogEntry === 'function') {
                window.addGameLogEntry(positionLabel);
            }
        }
        
        // Don't call switchToNextPlayer - the server handles that
        
        // Update the board display
        if (typeof window.updateBoard === 'function') {
            window.updateBoard();
        }
        
    } catch (error) {
        console.error("Error handling opponent move:", error);
    }
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
            if (eventData.board && window.state) {
                window.state.board = eventData.board;
                if (typeof window.updateBoard === 'function') {
                    window.updateBoard();
                }
            }
            break;
            
        case 'switchPlayer':
            // Update the current player
            if (typeof window.switchToNextPlayer === 'function') {
                window.switchToNextPlayer();
            }
            break;
            
        case 'updateScore':
            // Update scores
            if (window.state) {
                if (eventData.whiteScore !== undefined) {
                    window.state.whiteScore = eventData.whiteScore;
                }
                if (eventData.blackScore !== undefined) {
                    window.state.blackScore = eventData.blackScore;
                }
                if (typeof window.updateScores === 'function') {
                    window.updateScores();
                }
            }
            break;
            
        case 'gameOver':
            // Handle game over
            if (window.state) {
                window.state.gameOver = true;
                if (eventData.winner && typeof window.showGameOverMessage === 'function') {
                    window.showGameOverMessage(eventData.winner);
                }
            }
            break;
    }
}

// Initialize a multiplayer game with received state
function initializeMultiplayerGame(gameState) {
    // Reset the local game state
    if (typeof window.resetGame === 'function') {
        window.resetGame();
    }
    
    // Update with server state
    if (gameState && window.state) {
        window.state.board = gameState.board;
        window.state.currentPlayer = gameState.currentPlayer;
        window.state.whiteScore = gameState.whiteScore;
        window.state.blackScore = gameState.blackScore;
        window.state.gameOver = gameState.gameOver;
        window.state.gameStarted = true;
    }
    
    // Update the UI
    if (typeof window.updateBoard === 'function') {
        window.updateBoard();
    }
    if (typeof window.updateScores === 'function') {
        window.updateScores();
    }
}

// Start a multiplayer game
function startMultiplayerGame(gameState) {
    // Update the UI to show the game has started
    const timerSetup = document.querySelector('#timer-setup');
    if (timerSetup) {
        timerSetup.style.display = 'none';
    }
    document.body.classList.add('game-started');
    
    // Initialize with the game state
    if (window.state) {
        window.state.gameStarted = true;
    }
    initializeMultiplayerGame(gameState);
    
    // Show whose turn it is
    updatePlayerTurnIndicator();
}

// Handle opponent disconnection
function handleOpponentDisconnect() {
    // End the game or offer to wait for reconnection
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
            if (typeof window.resetGame === 'function') {
                window.resetGame();
            }
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
    if (window.state && window.state.currentPlayer === playerColor) {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Your turn");
        }
    } else {
        if (typeof window.showNotification === 'function') {
            window.showNotification("Opponent's turn");
        }
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
    emitGameEvent: emitGameEvent,
    showHomeScreen: showHomeScreen,
    isMultiplayerActive: () => isMultiplayerMode
};