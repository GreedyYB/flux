// ==================== GAME INITIALIZATION ====================
// Initialize game once the page is loaded
window.onload = initializeGame;

// Global state and constants
const BOARD_SIZE = 8;
const LINE_LENGTH = 4;

// Game state
const state = {
    currentPlayer: 'white',
    board: Array(8).fill().map(() => Array(8).fill(null)),
    whiteScore: 0,
    blackScore: 0,
    gameOver: false,
    lastMove: null,
    moveCount: 0,
    gameStarted: false,
    reviewMode: false,
    moveHistory: [],
    currentReviewMove: 0,
    nexusPositions: null,
    finalBoardState: null,
    pendingAIMove: false
};

// Timer state
const timerState = {
    enabled: false,
    whiteTime: 600, // Default 10 minutes (in seconds)
    blackTime: 600,
    increment: 0,
    running: false,
    intervalId: null,
    activeTimer: 'white'
};

// Track DOM elements
let boardElement, columnLabelsElement, rowLabelsElement;
let whiteScoreElement, blackScoreElement, messagesContentElement;
let resetButton, helpButton, terminateButton, helpText, gameOverBanner, notificationElement;
let playWhiteRadio, playBlackRadio;
let coreAvatar, coreStatus;
let reviewControlsElement, reviewFirstButton, reviewPrevButton, reviewNextButton, reviewLastButton, reviewMoveCounter;
let timerSetupElement, timerOptionsElement, useTimerCheckbox, baseTimeSelect, incrementSelect, startGameButton;
let whiteTimerElement, blackTimerElement, whiteTimerValueElement, blackTimerValueElement;
let gameModeSelect;
let isAIMakingMove = false; // Track if the AI is currently making a move

// Main initialization function
function initializeGame() {
    // Get DOM elements
    getGameElements();
    
    // Set up event handlers
    setupEventHandlers();
    
    // Initialize the board
    initializeBoard();
    updateScores();
    
    // Set up AI difficulty change handler
    setupAIDifficultyChangeHandler();
    
    // Start the game loop for AI
    setInterval(gameLoop, 100);
    
    // Initialize avatar synchronization
    syncCoreAvatars();
    
    // Export functions to window for multiplayer
    exportFunctionsToWindow();
}

// ==================== ELEMENT INITIALIZATION ====================

// Safely get DOM elements
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id "${id}" not found`);
    }
    return element;
}

// Get all game DOM elements
function getGameElements() {
    boardElement = getElement('board');
    columnLabelsElement = getElement('column-labels');
    rowLabelsElement = getElement('row-labels');
    whiteScoreElement = getElement('white-score');
    blackScoreElement = getElement('black-score');
    messagesContentElement = getElement('messages-content');
    resetButton = getElement('reset-button');
    helpButton = getElement('help-button');
    terminateButton = getElement('terminate-button');
    helpText = getElement('help-text');
    gameOverBanner = getElement('game-over-banner');
    notificationElement = getElement('notification');
    
    // Player color selection
    playWhiteRadio = getElement('play-white');
    playBlackRadio = getElement('play-black');
    
    // CORE avatar elements
    coreAvatar = getElement('core-avatar');
    coreStatus = coreAvatar ? coreAvatar.querySelector('.avatar-status') : null;
    
    // Review controls
    reviewControlsElement = getElement('review-controls');
    reviewFirstButton = getElement('review-first');
    reviewPrevButton = getElement('review-prev');
    reviewNextButton = getElement('review-next');
    reviewLastButton = getElement('review-last');
    reviewMoveCounter = getElement('review-move-counter');
    
    // Timer elements
    timerSetupElement = getElement('timer-setup');
    timerOptionsElement = getElement('timer-options');
    useTimerCheckbox = getElement('use-timer');
    baseTimeSelect = getElement('base-time');
    incrementSelect = getElement('increment');
    startGameButton = getElement('start-game');
    whiteTimerElement = getElement('white-timer');
    blackTimerElement = getElement('black-timer');
    whiteTimerValueElement = whiteTimerElement ? whiteTimerElement.querySelector('.timer-value') : null;
    blackTimerValueElement = blackTimerElement ? blackTimerElement.querySelector('.timer-value') : null;
    
    // Game mode select
    gameModeSelect = getElement('game-mode');
    
    // Check critical elements
    if (!boardElement || !rowLabelsElement || !columnLabelsElement) {
        console.error("Critical game elements not found. Cannot initialize game.");
        return false;
    }
    
    return true;
}

// Set up game mode change handler
function setupEventHandlers() {
    // Game mode change handler
    if (gameModeSelect && coreAvatar) {
        // Initial update based on selected mode
        updateCoreVisibility(gameModeSelect.value);
        updateAIDifficultyVisibility(gameModeSelect.value);
        updateGameModeClass(gameModeSelect.value);
        
        // Add event listener for changes
        gameModeSelect.addEventListener('change', function() {
            const mode = this.value;
            updateCoreVisibility(mode);
            updateAIDifficultyVisibility(mode);
            updateGameModeClass(mode);
            
            // Handle multiplayer mode selection
            if (mode === 'multiplayer') {
                // Initialize multiplayer connection if not already done
                if (window.multiplayer && typeof window.multiplayer.initialize === 'function') {
                    window.multiplayer.initialize();
                }
                
                // Show multiplayer home screen
                if (window.multiplayer && typeof window.multiplayer.showHomeScreen === 'function') {
                    window.multiplayer.showHomeScreen();
                }
                
                // Hide player color selection - this is determined by the room
                document.querySelector('.player-color').style.display = 'none';
            } else {
                // Show player color selection for non-multiplayer modes
                document.querySelector('.player-color').style.display = 'flex';
                
                // Hide multiplayer home screen if it exists
                const homeScreen = document.getElementById('home-screen');
                if (homeScreen) {
                    homeScreen.style.display = 'none';
                }
            }
        });
    }
    
    // Timer checkbox
    if (useTimerCheckbox) {
        useTimerCheckbox.addEventListener('change', function() {
            if (timerOptionsElement) {
                timerOptionsElement.style.display = this.checked ? 'flex' : 'none';
            }
        });
    }
    
    // Start game button
    if (startGameButton) {
        startGameButton.addEventListener('click', handleStartGame);
    }
    
    // Reset button
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }
    
    // Help button
    if (helpButton && helpText) {
        helpButton.addEventListener('click', () => {
            const isVisible = helpText.style.display === 'block';
            helpText.style.display = isVisible ? 'none' : 'block';
            helpButton.textContent = isVisible ? 'Rules' : 'Rules X';
        });
    }
    
    // Terminate button
    if (terminateButton) {
        terminateButton.addEventListener('click', () => {
            if (!state.gameStarted) {
                showNotification("The game hasn't started yet.");
                return;
            }
            
            if (confirm(`Are you sure you want to terminate the game? This will concede the win to ${state.currentPlayer === 'white' ? 'Black' : 'White'}.`)) {
                terminateGame();
            }
        });
    }
    
    // Review control button listeners
    if (reviewFirstButton) {
        reviewFirstButton.addEventListener('click', goToFirstMove);
    }
    
    if (reviewPrevButton) {
        reviewPrevButton.addEventListener('click', goToPreviousMove);
    }
    
    if (reviewNextButton) {
        reviewNextButton.addEventListener('click', goToNextMove);
    }
    
    if (reviewLastButton) {
        reviewLastButton.addEventListener('click', goToLastMove);
    }
}

function handleStartGame() {
    // Get selected player color
    const selectedColor = playWhiteRadio && playWhiteRadio.checked ? 'white' : 'black';
    
    // Always start with white as the current player (as per game rules)
    state.currentPlayer = 'white';
    
    // If player chose black and playing against AI, set a flag for AI to make first move
    if (selectedColor === 'black') {
        const gameMode = document.getElementById('game-mode').value;
        if (gameMode === 'ai') {
            // Set a flag to trigger AI's first move as white
            state.pendingAIMove = true;
        }
    }
    
    state.gameStarted = true;
    
    // Hide setup and show timers if needed
    if (timerSetupElement) {
        timerSetupElement.style.visibility = 'hidden';
        timerSetupElement.style.opacity = '0';
        timerSetupElement.style.pointerEvents = 'none';
    }
    
    // Setup timers
    setupTimers();
    
    // Save initial empty board state to history
    saveCurrentStateToHistory();
    
    // Initialize CORE's status
    updateCoreStatus('Waiting');
    
    // Update active player visual indicator
    document.querySelector('.white-score').classList.remove('active-player');
    document.querySelector('.black-score').classList.remove('active-player');
    
    const activeScoreClass = '.white-score'; // Always white first
    document.querySelector(activeScoreClass).classList.add('active-player');
    
    // Add game-started class to body
    document.body.classList.add('game-started');
    
    // If AI should make first move (player chose black)
    if (state.pendingAIMove) {
        // Small delay to ensure UI updates first
        setTimeout(() => {
            const difficulty = parseInt(document.getElementById('ai-difficulty').value);
            updateCoreStatus('Thinking...');
            
            // Random delay to simulate thinking - keeping the 3-5 second range
            const thinkingDelay = 3000 + Math.floor(Math.random() * 2000);
            
            setTimeout(() => {
                try {
                    // AI is playing as white for the first move
                    const aiModule = window.getAIMove || window.ai || (window.AI && window.AI.getAIMove);
                    
                    if (typeof aiModule === 'function') {
                        const move = aiModule(state.board, 'white', difficulty);
                        updateCoreStatus('Move found');
                        
                        setTimeout(() => {
                            if (move && move.row !== undefined && move.col !== undefined) {
                                // Check if game hasn't ended before making the move
                                if (!state.gameOver) {
                                    handleCellClick(move.row, move.col);
                                    setTimeout(() => {
                                        updateCoreStatus('Waiting');
                                    }, 1000);
                                }
                            } else {
                                console.error("AI returned invalid move:", move);
                                state.pendingAIMove = false;
                                updateCoreStatus('Waiting');
                            }
                        }, 800);
                    } else {
                        // Try to find the getAIMove function from imported ai.js script
                        if (typeof getAIMove === 'function') {
                            const move = getAIMove(state.board, 'white', difficulty);
                            updateCoreStatus('Move found');
                            
                            setTimeout(() => {
                                if (move && move.row !== undefined && move.col !== undefined) {
                                    if (!state.gameOver) {
                                        handleCellClick(move.row, move.col);
                                        setTimeout(() => {
                                            updateCoreStatus('Waiting');
                                        }, 1000);
                                    }
                                } else {
                                    console.error("AI returned invalid move:", move);
                                    state.pendingAIMove = false;
                                    updateCoreStatus('Waiting');
                                }
                            }, 800);
                        } else {
                            console.error("Could not find getAIMove function");
                            state.pendingAIMove = false;
                            updateCoreStatus('Waiting');
                            
                            // Show a notification to the user
                            showNotification("AI module not loaded properly. Please refresh the page.", 5000);
                        }
                    }
                } catch (error) {
                    console.error("Error in AI's first move:", error);
                    state.pendingAIMove = false;
                    updateCoreStatus('Waiting');
                }
            }, thinkingDelay);
        }, 500);
    }
}

function updateAIDifficultyVisibility(gameMode) {
    const aiDifficultyContainer = document.querySelector('.ai-difficulty');
    if (!aiDifficultyContainer) return;
    
    // Only show AI difficulty selector when in AI mode
    if (gameMode === 'ai') {
        aiDifficultyContainer.style.display = 'flex';
    } else {
        aiDifficultyContainer.style.display = 'none';
    }
}

function updateGameModeClass(gameMode) {
    // Add or remove the ai-mode class from the body
    if (gameMode === 'ai') {
        document.body.classList.add('ai-mode');
    } else {
        document.body.classList.remove('ai-mode');
    }
}

// Setup AI difficulty change handler
function setupAIDifficultyChangeHandler() {
    const difficultySelect = document.getElementById('ai-difficulty');
    if (difficultySelect) {
        difficultySelect.addEventListener('change', function() {
            const difficulty = parseInt(this.value);
            if (difficulty >= 5) {
                showNotification("Higher difficulty levels may take longer to compute moves.");
            }
        });
    }
}

function updateCoreVisibility(gameMode) {
    if (!coreAvatar) return;
    
    if (gameMode === 'ai') {
        coreAvatar.style.display = 'flex';
        updateCoreStatus(state.gameStarted ? 'Waiting' : 'Standby');
    } else {
        coreAvatar.style.display = 'none';
    }
}

function updateCoreStatus(status) {
    if (!coreAvatar || !coreStatus) return;
    
    // Reset all state classes
    coreAvatar.classList.remove('thinking', 'success', 'node-created');
    
    // Update text status
    coreStatus.textContent = status;
    
    // Add appropriate class based on status
    if (status === 'Thinking...') {
        coreAvatar.classList.add('thinking');
    } else if (status === 'Move found') {
        coreAvatar.classList.add('success');
    } else if (status === 'Node created!') {
        coreAvatar.classList.add('node-created');
    }
}

function updateCoreGameState(gameState) {
    if (!coreAvatar) return;
    
    switch(gameState) {
        case 'player-turn':
            updateCoreStatus('Waiting');
            break;
        case 'game-over-win':
            updateCoreStatus('Victory!');
            break;
        case 'game-over-loss':
            updateCoreStatus('Defeated');
            break;
        case 'game-over-draw':
            updateCoreStatus('Draw');
            break;
        default:
            updateCoreStatus('Waiting');
    }
}

// ==================== BOARD INITIALIZATION AND UPDATES ====================

function updateCellContent(cell, row, col, pieceData) {
    // Clear cell
    cell.innerHTML = '';
    
    if (pieceData) {
        // Create ion
        const ion = document.createElement('div');
        ion.className = `ion ${pieceData.color}-ion`;
        
        // Add protection level if needed
        if (pieceData.protectionLevel > 0) {
            ion.classList.add(`protection-${pieceData.protectionLevel}`);
        }
        
        cell.appendChild(ion);
    } else {
        // Show coordinates if no piece
        const cellContent = document.createElement('div');
        cellContent.className = 'cell-content';
        cellContent.textContent = String.fromCharCode(65 + col) + (BOARD_SIZE - row);
        cell.appendChild(cellContent);
    }
}

function initializeBoard() {
    // Create column labels (A-H)
    columnLabelsElement.innerHTML = '';
    for (let col = 0; col < BOARD_SIZE; col++) {
        const label = document.createElement('div');
        label.className = 'column-label';
        label.textContent = String.fromCharCode(65 + col);
        columnLabelsElement.appendChild(label);
    }
    
    // Create row labels (8-1)
    rowLabelsElement.innerHTML = '';
    for (let row = 0; row < BOARD_SIZE; row++) {
        const label = document.createElement('div');
        label.className = 'row-label';
        label.textContent = BOARD_SIZE - row;
        rowLabelsElement.appendChild(label);
    }
    
    // Create cells
    boardElement.innerHTML = '';
    
    // Create container for vector lines
    const lineContainer = document.createElement('div');
    lineContainer.className = 'vector-line-container';
    boardElement.appendChild(lineContainer);
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Update cell content using the helper function
            updateCellContent(cell, row, col, null);
            
            cell.addEventListener('click', () => handleCellClick(row, col));
            boardElement.appendChild(cell);
        }
    }

    // Set initial active player indicator ONLY if game is in progress
    if (state.gameStarted && !state.gameOver) {
        document.querySelector('.white-score').classList.add('active-player');
        document.querySelector('.black-score').classList.remove('active-player');
    } else {
        // Remove active player styling when not in active game
        document.querySelector('.white-score').classList.remove('active-player');
        document.querySelector('.black-score').classList.remove('active-player');
    }
}

function updateBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (!cell) continue;
            
            const pieceData = state.board[row][col];
            
            // Clear any previous highlights
            cell.classList.remove('last-move');
            
            // Highlight last move
            if (state.lastMove && state.lastMove.row === row && state.lastMove.col === col) {
                cell.classList.add('last-move');
            }
            
            // Update cell content using the helper function
            updateCellContent(cell, row, col, pieceData);
        }
    }
    
    // Ensure vector line container exists
    let lineContainer = boardElement.querySelector('.vector-line-container');
    if (!lineContainer) {
        lineContainer = document.createElement('div');
        lineContainer.className = 'vector-line-container';
        boardElement.appendChild(lineContainer);
    }
    
    // Update scores display
    updateScores();
}

function updateScores() {
    if (whiteScoreElement) whiteScoreElement.textContent = state.whiteScore;
    if (blackScoreElement) blackScoreElement.textContent = state.blackScore;
    
    // Emit score update for multiplayer if active
    if (window.multiplayer && typeof window.multiplayer.emitGameEvent === 'function' && 
        window.multiplayer.isMultiplayerActive()) {
        window.multiplayer.emitGameEvent('updateScore', {
            whiteScore: state.whiteScore,
            blackScore: state.blackScore
        });
    }
}

function placeIon(row, col, color, protectionLevel = 0) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    // Update state
    state.board[row][col] = {
        color: color,
        protectionLevel: protectionLevel
    };
    
    // Update cell appearance using the helper function
    updateCellContent(cell, row, col, state.board[row][col]);
}

// ==================== TIMER FUNCTIONS ====================

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

function updateTimerDisplay() {
    if (whiteTimerValueElement) whiteTimerValueElement.textContent = formatTime(timerState.whiteTime);
    if (blackTimerValueElement) blackTimerValueElement.textContent = formatTime(timerState.blackTime);
    
    // Highlight active timer
    if (whiteTimerElement) whiteTimerElement.classList.toggle('active', timerState.activeTimer === 'white');
    if (blackTimerElement) blackTimerElement.classList.toggle('active', timerState.activeTimer === 'black');
}

function startTimer() {
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
    }
    
    timerState.running = true;
    
    timerState.intervalId = setInterval(() => {
        if (state.gameOver) {
            clearInterval(timerState.intervalId);
            return;
        }
        
        if (timerState.activeTimer === 'white') {
            timerState.whiteTime--;
            if (timerState.whiteTime <= 0) {
                timerState.whiteTime = 0;
                clearInterval(timerState.intervalId);
                timeOut('white');
            }
        } else {
            timerState.blackTime--;
            if (timerState.blackTime <= 0) {
                timerState.blackTime = 0;
                clearInterval(timerState.intervalId);
                timeOut('black');
            }
        }
        
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    timerState.running = false;
    clearInterval(timerState.intervalId);
}

function switchTimer() {
    if (!timerState.enabled) return;
    
    // Add increment to the player who just moved
    if (timerState.increment > 0) {
        if (timerState.activeTimer === 'white') {
            timerState.whiteTime += timerState.increment;
        } else {
            timerState.blackTime += timerState.increment;
        }
    }
    
    // Switch active timer
    timerState.activeTimer = timerState.activeTimer === 'white' ? 'black' : 'white';
    
    // Update display
    updateTimerDisplay();
    
    // Ensure timer is running
    if (timerState.enabled && !timerState.running) {
        startTimer();
    }
}

function timeOut(player) {
    state.gameOver = true;
    const loser = player.charAt(0).toUpperCase() + player.slice(1);
    const winner = player === 'white' ? 'Black' : 'White';
    
    // Show message
    addSystemMessage(`${loser}'s time has run out. ${winner} wins!`);
    
    // Show banner
    if (gameOverBanner) {
        gameOverBanner.textContent = `Game Over: ${loser}'s time has run out. ${winner} wins!`;
        gameOverBanner.style.display = 'block';
    }
    
    // Show review controls
    enableReviewMode();
    
    // Update CORE status if black won
    if (winner === 'Black') {
        updateCoreGameState('game-over-win');
    } else {
        updateCoreGameState('game-over-loss');
    }
}

function setupTimers() {
    if (!useTimerCheckbox) return;
    
    timerState.enabled = useTimerCheckbox.checked;
    
    if (timerState.enabled) {
        // Get base time in minutes and convert to seconds
        const baseTimeMinutes = parseInt(baseTimeSelect.value);
        timerState.whiteTime = baseTimeMinutes * 60;
        timerState.blackTime = baseTimeMinutes * 60;
        
        // Get increment in seconds
        timerState.increment = parseInt(incrementSelect.value);
        
        // Show timers using CSS class
        document.body.classList.add('timer-active');
        
        // Set initial display
        updateTimerDisplay();
        
        // Start white's timer (or black's if player chose black)
        timerState.activeTimer = state.currentPlayer;
        startTimer();
    }
}

// ==================== VECTOR VISUALIZATION FUNCTIONS ====================

function createVectorLine(positions, direction) {
    // Clear any existing lines
    let lineContainer = document.querySelector('.vector-line-container');
    if (lineContainer) {
        lineContainer.innerHTML = '';
    } else {
        lineContainer = document.createElement('div');
        lineContainer.className = 'vector-line-container';
        const board = document.querySelector('.board');
        if (board) board.appendChild(lineContainer);
    }
    
    // Sort positions to ensure we have the right order
    let sortedPositions = [];
    
    switch(direction) {
        case 'horizontal':
            // Sort left to right
            sortedPositions = [...positions].sort((a, b) => a.col - b.col);
            break;
        case 'vertical':
            // Sort top to bottom
            sortedPositions = [...positions].sort((a, b) => a.row - b.row);
            break;
        case 'diagonal-right':
            // Sort top-left to bottom-right
            sortedPositions = [...positions].sort((a, b) => {
                if (a.row === b.row) return a.col - b.col;
                return a.row - b.row;
            });
            break;
        case 'diagonal-left':
            // Sort top-right to bottom-left
            sortedPositions = [...positions].sort((a, b) => {
                if (a.row === b.row) return b.col - a.col;
                return a.row - b.row;
            });
            break;
    }
    
    // Filter out positions that aren't part of the vector (we only want exactly 4)
    // Vector positions should be consecutive in the sorted order
    if (sortedPositions.length > 4) {
        // If somehow we have more than 4, take the first 4
        sortedPositions = sortedPositions.slice(0, 4);
    }
    
    // Verify we have exactly 4 positions for the vector
    if (sortedPositions.length !== 4) {
        console.error("Vector doesn't have exactly 4 positions:", sortedPositions);
        return null;
    }
    
    // Create individual line segments between consecutive cells
    for (let i = 0; i < sortedPositions.length - 1; i++) {
        const pos1 = sortedPositions[i];
        const pos2 = sortedPositions[i + 1];
        
        // Get the cells
        const cell1 = document.querySelector(`.cell[data-row="${pos1.row}"][data-col="${pos1.col}"]`);
        const cell2 = document.querySelector(`.cell[data-row="${pos2.row}"][data-col="${pos2.col}"]`);
        
        if (!cell1 || !cell2) continue;
        
        // Create line segment
        createLineSegment(cell1, cell2, lineContainer, direction);
    }
    
    return lineContainer;
}

function createLineSegment(cell1, cell2, container, direction) {
    const cell1Rect = cell1.getBoundingClientRect();
    const cell2Rect = cell2.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    const line = document.createElement('div');
    line.className = `vector-line ${direction}`;
    
    // Calculate positions relative to the container
    const x1 = cell1Rect.left + (cell1Rect.width / 2) - containerRect.left;
    const y1 = cell1Rect.top + (cell1Rect.height / 2) - containerRect.top;
    const x2 = cell2Rect.left + (cell2Rect.width / 2) - containerRect.left;
    const y2 = cell2Rect.top + (cell2Rect.height / 2) - containerRect.top;
    
    // Calculate length and angle
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    // Set line properties
    line.style.width = `${length}px`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `rotate(${angle}deg)`;
    line.style.transformOrigin = 'left center';
    
    // Add the line to the container
    container.appendChild(line);
    
    return line;
}

function visualizeVector(positions, callback) {
    if (positions.length < 4) {
        console.warn("Vector doesn't have the right number of positions:", positions);
        if (callback) callback();
        return;
    }
    
    // Explicitly ensure we have exactly 4 positions
    const vectorPositions = positions.slice(0, 4);
    
    // Determine direction
    let direction;
    
    // Check if all positions are in the same row
    if (vectorPositions.every(p => p.row === vectorPositions[0].row)) {
        direction = 'horizontal';
    } 
    // Check if all positions are in the same column
    else if (vectorPositions.every(p => p.col === vectorPositions[0].col)) {
        direction = 'vertical';
    }
    // Check if it's a diagonal
    else {
        // Sort by row
        const sorted = [...vectorPositions].sort((a, b) => a.row - b.row);
        
        // If columns increase as rows increase, it's diagonal-right
        if (sorted[0].col < sorted[sorted.length-1].col) {
            direction = 'diagonal-right';
        } else {
            direction = 'diagonal-left';
        }
    }
    
    // Create line
    const lineContainer = createVectorLine(vectorPositions, direction);
    if (!lineContainer) {
        if (callback) callback();
        return;
    }
    
    // Show line and mark pieces to fade simultaneously
   for (const pos of positions) {
    if (pos.shouldRemove) {
        const cell = document.querySelector(`.cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            const ion = cell.querySelector('.ion');
            if (ion) {
                ion.classList.add('fading');
            }
        }
    }
}

// After 1 second (fade duration), remove pieces and fade the line
setTimeout(() => {
    // Remove faded pieces from state
    for (const pos of positions) {
        if (pos.shouldRemove) {
            state.board[pos.row][pos.col] = null;
        }
    }
    
    // Update the board (which will remove the faded ions)
    updateBoard();
    
    // Fade out all lines in the container
    const lines = lineContainer.querySelectorAll('.vector-line');
    lines.forEach(line => {
        line.classList.add('fading');
    });
    
    // Remove lines after fade finishes and run callback
    setTimeout(() => {
        if (lineContainer && lineContainer.parentNode) {
            lineContainer.parentNode.removeChild(lineContainer);
        }
        if (callback) callback();
    }, 1000); // Line fade duration
    
}, 1000); // Piece fade duration
}

function processVectorsSequentially(vectors, nodeRow, nodeCol, totalVectors, callback) {
if (vectors.length === 0) {
    if (callback) callback();
    return;
}

// Process the first vector with animations
const vector = vectors[0];
visualizeVector(vector.positions, () => {
    // After this vector's animations, process the next one
    processVectorsSequentially(vectors.slice(1), nodeRow, nodeCol, totalVectors, () => {
        // After all vectors are processed, pulse the node
        pulseNode(nodeRow, nodeCol, totalVectors);
        
        // Pulse the score - determine correct player from board state
        const nodeCell = state.board[nodeRow][nodeCol];
        if (nodeCell && nodeCell.color) {
            pulseScore(nodeCell.color);
        }
        
        // Then call the callback
        if (callback) callback();
    });
});
}

function pulseNode(row, col, count = 1) {
const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
if (!cell) return;

const ion = cell.querySelector('.ion');
if (!ion) return;

// Function to do a single pulse
const doPulse = (remaining) => {
    // Remove existing class to restart animation
    ion.classList.remove('node-pulse');
    
    // Force browser to acknowledge the removal
    void ion.offsetWidth;
    
    // Add class again to trigger animation
    ion.classList.add('node-pulse');
    
    // If more pulses remain, queue the next one
    if (remaining > 1) {
        setTimeout(() => doPulse(remaining - 1), 600); // Slightly longer interval for more dramatic effect
    }
};

// Start the pulsing
doPulse(count);
}

function pulseScore(player) {
const scoreElement = player === 'white' ? 
    document.querySelector('.white-score') : 
    document.querySelector('.black-score');

if (!scoreElement) return;

// Remove existing class to restart animation
scoreElement.classList.remove('pulse');

// Force browser to acknowledge the removal
void scoreElement.offsetWidth;

// Add class again to trigger animation
scoreElement.classList.add('pulse');
}

// ==================== GAME LOGIC FUNCTIONS ====================

function handleCellClick(row, col) {
try {
    // Check if this is an online multiplayer game
    const isMultiplayerActive = window.multiplayer && typeof window.multiplayer.isMultiplayerActive === 'function' && 
        window.multiplayer.isMultiplayerActive();
    
    if (isMultiplayerActive) {
        // In multiplayer, ONLY send the move to the server and let it handle the rest
        // The server will update both clients with the new game state
        if (window.multiplayer && typeof window.multiplayer.makeMove === 'function') {
            window.multiplayer.makeMove(row, col);
        }
        // Important: Return early - don't process the move locally in multiplayer mode
        return;
    }
    
    // If in review mode, ignore clicks on the board
    if (state.reviewMode) {
        showNotification("You are in review mode. Use the review controls to navigate the game.");
        return;
    }
    
    // Check if game is not started yet
    if (!state.gameStarted) {
        showNotification("Please click 'Start Game' to begin playing.");
        return;
    }
    
    // Check if game is over
    if (state.gameOver) {
        showNotification("Game is over. Please reset to play again.");
        return;
    }
    
    // Check if cell is already occupied
    if (state.board[row][col] !== null) {
        showNotification("This cell is already occupied!");
        return;
    }
    
    // Check if move would create line longer than 4
    if (wouldCreateLineTooLong(row, col, state.currentPlayer)) {
        showNotification(`Cannot place here - would create a line longer than ${LINE_LENGTH} ions!`);
        return;
    }
    
    // Before making the move, save current board state to history
    saveCurrentStateToHistory();
    
    // Place ion
    placeIon(row, col, state.currentPlayer);
    
    // Update last move
    state.lastMove = { row, col };
    
    // Increment move counter
    state.moveCount++;
    
    // Get position label
    const positionLabel = String.fromCharCode(65 + col) + (BOARD_SIZE - row);
    
    // Store the current player to use throughout this move
    const currentPlayer = state.currentPlayer;
    
    // Check for Vectors
    const linesInfo = checkForLines(row, col, currentPlayer);
    
    if (linesInfo.linesFormed > 0) {
        // Update the protection level of the placed piece
        state.board[row][col].protectionLevel = linesInfo.linesFormed;
        
        // Update score - add protection level to player's score
        if (currentPlayer === 'white') {
            state.whiteScore += linesInfo.linesFormed;
        } else {
            state.blackScore += linesInfo.linesFormed;
        }
        
        // Add to game log with N notation
        const nodeLabel = linesInfo.linesFormed > 1 ? 
            `${positionLabel}<span class="node-marker">N</span>${linesInfo.linesFormed}` : 
            `${positionLabel}<span class="node-marker">N</span>`;
                
        addGameLogEntry(nodeLabel);
        
        // Switch players BEFORE animations start
        // This ensures the next player is set correctly
        switchToNextPlayer();
        
        // Process the vectors sequentially with animations
        processVectorsSequentially(linesInfo.vectors, row, col, linesInfo.linesFormed, () => {
            // After all animations complete, check for Nexus
            const nexusResult = checkForNexus();
            if (nexusResult) {
                endGameWithNexus(nexusResult);
                return;
            }
            
            // Check if no legal moves left
            if (!hasLegalMoves()) {
                endGameByNodeCount();
            }
        });
    } else {
        // Just add the position to the game log
        addGameLogEntry(positionLabel);
        
        // Switch players immediately since there are no animations
        switchToNextPlayer();
        
        // Check if no legal moves left
        if (!hasLegalMoves()) {
            endGameByNodeCount();
        }
    }
} catch (error) {
    console.error("Error handling cell click:", error);
    showNotification("An error occurred. Please try again.");
}
}

function switchToNextPlayer() {
// Switch players
state.currentPlayer = state.currentPlayer === 'white' ? 'black' : 'white';

// Switch timer if enabled
if (timerState.enabled) {
    switchTimer();
}

// Update the board (including scores)
updateBoard();

// If it's now the player's turn, update CORE to waiting
if (state.currentPlayer === 'white') {
    updateCoreGameState('player-turn');
}

// Remove active player class from both scores
document.querySelector('.white-score').classList.remove('active-player');
document.querySelector('.black-score').classList.remove('active-player');

// Add active player class to current player's score
const activeScoreClass = state.currentPlayer === 'white' ? '.white-score' : '.black-score';
document.querySelector(activeScoreClass).classList.add('active-player');

// Emit event for multiplayer if active
if (window.multiplayer && typeof window.multiplayer.emitGameEvent === 'function' && 
    window.multiplayer.isMultiplayerActive()) {
    window.multiplayer.emitGameEvent('switchPlayer', {});
}
}

function wouldCreateLineTooLong(row, col, color, boardParam) {
// Determine if we're using the AI version or player version
const board = boardParam || state.board;

// Handle invalid inputs
if (!board || typeof row !== 'number' || typeof col !== 'number' || !color) {
    console.error("Invalid parameters for wouldCreateLineTooLong:", row, col, color);
    return true; // Assume invalid move
}

// Make sure row and col are valid
if (row < 0 || row >= 8 || col < 0 || col >= 8) {
    return true; // Invalid position
}

// Temporarily place the ion
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
    let count = 1;  // Start with the placed ion

    // Count in positive direction
    for (let i = 1; i < 8; i++) {
        const r = row + i * dr;
        const c = col + i * dc;

        if (r >= 0 && r < 8 && c >= 0 && c < 8 && 
            board[r][c] && board[r][c].color === color) {
            count++;
        } else {
            break;
        }
    }

    // Count in negative direction
    for (let i = 1; i < 8; i++) {
        const r = row - i * dr;
        const c = col - i * dc;

        if (r >= 0 && r < 8 && c >= 0 && c < 8 && 
            board[r][c] && board[r][c].color === color) {
            count++;
        } else {
            break;
        }
    }

    if (count > 4) {
        tooLong = true;
        break;
    }
}

// Restore the original value
board[row][col] = originalValue;

return tooLong;
}

function checkForLines(row, col, color) {
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
            state.board[r][c] && state.board[r][c].color === color) {
            count++;
            // Check if this piece is already a node (has protection level)
            const isNode = state.board[r][c].protectionLevel > 0;
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
            state.board[r][c] && state.board[r][c].color === color) {
            count++;
            // Check if this piece is already a node (has protection level)
            const isNode = state.board[r][c].protectionLevel > 0;
            linePositions.push({row: r, col: c, shouldRemove: !isNode});
        } else {
            break;
        }
    }
    
    // If we have a line of exactly 4
    if (count === LINE_LENGTH) {
        linesFormed++;
        
        // Store vector information for visualization
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

function checkForNexus(providedBoard) {
// Use the provided board or fall back to state.board
const board = providedBoard || state.board;

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
                state.gameOver = true; // Stop the game immediately
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

function endGameWithNexus(result) {
state.gameOver = true;
state.nexusPositions = result.positions;
state.finalBoardState = JSON.parse(JSON.stringify(state.board));

// Emit game over for multiplayer if active
if (window.multiplayer && typeof window.multiplayer.emitGameEvent === 'function' && 
    window.multiplayer.isMultiplayerActive()) {
    window.multiplayer.emitGameEvent('gameOver', {
        winner: result.winner,
        type: 'nexus'
    });
}

// Immediately disable all board click events to prevent further moves
document.querySelectorAll('.cell').forEach(cell => {
    // Clone and replace to remove all event listeners
    const newCell = cell.cloneNode(true);
    cell.parentNode.replaceChild(newCell, cell);
});

// Stop timer if enabled
if (timerState.enabled && timerState.running) {
    pauseTimer();
}

// Highlight the winning line
for (const pos of result.positions) {
    const cell = document.querySelector(`.cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
    if (cell) {
        cell.classList.add('winning-line');
    }
}

// Show message only if not already shown
const winner = result.winner.charAt(0).toUpperCase() + result.winner.slice(1);
const nexusMessage = `${winner} achieves a Nexus!`;

// Check if this message already exists in the game log
const messageExists = Array.from(document.querySelectorAll('.message-entry'))
    .some(entry => entry.textContent === nexusMessage);

// Only add the message if it doesn't already exist
if (!messageExists) {
    addSystemMessage(nexusMessage);
}

// Show banner
if (gameOverBanner) {
    gameOverBanner.textContent = `Game Over: ${winner} wins with a Nexus!`;
    gameOverBanner.style.display = 'block';
}

// Remove active player indicators at game end
document.querySelector('.white-score').classList.remove('active-player');
document.querySelector('.black-score').classList.remove('active-player');
        
// Show review controls
enableReviewMode();

// Update CORE's status based on the winner
if (result.winner === 'black') {
    updateCoreGameState('game-over-win');
} else {
    updateCoreGameState('game-over-loss');
}
}

function endGameByNodeCount() {
state.gameOver = true;

// Stop timer if enabled
if (timerState.enabled && timerState.running) {
    pauseTimer();
}

// Count nodes
let whiteNodes = 0;
let blackNodes = 0;

for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = state.board[row][col];
        if (piece && piece.protectionLevel > 0) {
            if (piece.color === 'white') {
                whiteNodes++;
            } else {
                blackNodes++;
            }
        }
    }
}

// Determine winner
let message;
let winner = null;

if (whiteNodes > blackNodes) {
    winner = 'white';
    message = `Game Over! White wins with ${whiteNodes} Nodes vs ${blackNodes}`;
    updateCoreGameState('game-over-loss');
} else if (blackNodes > whiteNodes) {
    winner = 'black';
    message = `Game Over! Black wins with ${blackNodes} Nodes vs ${whiteNodes}`;
    updateCoreGameState('game-over-win');
} else {
    winner = 'draw';
    message = `Game Over! It's a draw! Both players have ${whiteNodes} Nodes`;
    updateCoreGameState('game-over-draw');
}

// Emit game over for multiplayer if active
if (window.multiplayer && typeof window.multiplayer.emitGameEvent === 'function' && 
    window.multiplayer.isMultiplayerActive()) {
    window.multiplayer.emitGameEvent('gameOver', {
        winner: winner,
        type: 'nodeCount',
        whiteScore: whiteNodes,
        blackScore: blackNodes
    });
}

// Show message
addSystemMessage(message);

// Show banner
if (gameOverBanner) {
    gameOverBanner.textContent = message;
    gameOverBanner.style.display = 'block';
}

// Show review controls
enableReviewMode();
}

function hasLegalMoves() {
for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
        // If cell is empty and placing a piece of the current player's color
        // would not create a line longer than 4, it's a legal move
        if (state.board[row][col] === null && 
            !wouldCreateLineTooLong(row, col, state.currentPlayer)) {
            return true;
        }
    }
}
return false;
}

function saveCurrentStateToHistory() {
// Clone the current board state
const boardClone = state.board.map(row => 
    row.map(cell => cell === null ? null : { ...cell })
);

// Save relevant game state
state.moveHistory.push({
    board: boardClone,
    currentPlayer: state.currentPlayer,
    whiteScore: state.whiteScore,
    blackScore: state.blackScore,
    moveCount: state.moveCount,
    lastMove: state.lastMove ? { ...state.lastMove } : null
});
}

// ==================== UI HELPER FUNCTIONS ====================

function addGameLogEntry(position) {
if (!messagesContentElement) return;

const moveNumber = Math.ceil(state.moveCount / 2);
const isWhiteTurn = (state.moveCount % 2 === 1);

// Find or create row for this move number
let moveRow = document.querySelector(`.message-entry[data-move="${moveNumber}"]`);

if (!moveRow) {
    moveRow = document.createElement('div');
    moveRow.className = 'message-entry';
    moveRow.dataset.move = moveNumber;
    moveRow.dataset.moveCount = state.moveCount;
    
    // Add move number
    const numberSpan = document.createElement('span');
    numberSpan.className = 'message-number';
    numberSpan.textContent = moveNumber + '.';
    moveRow.appendChild(numberSpan);
    
    // Add placeholder for white and black moves
    const whiteSpan = document.createElement('span');
    whiteSpan.className = 'message-position white-move';
    moveRow.appendChild(whiteSpan);
    
    const blackSpan = document.createElement('span');
    blackSpan.className = 'message-position black-move';
    moveRow.appendChild(blackSpan);
    
    messagesContentElement.appendChild(moveRow);
    
    // Add click event for review mode
    moveRow.addEventListener('click', function() {
        if (state.reviewMode && state.gameOver) {
            const moveCount = parseInt(this.dataset.moveCount);
            goToMove(moveCount);
        }
    });
}

// Update white or black move
if (isWhiteTurn) {
    moveRow.querySelector('.white-move').innerHTML = position;
} else {
    moveRow.querySelector('.black-move').innerHTML = position;
}

// Scroll to bottom
if (messagesContentElement.parentElement) {
    messagesContentElement.parentElement.scrollTop = messagesContentElement.parentElement.scrollHeight;
}

// Emit board update for multiplayer if active
if (window.multiplayer && typeof window.multiplayer.emitGameEvent === 'function' && 
    window.multiplayer.isMultiplayerActive()) {
    window.multiplayer.emitGameEvent('updateBoard', { board: state.board });
}
}

function addSystemMessage(message) {
if (!messagesContentElement) return;

const messageElement = document.createElement('div');
messageElement.className = 'message-entry';
messageElement.textContent = message;
messagesContentElement.appendChild(messageElement);

if (messagesContentElement.parentElement) {
    messagesContentElement.parentElement.scrollTop = messagesContentElement.parentElement.scrollHeight;
}
}

function showNotification(message, duration = 3000) {
if (!notificationElement) return;

notificationElement.textContent = message;
notificationElement.style.visibility = 'visible';
notificationElement.style.opacity = '1';
notificationElement.style.pointerEvents = 'auto';

setTimeout(() => {
    notificationElement.style.visibility = 'hidden';
    notificationElement.style.opacity = '0';
    notificationElement.style.pointerEvents = 'none';
}, duration);
}

// ==================== GAME CONTROL FUNCTIONS ====================

function terminateGame() {
if (state.gameOver) {
    showNotification("The game is already over.");
    return;
}

state.gameOver = true;

// Stop timer if enabled
if (timerState.enabled && timerState.running) {
    pauseTimer();
}

// Check if this is a multiplayer game
const isMultiplayerActive = window.multiplayer && typeof window.multiplayer.isMultiplayerActive === 'function' && 
    window.multiplayer.isMultiplayerActive();

if (isMultiplayerActive) {
    // For multiplayer, call the terminateGame function
    if (window.multiplayer && typeof window.multiplayer.terminateGame === 'function') {
        window.multiplayer.terminateGame();
        return; // Let the server handle the rest
    }
}

const terminatingPlayer = state.currentPlayer;
const winner = terminatingPlayer === 'white' ? 'Black' : 'White';

// Show message
addSystemMessage(`${terminatingPlayer.charAt(0).toUpperCase() + terminatingPlayer.slice(1)} terminates. ${winner} wins!`);

// Show banner
if (gameOverBanner) {
    gameOverBanner.textContent = `Game Over: ${terminatingPlayer.charAt(0).toUpperCase() + terminatingPlayer.slice(1)} terminates. ${winner} wins!`;
    gameOverBanner.style.display = 'block';
}

// Show review controls
enableReviewMode();

// Update CORE status if white terminated (black wins)
if (terminatingPlayer === 'white') {
    updateCoreGameState('game-over-win');
} else {
    updateCoreGameState('game-over-loss');
}
}

function resetGame() {
// Check if this is a multiplayer game
const isMultiplayerActive = window.multiplayer && typeof window.multiplayer.isMultiplayerActive === 'function' && 
    window.multiplayer.isMultiplayerActive();

if (isMultiplayerActive) {
    // Notify the server that this player is leaving the game
    if (window.multiplayer && typeof window.multiplayer.leaveGame === 'function') {
        window.multiplayer.leaveGame();
    }
    
    // For multiplayer, show the home screen instead of just resetting
    if (window.multiplayer && typeof window.multiplayer.showHomeScreen === 'function') {
        window.multiplayer.showHomeScreen();
    }
}

// Reset state
state.currentPlayer = 'white';
state.board = Array(8).fill().map(() => Array(8).fill(null));
state.whiteScore = 0;
state.blackScore = 0;
state.gameOver = false;
state.lastMove = null;
state.moveCount = 0;
state.gameStarted = false;
state.reviewMode = false;
state.moveHistory = [];
state.currentReviewMove = 0;
state.nexusPositions = null;
state.finalBoardState = null;
state.pendingAIMove = false;

// Also remove the 'winning-line' class from any cells
document.querySelectorAll('.winning-line').forEach(cell => {
    cell.classList.remove('winning-line');
});

// Re-add event listeners to all cells (they were removed when the nexus was detected)
document.querySelectorAll('.cell').forEach((cell, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    // Remove existing cell to clear any listeners
    const newCell = cell.cloneNode(true);
    // Add back the click handler
    newCell.addEventListener('click', () => handleCellClick(row, col));
    cell.parentNode.replaceChild(newCell, cell);
});

// Hide timers
document.body.classList.remove('timer-active');
    
// Reset timer state
if (baseTimeSelect) {
    timerState.whiteTime = parseInt(baseTimeSelect.value) * 60;
    timerState.blackTime = parseInt(baseTimeSelect.value) * 60;
}
timerState.activeTimer = 'white';
timerState.running = false;

if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
}

// Update UI
if (whiteScoreElement) whiteScoreElement.textContent = '0';
if (blackScoreElement) blackScoreElement.textContent = '0';

// Clear game log
if (messagesContentElement) messagesContentElement.innerHTML = '';

// Hide game over banner
if (gameOverBanner) gameOverBanner.style.display = 'none';

// Hide review controls
if (reviewControlsElement) {
    reviewControlsElement.style.visibility = 'hidden';
    reviewControlsElement.style.opacity = '0';
    reviewControlsElement.style.pointerEvents = 'none';
    
    // Show timer setup again
    if (timerSetupElement) timerSetupElement.style.display = 'flex';
    
    // Reset board
    updateBoard();
    
    // Remove highlights
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('winning-line', 'last-move');
    });
    
    // Remove selected move highlighting
    document.querySelectorAll('.message-entry.selected-move').forEach(entry => {
        entry.classList.remove('selected-move');
    });
    
    // Update timer display
    updateTimerDisplay();
    
    // Reset CORE's status
    if (coreAvatar) {
        updateCoreStatus('Standby');
    }
    
    // Update CORE visibility based on game mode
    if (gameModeSelect) {
        // Initial update based on selected mode
        updateCoreVisibility(gameModeSelect.value);
        updateAIDifficultyVisibility(gameModeSelect.value);
        updateGameModeClass(gameModeSelect.value);
    }
    document.body.classList.remove('game-started');
}
}

// ==================== REVIEW MODE FUNCTIONS ====================

function enableReviewMode() {
state.reviewMode = true;
if (reviewControlsElement) reviewControlsElement.style.display = 'block';

// Set the current review move to the end of the game
state.currentReviewMove = state.moveHistory.length;
updateReviewMoveCounter();

// Add click events to all move entries
document.querySelectorAll('.message-entry[data-move]').forEach(entry => {
    entry.style.cursor = 'pointer';
});

// Highlight the current position (end of game)
highlightCurrentMove();

// Add play again button for multiplayer games
const isMultiplayerActive = window.multiplayer && typeof window.multiplayer.isMultiplayerActive === 'function' && 
    window.multiplayer.isMultiplayerActive();

if (isMultiplayerActive) {
    // Check if play again button already exists
    let playAgainButton = document.getElementById('play-again-btn');
    
    if (!playAgainButton) {
        // Create play again button
        playAgainButton = document.createElement('button');
        playAgainButton.id = 'play-again-btn';
        playAgainButton.textContent = 'Play Again';
        playAgainButton.style.backgroundColor = '#27ae60';
        playAgainButton.style.marginTop = '10px';
        
        // Add click event
        playAgainButton.addEventListener('click', function() {
            if (window.multiplayer && typeof window.multiplayer.playAgain === 'function') {
                window.multiplayer.playAgain();
            }
        });
        
        // Add to review controls
        if (reviewControlsElement) {
            reviewControlsElement.appendChild(playAgainButton);
        }
    } else {
        // If button exists, just show it
        playAgainButton.style.display = 'block';
    }
}
}

function goToMove(moveNumber) {
// Clear any nexus highlights first
document.querySelectorAll('.winning-line').forEach(cell => {
    cell.classList.remove('winning-line');
});

if (moveNumber === 0) {
    // Go to start (empty board)
    restoreEmptyBoard();
} else if (moveNumber === state.moveCount && state.finalBoardState && state.nexusPositions) {
    // Special handling for final move with nexus
    // Restore from our saved final state instead of history
    state.board = JSON.parse(JSON.stringify(state.finalBoardState));
    
    // Restore player and score information
    if (state.moveHistory.length > 0) {
        const lastHistoryState = state.moveHistory[state.moveHistory.length - 1];
        state.currentPlayer = lastHistoryState.currentPlayer;
        state.whiteScore = lastHistoryState.whiteScore;
        state.blackScore = lastHistoryState.blackScore;
        state.lastMove = lastHistoryState.lastMove ? {...lastHistoryState.lastMove} : null;
    }
    
    // Update the visual display
    updateBoard();
    
    // Add highlights after ensuring board is updated
    setTimeout(() => {
        for (const pos of state.nexusPositions) {
            const cell = document.querySelector(`.cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cell) {
                cell.classList.add('winning-line');
            }
        }
    }, 50);
} else {
    // Find the history entry for this move
    let targetIndex = 0;
    for (let i = 0; i < state.moveHistory.length; i++) {
        if (state.moveHistory[i].moveCount >= moveNumber) {
            targetIndex = i;
            break;
        }
    }
    
    // Restore the state from history
    restoreState(targetIndex);
}

state.currentReviewMove = moveNumber;
updateReviewMoveCounter();
highlightCurrentMove();
}

function goToFirstMove() {
goToMove(0);
}

function goToPreviousMove() {
if (state.currentReviewMove > 0) {
    goToMove(state.currentReviewMove - 1);
}
}

function goToNextMove() {
if (state.currentReviewMove < state.moveCount) {
    goToMove(state.currentReviewMove + 1);
}
}

function goToLastMove() {
goToMove(state.moveCount);
}

function restoreEmptyBoard() {
// Clear the board
state.board = Array(8).fill().map(() => Array(8).fill(null));
state.whiteScore = 0;
state.blackScore = 0;
state.currentPlayer = 'white';
state.lastMove = null;

// Update UI
updateBoard();
if (whiteScoreElement) whiteScoreElement.textContent = '0';
if (blackScoreElement) blackScoreElement.textContent = '0';

// Clear any highlights
document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('last-move');
});
}

function restoreState(historyIndex) {
const historyState = state.moveHistory[historyIndex];

// Restore board state
state.board = historyState.board.map(row => 
    row.map(cell => cell === null ? null : { ...cell })
);

// Restore other state properties
state.whiteScore = historyState.whiteScore;
state.blackScore = historyState.blackScore;
state.currentPlayer = historyState.currentPlayer;
state.lastMove = historyState.lastMove ? { ...historyState.lastMove } : null;

// Update UI
updateBoard();
if (whiteScoreElement) whiteScoreElement.textContent = state.whiteScore;
if (blackScoreElement) blackScoreElement.textContent = state.blackScore;
}

function updateReviewMoveCounter() {
if (reviewMoveCounter) reviewMoveCounter.textContent = state.currentReviewMove;
}

function highlightCurrentMove() {
// Remove highlight from all moves
document.querySelectorAll('.message-entry.selected-move').forEach(entry => {
    entry.classList.remove('selected-move');
});

// Add highlight to current move
const moveNumber = Math.ceil(state.currentReviewMove / 2);
const moveEntry = document.querySelector(`.message-entry[data-move="${moveNumber}"]`);

if (moveEntry) {
    moveEntry.classList.add('selected-move');
    
    // Scroll to the highlighted move
    const container = messagesContentElement ? messagesContentElement.parentElement : null;
    if (container) {
        const scrollOffset = moveEntry.offsetTop - container.offsetTop - (container.clientHeight / 2);
        container.scrollTop = scrollOffset;
    }
}
}

// ==================== AI FUNCTIONS ====================

function getLegalMoves(board, player) {
const legalMoves = [];
for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
        if (board[row][col] === null && !wouldCreateLineTooLong(row, col, player, board)) {
            legalMoves.push({ row, col });
        }
    }
}
return legalMoves;
}

function gameLoop() {
if (state.gameOver || !state.gameStarted || isAIMakingMove) return;

const gameMode = document.getElementById('game-mode').value;

// Only continue if in AI mode
if (gameMode !== 'ai') return;

// Get selected player color
const playerIsWhite = playWhiteRadio && playWhiteRadio.checked;

// AI's color is opposite of player's color
const aiColor = playerIsWhite ? 'black' : 'white';

// Only run AI logic if it's the AI's turn
if (state.currentPlayer === aiColor) {
    isAIMakingMove = true; // Prevent multiple AI moves from being queued
    const difficulty = parseInt(document.getElementById('ai-difficulty').value);

    // Add a small initial delay to ensure previous animations have completed
    setTimeout(() => {
        // Update CORE's status to thinking
        updateCoreStatus('Thinking...');

        // Generate a random delay between 3-5 seconds
        const thinkingDelay = 3000 + Math.floor(Math.random() * 2000);
        
        // First, use a timeout to simulate "thinking" time
        setTimeout(() => {
            try {
                // Add a timeout for AI thinking to prevent hanging
                const moveTimeout = setTimeout(() => {
                    console.log("AI move timeout - using fallback move");
                    // Fallback to a simple random move
                    try {
                        const legalMoves = getLegalMoves(state.board, aiColor);
                        if (legalMoves.length > 0) {
                            const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                            handleCellClick(randomMove.row, randomMove.col);
                        }
                    } catch (err) {
                        console.error("Error finding legal moves:", err);
                    }
                    isAIMakingMove = false;
                }, 8000); // 8 second max for AI to think

                let move = null;
                try {
                    move = getAIMove(state.board, aiColor, difficulty);
                    
                    // Clear the timeout since we got a move
                    clearTimeout(moveTimeout);
                } catch (aiError) {
                    console.error("Error in getAIMove:", aiError);
                    clearTimeout(moveTimeout);
                }

                if (move) {
                    // Show "move found" status briefly
                    updateCoreStatus('Move found');
                    
                    setTimeout(() => {
                        try {
                            // Check if this move will create a node
                            const willCreateNode = willMoveCreateNode(move.row, move.col, aiColor);
                            
                            // Make the move only if the current player is still the AI's color
                            if (state.currentPlayer === aiColor) {
                                handleCellClick(move.row, move.col);
                                
                                // If node was created, show special status
                                if (willCreateNode) {
                                    setTimeout(() => {
                                        updateCoreStatus('Node created!');
                                        setTimeout(() => {
                                            updateCoreStatus('Waiting');
                                        }, 1500);
                                    }, 500);
                                } else {
                                    // Reset to waiting status after the move
                                    setTimeout(() => {
                                        updateCoreStatus('Waiting');
                                    }, 1000);
                                }
                            } else {
                                // If it's not the AI's turn anymore, just reset CORE's status
                                updateCoreStatus('Waiting');
                            }
                        } catch (nodeError) {
                            console.error("Error checking node creation:", nodeError);
                            updateCoreStatus('Waiting');
                        }
                    }, 800); // Short delay to show "move found" status
                } else {
                    console.log("No valid move found for AI");
                    if (!state.gameOver) {
                        // If no valid moves and game isn't over, might need to handle special case
                        try {
                            endGameByNodeCount();
                        } catch (endGameError) {
                            console.error("Error ending game:", endGameError);
                        }
                    }
                    updateCoreStatus('Waiting');
                }
            } catch (error) {
                console.error("Error in AI move:", error);
                isAIMakingMove = false;
            }
            
            isAIMakingMove = false; // Allow the AI to make another move later
        }, thinkingDelay); // Random thinking delay
    }, 500); // Initial delay to ensure animations complete
}
}

function willMoveCreateNode(row, col, color) {
// Temporarily place a piece
const originalValue = state.board[row][col];
state.board[row][col] = { color: color, protectionLevel: 0 };

// Check for lines
const linesInfo = checkForLines(row, col, color);

// Restore original state
state.board[row][col] = originalValue;

return linesInfo.linesFormed > 0;
}

function syncCoreAvatars() {
const mainCore = document.getElementById('core-avatar');

// Just check if main core exists
if (!mainCore) return;

// Set up an observer to handle any changes
const observer = new MutationObserver(() => {
    // Empty callback - just keeping the observer for future functionality
});

// Start observing the main CORE avatar
observer.observe(mainCore, {
    attributes: true,
    childList: true,
    subtree: true
});
}

// ==================== EXPORT FUNCTIONS ====================

function exportFunctionsToWindow() {
// Export state and functions to window object for multiplayer
window.state = state;
window.resetGame = resetGame;
window.handleCellClick = handleCellClick;
window.updateBoard = updateBoard;
window.updateScores = updateScores;
window.showNotification = showNotification;
window.addSystemMessage = addSystemMessage;
window.switchToNextPlayer = switchToNextPlayer;
window.placeIon = placeIon;
window.checkForLines = checkForLines;
window.saveCurrentStateToHistory = saveCurrentStateToHistory;
window.addGameLogEntry = addGameLogEntry;
window.processVectorsSequentially = processVectorsSequentially;
window.enableReviewMode = enableReviewMode;
window.startGame = function() {
    if (startGameButton && typeof startGameButton.click === 'function') {
        startGameButton.click();
    }
};
}