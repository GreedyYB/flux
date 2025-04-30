// Game state
let gameState = {
    board: Array(8).fill().map(() => Array(8).fill(null)),
    currentPlayer: 'white',
    isGameStarted: false,
    isGameOver: false,
    isReviewMode: false,
    currentReviewMove: 0,
    whiteScore: 0,
    blackScore: 0,
    moveHistory: [],
    boardHistory: [],
    lastMove: null,
    winningNexus: null,
    aiOpponent: false,  // Indicates if AI opponent is enabled
    aiLevel: 2,  // Default AI level (now set to 2)
    waitingForAI: false,  // Prevents player moves during AI's turn
    timerEnabled: true, // New property for timer toggle
    timers: {
        white: 600, // 10 minutes in seconds
        black: 600,
        increment: 0,
        activeTimer: null
    },
    isProcessingMove: false,  // Add this line
};

// DOM elements
const gameBoard = document.getElementById('game-board');
const whiteScoreElement = document.getElementById('white-nodes-count');
const blackScoreElement = document.getElementById('black-nodes-count');
const whiteTimerElement = document.getElementById('white-timer');
const blackTimerElement = document.getElementById('black-timer');
const whitePlayerElement = document.getElementById('player-white');
const blackPlayerElement = document.getElementById('player-black');
const gameLogElement = document.getElementById('game-log');
const moveCounterElement = document.getElementById('move-counter');
const notificationElement = document.getElementById('notification');
const notificationTitleElement = document.getElementById('notification-title');
const notificationMessageElement = document.getElementById('notification-message');
const notificationPrimaryBtn = document.getElementById('notification-primary-btn');
const notificationSecondaryBtn = document.getElementById('notification-secondary-btn');
const notificationCloseBtn = document.getElementById('notification-close-btn');
const toastElement = document.getElementById('toast');
const overlayElement = document.getElementById('overlay');
const rulesPopupElement = document.getElementById('rules-popup');
const timerToggle = document.getElementById('timer-toggle');
const timerSettingsDiv = document.getElementById('timer-settings');

// Add these variables for continuous scrolling
let continuousScrollInterval = null;
const scrollInterval = 300; // Scroll every 300ms (0.3 seconds)

// Buttons
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const resignBtn = document.getElementById('resign-btn');
const rulesBtn = document.getElementById('rules-btn');
const firstMoveBtn = document.getElementById('first-move-btn');
const prevMoveBtn = document.getElementById('prev-move-btn');
const nextMoveBtn = document.getElementById('next-move-btn');
const lastMoveBtn = document.getElementById('last-move-btn');
const exitReviewBtn = document.getElementById('exit-review-btn');
const rulesCloseBtn = document.getElementById('rules-close-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsCloseBtn = document.getElementById('settings-close-btn');

// Timer settings
const minutesPerPlayerInput = document.getElementById('minutes-per-player');
const incrementSecondsInput = document.getElementById('increment-seconds');

// Global variables
let reviewBtn;

// Add a global variable to store the original button handlers
let originalButtonHandlers = {
    resetBtnHandler: null
};

// Theme management
let currentTheme = 'classic';
const defaultColors = {
    classic: {
        whiteIon: '#ecf0f1',
        blackIon: '#2c3e50',
        nodeColor: '#e74c3c',
        boardColor: '#d1e6f9',
        boardHover: '#b3d4fc'
    }
};

// Function to precisely align game log with board bottom
function adjustGameLogHeight() {
    // Get the game board area element (entire board area including player info)
    const gameBoardArea = document.querySelector('.game-board-area');
    const gameLog = document.getElementById('game-log');
    
    if (gameBoardArea && gameLog) {
        // If in review mode, ensure content area has proper height 
        if (gameState.isReviewMode) {
            // Make sure the review section is visible on top
            const reviewSection = document.getElementById('review-section');
            if (reviewSection) {
                // Position review section at the bottom of the log
                reviewSection.style.position = 'absolute';
                reviewSection.style.bottom = '0';
                reviewSection.style.left = '0';
                reviewSection.style.width = '100%';
                reviewSection.style.backgroundColor = '#fff';
                reviewSection.style.borderTop = '1px solid #ccc';
                reviewSection.style.zIndex = '10';
                
                // Make sure it's visible
                reviewSection.style.display = 'block';
                
                // Adjust game log content max-height
                const reviewHeight = reviewSection.offsetHeight;
                gameLog.style.paddingBottom = `${reviewHeight + 20}px`;
            }
        } else {
            gameLog.style.paddingBottom = '0';
        }
        
        // Calculate how tall the game log should be to align its bottom with the board's bottom
        const boardRect = gameBoardArea.getBoundingClientRect();
        const boardBottom = boardRect.bottom;
        const gameLogTop = gameLog.getBoundingClientRect().top;
        let desiredHeight = boardBottom - gameLogTop - 2; // Subtract 2px for border
        
        // Make sure height doesn't go negative
        if (desiredHeight < 100) desiredHeight = 100;
        
        // Apply calculated height
        gameLog.style.height = `${desiredHeight}px`;
    }
}

// Initialize the game
function initializeGame() {
    try {
        // Create the game board
        createBoard();
        
        // Initialize game state
        resetGameState();
        
        // Set up event listeners only after ensuring elements exist
        setupEventListeners();
        
        // Initialize game mode dropdown
        initGameModeDropdown();
        
        // Initialize AI
        initializeAI();

        // Update timer settings visibility initially
        updateTimerSettings();
        
        // Initialize sound system
        if (window.SoundSystem) {
            window.SoundSystem.init();
        }
        
        // Add a slight delay to ensure all elements are rendered properly
        setTimeout(adjustGameLogHeight, 100);
        
        // Add event listener to adjust log height on window resize
        window.addEventListener('resize', adjustGameLogHeight);
        
        // Initialize review button
        reviewBtn = document.getElementById('review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', enterReviewMode);
        }
        
        // Set up the start button with direct handler
        setupStartButton();
        
        // Set up the reset button with direct handler
        setupResetButton();
        
        setupSettingsEventListeners();
        loadSavedTheme();
        
    } catch (error) {
        console.error('Error initializing game:', error);
        showToast('Error initializing game. Please refresh the page.', 3000);
    }
}

// Create the game board
function createBoard() {
    gameBoard.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            gameBoard.appendChild(cell);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Get all required elements first
    const elements = {
        rulesBtn: document.getElementById('rules-btn'),
        gameBoard: document.getElementById('game-board'),
        gameLogElement: document.getElementById('game-log'),
        notificationPrimaryBtn: document.getElementById('notification-primary-btn'),
        notificationSecondaryBtn: document.getElementById('notification-secondary-btn'),
        notificationCloseBtn: document.getElementById('notification-close-btn'),
        rulesCloseBtn: document.getElementById('rules-close-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsCloseBtn: document.getElementById('settings-close-btn')
    };

    // Optional elements that may not exist in all versions
    const optionalElements = {
        tutorialBtn: document.getElementById('tutorial-btn'),
        exitReviewBtn: document.getElementById('exit-review-btn')
    };

    // Verify all required elements exist (excluding buttons we handle separately)
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            throw new Error(`Required element not found: ${key}`);
        }
    }

    // Set up all interactive buttons directly
    setupStartButton();
    setupResetButton();
    setupResignButton();
    
    // Now safely add event listeners for other elements
    elements.rulesBtn.addEventListener('click', showRules);
    timerToggle.addEventListener('change', updateTimerSettings);
    elements.gameBoard.addEventListener('click', handleBoardClick);
    
    // Exit review button - only add listener if element exists
    if (optionalElements.exitReviewBtn) {
        optionalElements.exitReviewBtn.addEventListener('click', exitReviewMode);
    }
    
    // Tutorial button - only add listener if element and function exist
    if (optionalElements.tutorialBtn && typeof startTutorial === 'function') {
        optionalElements.tutorialBtn.addEventListener('click', startTutorial);
    }
    
    // Notification buttons
    elements.notificationCloseBtn.addEventListener('click', closeNotification);
    
    // Rules popup
    elements.rulesCloseBtn.addEventListener('click', closeRules);
    
    // Game log click for review
    elements.gameLogElement.addEventListener('click', handleGameLogClick);
    
    // Add event listeners if elements exist
    if (elements.rulesBtn) elements.rulesBtn.addEventListener('click', showRules);
    if (elements.rulesCloseBtn) elements.rulesCloseBtn.addEventListener('click', closeRules);
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', showSettings);
    if (elements.settingsCloseBtn) elements.settingsCloseBtn.addEventListener('click', closeSettings);
}

// Function to set up review controls - called when entering review mode
function setupReviewControls() {
    try {
        console.log("Setting up review controls...");
        
        // Get the review section directly
        const reviewSection = document.getElementById('review-section');
        
        // Get the control buttons from the review section directly
        const prevMoveBtn = document.getElementById('prev-move-btn');
        const nextMoveBtn = document.getElementById('next-move-btn');
        const firstMoveBtn = document.getElementById('first-move-btn');
        const lastMoveBtn = document.getElementById('last-move-btn');
        const exitReviewBtn = document.getElementById('exit-review-btn');
        
        // Log the elements for debugging
        console.log("Review control elements:", {
            reviewSection,
            prevMoveBtn,
            nextMoveBtn,
            firstMoveBtn,
            lastMoveBtn,
            exitReviewBtn
        });
        
        // Check if all required buttons exist
        if (!prevMoveBtn || !nextMoveBtn || !firstMoveBtn || !lastMoveBtn) {
            console.error("One or more review control buttons not found");
            return false;
        }
        
        // Remove any existing event listeners first to avoid duplicates
        const removeAllListeners = (element, events, handler) => {
            if (element) {
                events.forEach(event => {
                    element.removeEventListener(event, handler);
                });
            }
        };
        
        // Clean up previous event listeners
        if (prevMoveBtn) {
            removeAllListeners(prevMoveBtn, ['mousedown', 'touchstart'], startContinuousScrollBackward);
            removeAllListeners(prevMoveBtn, ['mouseup', 'mouseleave', 'touchend'], stopContinuousScroll);
        }
        
        if (nextMoveBtn) {
            removeAllListeners(nextMoveBtn, ['mousedown', 'touchstart'], startContinuousScrollForward);
            removeAllListeners(nextMoveBtn, ['mouseup', 'mouseleave', 'touchend'], stopContinuousScroll);
        }
        
        if (firstMoveBtn) {
            removeAllListeners(firstMoveBtn, ['click'], goToFirstMove);
        }
        
        if (lastMoveBtn) {
            removeAllListeners(lastMoveBtn, ['click'], goToLastMove);
        }
        
        if (exitReviewBtn) {
            removeAllListeners(exitReviewBtn, ['click'], exitReviewMode);
        }
        
        // Now add event listeners
        
        // Previous move button
        prevMoveBtn.addEventListener('mousedown', startContinuousScrollBackward);
        prevMoveBtn.addEventListener('touchstart', startContinuousScrollBackward);
        prevMoveBtn.addEventListener('mouseup', stopContinuousScroll);
        prevMoveBtn.addEventListener('mouseleave', stopContinuousScroll);
        prevMoveBtn.addEventListener('touchend', stopContinuousScroll);
        
        // Next move button
        nextMoveBtn.addEventListener('mousedown', startContinuousScrollForward);
        nextMoveBtn.addEventListener('touchstart', startContinuousScrollForward);
        nextMoveBtn.addEventListener('mouseup', stopContinuousScroll);
        nextMoveBtn.addEventListener('mouseleave', stopContinuousScroll);
        nextMoveBtn.addEventListener('touchend', stopContinuousScroll);
        
        // First and last move buttons
        firstMoveBtn.addEventListener('click', goToFirstMove);
        lastMoveBtn.addEventListener('click', goToLastMove);
        
        // Exit review button
        if (exitReviewBtn) {
            exitReviewBtn.addEventListener('click', exitReviewMode);
        }
        
        console.log("Review controls setup successfully");
        return true;
    } catch (error) {
        console.error("Error setting up review controls:", error);
        return false;
    }
}

// Update game mode based on dropdown selection
function updateGameMode() {
    const gameModeSelect = document.getElementById('game-mode-select');
    const selectedMode = gameModeSelect.value;
    
    // Set AI opponent based on selection
    if (selectedMode.startsWith('ai')) {
        gameState.aiOpponent = true;
        
        // Set AI level based on the selection
        if (selectedMode === 'ai-1') {
            gameState.aiLevel = 1;
        } else if (selectedMode === 'ai-2') {
            gameState.aiLevel = 2;
        } else { // ai-3
            gameState.aiLevel = 3;
        }
    } else {
        gameState.aiOpponent = false;
    }
    
    // Always set the start button text to just "Start"
    startBtn.textContent = 'Start';
}

// Update timer settings visibility
function updateTimerSettings() {
    const isTimerEnabled = timerToggle.checked;
    gameState.timerEnabled = isTimerEnabled;
    
    // Update the toggle labels
    const toggleLabels = document.querySelectorAll('.toggle-label');
    toggleLabels[0].classList.toggle('active', !isTimerEnabled); // "Off" label
    toggleLabels[1].classList.toggle('active', isTimerEnabled);  // "On" label
    
    // Show/hide the timer settings
    timerSettingsDiv.style.display = isTimerEnabled ? 'block' : 'none';
}

// Update timer visibility during gameplay
function updateTimerVisibility() {
    whiteTimerElement.classList.toggle('hidden', !gameState.timerEnabled);
    blackTimerElement.classList.toggle('hidden', !gameState.timerEnabled);
    
    // Only start the timer if enabled
    if (gameState.timerEnabled) {
        startTimer('white');
    } else {
        // If timer is disabled, clear any existing timer
        if (gameState.timers.activeTimer) {
            clearInterval(gameState.timers.activeTimer);
            gameState.timers.activeTimer = null;
        }
    }
}

// Reset game state
function resetGameState() {
    // First, clear any existing nexus highlights
    const nexusCells = gameBoard.querySelectorAll('.nexus-cell');
    nexusCells.forEach(cell => cell.classList.remove('nexus-cell'));
    
    const previousAIOpponent = gameState.aiOpponent; // Remember AI setting
    const previousAILevel = gameState.aiLevel; // Remember AI level
    const previousTimerEnabled = gameState.timerEnabled; // Remember timer setting
    
    gameState = {
        board: Array(8).fill().map(() => Array(8).fill(null)),
        currentPlayer: 'white',
        isGameStarted: false,
        isGameOver: false,
        isReviewMode: false,
        currentReviewMove: 0,
        whiteScore: 0,
        blackScore: 0,
        moveHistory: [],
        boardHistory: [Array(8).fill().map(() => Array(8).fill(null))], // Initial empty board
        lastMove: null,
        winningNexus: null, // Explicitly reset the winningNexus property
        aiOpponent: previousAIOpponent, // Preserve AI setting
        aiLevel: previousAILevel, // Preserve AI level
        timerEnabled: previousTimerEnabled, // Preserve timer setting
        waitingForAI: false, // Reset waiting state
        timers: {
            white: parseInt(minutesPerPlayerInput.value) * 60,
            black: parseInt(minutesPerPlayerInput.value) * 60,
            increment: parseInt(incrementSecondsInput.value),
            activeTimer: null
        },
        isProcessingMove: false,  // Add this line
    };
    
    updateTimerDisplay('white');
    updateTimerDisplay('black');
    updatePlayerIndicator();
    updateScores();
    gameLogElement.innerHTML = '';
    
    // Hide review section
    const reviewSection = document.getElementById('review-section');
    if (reviewSection) {
        reviewSection.style.display = 'none';
    }
    
    // Hide the review button when starting a new game
    if (reviewBtn) {
        reviewBtn.style.display = 'none';
    }
}

// Start a new game
function startGame() {
    console.log("Starting new game");
    
    // Get fresh references to UI elements
    const startBtn = document.getElementById('start-btn');
    const resignBtn = document.getElementById('resign-btn');
    
    if (gameState.isGameStarted && !gameState.isGameOver) {
        showToast("Game is already in progress.", 2000);
        return;
    }
    
    // Clear any existing nexus highlights
    const nexusCells = gameBoard.querySelectorAll('.nexus-cell');
    nexusCells.forEach(cell => cell.classList.remove('nexus-cell'));
    
    // Get game mode from select dropdown
    const gameModeSelect = document.getElementById('game-mode-select');
    const selectedMode = gameModeSelect.value;
    
    // Set AI opponent based on selection
    if (selectedMode.startsWith('ai')) {
        gameState.aiOpponent = true;
        
        // Set AI level based on the selection
        if (selectedMode === 'ai-1') {
            gameState.aiLevel = 1;
        } else if (selectedMode === 'ai-2') {
            gameState.aiLevel = 2;
        } else { // ai-3
            gameState.aiLevel = 3;
        }
    } else {
        gameState.aiOpponent = false;
    }
    
    // Reset the game state
    resetGameState();
    
    // Now set these flags after reset
    gameState.isGameStarted = true;
    gameState.isGameOver = false;
    gameState.waitingForAI = false;
    
    // Update the board
    updateBoard();
    
    // Show/hide timers based on setting
    updateTimerVisibility();
    
    // Switch buttons and controls
    if (startBtn) startBtn.style.display = 'none';
    if (resignBtn) resignBtn.style.display = 'inline-block';
    
    // Switch from pregame to ingame controls
    document.getElementById('pregame-controls').style.display = 'none';
    document.getElementById('ingame-controls').style.display = 'block';
    
    // Update current turn indicator
    updateCurrentTurnIndicator();
    
    // Update the toast message based on game mode
    let gameTypeText;
    if (gameState.aiOpponent) {
        gameTypeText = `against AI (Level ${gameState.aiLevel})`;
    } else {
        gameTypeText = "in human vs human mode";
    }
    showToast(`Game started ${gameTypeText}. White's turn.`, 2000);
    
    // Set up the buttons for the new game
    setupResetButton();
    setupResignButton(); // Make sure resign button works
    
    // If AI plays as black and is enabled, trigger its move if it's black's turn
    if (gameState.aiOpponent && gameState.currentPlayer === 'black') {
        gameState.waitingForAI = true;
        checkForAITurn();
    }
    
    // Show CORE avatar only if AI opponent is enabled
    if (gameState.aiOpponent) {
        coreAvatar.show();
    } else {
        coreAvatar.hide();
    }
}

// Simple direct reset function
function resetGame() {
    console.log("Direct reset called");
    
    // First, close any active notifications
    closeNotification();
    
    // Stop any timers
    if (gameState.timers && gameState.timers.activeTimer) {
        clearInterval(gameState.timers.activeTimer);
        gameState.timers.activeTimer = null;
    }
    
    // Exit review mode if needed
    if (gameState.isReviewMode) {
        // Hide review controls
        const reviewSection = document.getElementById('review-section');
        if (reviewSection) {
            reviewSection.style.display = 'none';
        }
        
        // Remove review mode class from game log
        if (gameLogElement) {
            gameLogElement.classList.remove('with-review-controls');
        }
        
        gameState.isReviewMode = false;
    }
    
    // Clear the board state completely
    gameState.board = Array(8).fill().map(() => Array(8).fill(null));
    gameState.currentPlayer = 'white';
    gameState.isGameStarted = false;
    gameState.isGameOver = false;
    gameState.whiteScore = 0;
    gameState.blackScore = 0;
    gameState.moveHistory = [];
    gameState.boardHistory = [Array(8).fill().map(() => Array(8).fill(null))];
    gameState.lastMove = null;
    gameState.winningNexus = null;
    gameState.currentReviewMove = 0;
    
    // Reset timers
    gameState.timers = {
        white: parseInt(minutesPerPlayerInput.value) * 60,
        black: parseInt(minutesPerPlayerInput.value) * 60,
        increment: parseInt(incrementSecondsInput.value),
        activeTimer: null
    };
    
    // Update the display
    updateTimerDisplay('white');
    updateTimerDisplay('black');
    updatePlayerIndicator();
    updateScores();
    
    // Clear game log
    if (gameLogElement) {
        gameLogElement.innerHTML = '';
    }
    
    // Update the board display
    updateBoard();
    
    // Get fresh references to buttons
    const startBtn = document.getElementById('start-btn');
    const resignBtn = document.getElementById('resign-btn');
    
    // Reset UI elements
    if (startBtn) startBtn.style.display = 'inline-block';
    if (resignBtn) resignBtn.style.display = 'none';
    document.getElementById('pregame-controls').style.display = 'block';
    document.getElementById('ingame-controls').style.display = 'none';
    
    // Hide review button
    if (reviewBtn) {
        reviewBtn.style.display = 'none';
    }
    
    // Make sure start button works after reset
    setupStartButton();
    
    showToast("Game has been reset.", 2000);
}

// Update game mode dropdown based on current state
function updateGameModeDropdown() {
    const gameModeSelect = document.getElementById('game-mode-select');
    
    if (gameState.aiOpponent) {
        if (gameState.aiLevel === 1) {
            gameModeSelect.value = 'ai-1';
        } else if (gameState.aiLevel === 2) {
            gameModeSelect.value = 'ai-2';
        } else { // Level 3
            gameModeSelect.value = 'ai-3';
        }
    } else {
        gameModeSelect.value = 'human';
    }
}

// Initialize game mode dropdown and timer toggle
function initGameModeDropdown() {
    // Initial setup of the game mode dropdown
    updateGameModeDropdown();
    
    // Also initialize timer settings
    updateTimerSettings();
    
    // Hide the resign button initially
    resignBtn.style.display = 'none';
}

// Function to update the current turn indicator
function updateCurrentTurnIndicator() {
    // Update active player indicator
    const whitePlayer = document.getElementById('player-white');
    const blackPlayer = document.getElementById('player-black');
    
    if (whitePlayer && blackPlayer) {
        whitePlayer.classList.toggle('active', gameState.currentPlayer === 'white');
        blackPlayer.classList.toggle('active', gameState.currentPlayer === 'black');
        
        // Update black player text based on AI opponent
        const blackPlayerText = blackPlayer.querySelector('span');
        if (blackPlayerText) {
            blackPlayerText.textContent = gameState.aiOpponent ? `CORE-${gameState.aiLevel}` : 'Black';
        }
    }
    
    // Update scores
    updateScores();
}

// Handle player resignation
function handleResign() {
    // Get fresh references to buttons
    const startBtn = document.getElementById('start-btn');
    const resignBtn = document.getElementById('resign-btn');
    
    console.log("Handling resign request");
    
    if (!gameState.isGameStarted || gameState.isGameOver) {
        showToast("No active game to resign.", 2000);
        return;
    }
    
    showNotification(
        "Resign Game",
        `Are you sure you want to resign? ${gameState.currentPlayer === 'white' ? 'Black' : 'White'} will win the game.`,
        "Yes, Resign",
        "Cancel",
        () => {
            // Stop any active timer
            if (gameState.timers && gameState.timers.activeTimer) {
                stopTimer(gameState.currentPlayer);
            }
            
            gameState.isGameOver = true;
            
            // Restore start button, hide resign button
            if (startBtn) startBtn.style.display = 'inline-block';
            if (resignBtn) resignBtn.style.display = 'none';
            
            // Switch back to pregame controls
            document.getElementById('pregame-controls').style.display = 'block';
            document.getElementById('ingame-controls').style.display = 'none';
            
            // Setup buttons with fresh handlers
            setupStartButton();
            setupResetButton();
            
            const winner = gameState.currentPlayer === 'white' ? 'Black' : 'White';
            showNotification(
                "Game Over",
                `${winner} wins by resignation!`,
                "New Game",
                "Review Game",
                startGame,
                enterReviewMode
            );
        },
        closeNotification
    );
}

// Show game rules
function showRules() {
    rulesPopupElement.style.display = 'block';
    overlayElement.style.display = 'block';
}

// Close game rules
function closeRules() {
    rulesPopupElement.style.display = 'none';
    overlayElement.style.display = 'none';
}

// Settings popup functions
function showSettings() {
    const settingsPopup = document.getElementById('settings-popup');
    const overlay = document.getElementById('overlay');
    settingsPopup.style.display = 'block';
    overlay.style.display = 'block';
    
    // Load current theme
    const themeSelect = document.getElementById('theme-select');
    themeSelect.value = currentTheme;
    
    // Show/hide custom colors based on current theme
    const customColors = document.getElementById('custom-colors');
    customColors.style.display = currentTheme === 'custom' ? 'block' : 'none';
    
    // Load current custom colors
    if (currentTheme === 'custom') {
        document.getElementById('white-ion-color').value = getComputedStyle(document.documentElement).getPropertyValue('--white-ion').trim();
        document.getElementById('black-ion-color').value = getComputedStyle(document.documentElement).getPropertyValue('--black-ion').trim();
        document.getElementById('node-color').value = getComputedStyle(document.documentElement).getPropertyValue('--node-color').trim();
        document.getElementById('board-color').value = getComputedStyle(document.documentElement).getPropertyValue('--board-color').trim();
    }
}

function closeSettings() {
    const settingsPopup = document.getElementById('settings-popup');
    const overlay = document.getElementById('overlay');
    settingsPopup.style.display = 'none';
    overlay.style.display = 'none';
}

function setupSettingsEventListeners() {
    const themeSelect = document.getElementById('theme-select');
    const customColors = document.getElementById('custom-colors');
    const saveBtn = document.getElementById('settings-save-btn');
    const resetBtn = document.getElementById('settings-reset-btn');
    const closeBtn = document.getElementById('settings-close-btn');
    
    // Theme selection change
    themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        customColors.style.display = selectedTheme === 'custom' ? 'block' : 'none';
    });
    
    // Save button click
    saveBtn.addEventListener('click', () => {
        const selectedTheme = themeSelect.value;
        applyTheme(selectedTheme);
        
        if (selectedTheme === 'custom') {
            const customColors = {
                whiteIon: document.getElementById('white-ion-color').value,
                blackIon: document.getElementById('black-ion-color').value,
                nodeColor: document.getElementById('node-color').value,
                boardColor: document.getElementById('board-color').value
            };
            applyCustomColors(customColors);
        }
        
        // Save to localStorage
        localStorage.setItem('fluxTheme', selectedTheme);
        if (selectedTheme === 'custom') {
            localStorage.setItem('fluxCustomColors', JSON.stringify(getCustomColors()));
        }
        
        closeSettings();
        showToast('Theme settings saved!', 2000);
    });
    
    // Reset button click
    resetBtn.addEventListener('click', () => {
        themeSelect.value = 'classic';
        customColors.style.display = 'none';
        applyTheme('classic');
        localStorage.removeItem('fluxTheme');
        localStorage.removeItem('fluxCustomColors');
        showToast('Theme reset to classic', 2000);
    });
    
    // Close button click
    closeBtn.addEventListener('click', closeSettings);
}

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    // If it's a custom theme, we'll apply the custom colors separately
    if (theme === 'custom') {
        const savedCustomColors = localStorage.getItem('fluxCustomColors');
        if (savedCustomColors) {
            applyCustomColors(JSON.parse(savedCustomColors));
        }
    }
}

function applyCustomColors(colors) {
    const root = document.documentElement;
    root.style.setProperty('--white-ion', colors.whiteIon);
    root.style.setProperty('--black-ion', colors.blackIon);
    root.style.setProperty('--node-color', colors.nodeColor);
    root.style.setProperty('--board-color', colors.boardColor);
}

function getCustomColors() {
    return {
        whiteIon: document.getElementById('white-ion-color').value,
        blackIon: document.getElementById('black-ion-color').value,
        nodeColor: document.getElementById('node-color').value,
        boardColor: document.getElementById('board-color').value
    };
}

// Load saved theme on startup
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('fluxTheme') || 'classic';
    applyTheme(savedTheme);
}

// Handle board click
function handleBoardClick(event) {
    if (!gameState.isGameStarted || gameState.isGameOver || gameState.isReviewMode) {
        if (!gameState.isGameStarted) {
            showToast("Please start the game first.", 2000);
        }
        return;
    }
    
    // Prevent moves while waiting for AI
    if (gameState.waitingForAI) {
        showToast("Please wait for the AI to move.", 2000);
        return;
    }
    
    const cell = event.target.closest('.cell');
    if (!cell) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    handleCellClick(row, col);
}

// Handle cell click
function handleCellClick(row, col) {
    // Return if waiting for AI
    if (gameState.waitingForAI) {
        showToast("Please wait for the AI to move.", 2000);
        return;
    }
    
    // Return if processing a move (prevent any moves during animation)
    if (gameState.isProcessingMove) {
        return;
    }
    
    // Check if cell is already occupied
    if (gameState.board[row][col] !== null) {
        showToast("Cell is already occupied.", 2000);
        return;
    }
    
    // Check if the move would create a line too long
    if (wouldCreateLineTooLong(row, col, gameState.currentPlayer)) {
        showToast("This move would create a line longer than 4 ions.", 2000);
        return;
    }
    
    const currentMoveCoords = [row, col];
    
    // Check for vectors before placing anything
    const vectors = checkForVectors(row, col, gameState.currentPlayer);
    const isNode = vectors.length > 0;
    
    if (isNode) {
        // Let processVectors handle node creation and vector processing
        gameState.lastMove = [row, col];
        processVectors(vectors, row, col);
    } else {
        // Place regular ion
        placeIon(row, col, gameState.currentPlayer);
        const notation = getNotation(col, row);
        addMoveToGameLog(gameState.moveHistory.length, gameState.currentPlayer, notation, false);
        saveCurrentStateToHistory();
        updateBoard();
        
        if (!hasLegalMoves()) {
            endGameByNodeCount();
            return;
        }
        
        switchPlayers();
    }
}

// Switch to the other player
function switchPlayers() {
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    updatePlayerIndicator();
    updateCurrentTurnIndicator();
    
    // Only handle timers if enabled
    if (gameState.timerEnabled) {
        // Give time increment to previous player
        stopTimer(gameState.currentPlayer === 'white' ? 'black' : 'white');
        
        // Start timer for current player
        startTimer(gameState.currentPlayer);
    }
    
    // If AI is enabled and it's the AI's turn, set waitingForAI to true and trigger AI move
    if (gameState.aiOpponent && gameState.currentPlayer === 'black') {
        gameState.waitingForAI = true;
        checkForAITurn();
    }
}

// Update the player indicator
function updatePlayerIndicator() {
    whitePlayerElement.classList.toggle('active', gameState.currentPlayer === 'white');
    blackPlayerElement.classList.toggle('active', gameState.currentPlayer === 'black');
}

// Update the scores
function updateScores() {
    const whiteScore = document.getElementById('white-score');
    const blackScore = document.getElementById('black-score');
    
    if (whiteScore) whiteScore.textContent = gameState.whiteScore;
    if (blackScore) blackScore.textContent = gameState.blackScore;
}

// Check if move would create a line too long
function wouldCreateLineTooLong(row, col, playerColor) {
    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal down-right
        [1, -1]   // diagonal down-left
    ];
    
    for (const [dRow, dCol] of directions) {
        let count = 1;  // Including the new piece
        
        // Check in positive direction
        for (let i = 1; i < 5; i++) {
            const newRow = row + dRow * i;
            const newCol = col + dCol * i;
            
            if (isOutOfBounds(newRow, newCol) || 
                !isSameTypeCell(newRow, newCol, playerColor)) {
                break;
            }
            count++;
        }
        
        // Check in negative direction
        for (let i = 1; i < 5; i++) {
            const newRow = row - dRow * i;
            const newCol = col - dCol * i;
            
            if (isOutOfBounds(newRow, newCol) || 
                !isSameTypeCell(newRow, newCol, playerColor)) {
                break;
            }
            count++;
        }
        
        // If the total count exceeds 4, it would create a line too long
        if (count > 4) {
            return true;
        }
    }
    
    return false;
}

// Check for vectors (lines of exactly 4)
function checkForVectors(row, col, playerColor) {
    const directions = [
        [0, 1],   // horizontal
        [1, 0],   // vertical
        [1, 1],   // diagonal down-right
        [1, -1]   // diagonal down-left
    ];
    
    const vectors = [];
    
    for (const [dRow, dCol] of directions) {
        const vector = [[row, col]]; // Start with the placed piece
        
        // Check in positive direction
        for (let i = 1; i < 4; i++) {
            const newRow = row + dRow * i;
            const newCol = col + dCol * i;
            
            if (isOutOfBounds(newRow, newCol) || 
                !isSameTypeCell(newRow, newCol, playerColor)) {
                break;
            }
            vector.push([newRow, newCol]);
        }
        
        // Check in negative direction
        for (let i = 1; i < 4; i++) {
            const newRow = row - dRow * i;
            const newCol = col - dCol * i;
            
            if (isOutOfBounds(newRow, newCol) || 
                !isSameTypeCell(newRow, newCol, playerColor)) {
                break;
            }
            vector.push([newRow, newCol]);
        }
        
        // If we have exactly 4 cells, we have a vector
        if (vector.length === 4) {
            vectors.push(vector);
        }
    }
    
    return vectors;
}

// Process vectors after a move
function processVectors(vectors, row, col) {
    // Collect cells to remove
    const cellsToRemove = new Set();

    // Process each vector
    for (let vector of vectors) {
        for (let [r, c] of vector) {
            // Skip the current cell (it's already a node)
            if (r === row && c === col) continue;
            
            // Check if the cell is not already a node
            if (gameState.board[r][c] && 
                gameState.board[r][c].type !== 'node' && 
                !gameState.board[r][c].isNode) {
                cellsToRemove.add(`${r},${c}`);
            }
        }
    }

    // Remove the collected ions from the board
    for (const cellStr of cellsToRemove) {
        const [removeRow, removeCol] = cellStr.split(',').map(Number);
        gameState.board[removeRow][removeCol] = null;
    }

    // Create the node at the current position
    const nodeType = getNodeType(vectors.length);
    gameState.board[row][col] = {
        type: 'node',
        color: gameState.currentPlayer,
        nodeType: nodeType,
        isNode: true
    };

    // Increment the node count for the current player
    if (gameState.currentPlayer === 'white') {
        gameState.whiteScore++;
    } else {
        gameState.blackScore++;
    }

    // Update scores display
    updateScores();

    // Update the game state
    updateBoard();
    const notation = getNotation(col, row);
    addMoveToGameLog(gameState.moveHistory.length, gameState.currentPlayer, notation, true);
    saveCurrentStateToHistory();

    // Check for nexus after vector formation
    const nexus = checkForNexus([row, col]);
    if (nexus) {
        // Store the winning nexus in game state
        gameState.winningNexus = nexus;
        
        // Clear any existing highlights and apply nexus highlight immediately
        const allCells = document.querySelectorAll('.cell');
        allCells.forEach(cell => {
            cell.classList.remove('last-move');
            cell.classList.remove('current-state');
            cell.classList.remove('nexus-cell');
        });
        
        // Force immediate nexus highlighting
        nexus.forEach(([r, c]) => {
            const cellIndex = r * 8 + c;
            const cell = gameBoard.children[cellIndex];
            if (cell) {
                // Force a reflow to ensure animation plays
                void cell.offsetWidth;
                cell.classList.add('nexus-cell');
            }
        });

        // Play end game sound
        if (window.SoundSystem) {
            window.SoundSystem.playEndGameSound();
        }

        // End the game
        endGame(`${gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1)} wins with a Nexus!`);
        return;
    }

    // Only play vector sound if no nexus was formed
    if (window.SoundSystem) {
        window.SoundSystem.playVectorSound();
    }

    // Check if there are any legal moves left
    if (!hasLegalMoves()) {
        endGameByNodeCount();
        return;
    }

    // Switch players if the game hasn't ended
    if (!gameState.isGameOver) {
        switchPlayers();
    }
    
    if (gameState.aiOpponent) {
        coreAvatar.setReactingState();
    }
}

// Get the type of node based on number of vectors
function getNodeType(vectorCount) {
    switch (vectorCount) {
        case 1: return 'standard';
        case 2: return 'double';
        case 3: return 'triple';
        case 4: return 'quadruple';
        default: return 'standard';
    }
}

// Check for nexus formation
function checkForNexus(moveCoords) {
    const [row, col] = moveCoords;
    const playerColor = gameState.board[row][col].color;
    
    // Check horizontal nexus
    for (let c = 0; c <= 4; c++) {
        let count = 0;
        let cells = [];
        for (let i = 0; i < 4; i++) {
            if (c + i < 8 && 
                gameState.board[row][c + i] && 
                gameState.board[row][c + i].type === 'node' && 
                gameState.board[row][c + i].color === playerColor) {
                count++;
                cells.push([row, c + i]);
            }
        }
        if (count === 4) {
            gameState.winningNexus = cells;
            return cells;
        }
    }
    
    // Check vertical nexus
    for (let r = 0; r <= 4; r++) {
        let count = 0;
        let cells = [];
        for (let i = 0; i < 4; i++) {
            if (r + i < 8 && 
                gameState.board[r + i][col] && 
                gameState.board[r + i][col].type === 'node' && 
                gameState.board[r + i][col].color === playerColor) {
                count++;
                cells.push([r + i, col]);
            }
        }
        if (count === 4) {
            gameState.winningNexus = cells;
            return cells;
        }
    }
    
    // Check diagonal (top-left to bottom-right)
    for (let r = -3; r <= 4; r++) {
        for (let c = -3; c <= 4; c++) {
            let count = 0;
            let cells = [];
            for (let i = 0; i < 4; i++) {
                const checkRow = row + r + i;
                const checkCol = col + c + i;
                if (checkRow >= 0 && checkRow < 8 && checkCol >= 0 && checkCol < 8 && 
                    gameState.board[checkRow][checkCol] && 
                    gameState.board[checkRow][checkCol].type === 'node' && 
                    gameState.board[checkRow][checkCol].color === playerColor) {
                    count++;
                    cells.push([checkRow, checkCol]);
                }
            }
            if (count === 4) {
                gameState.winningNexus = cells;
                return cells;
            }
        }
    }
    
    // Check diagonal (top-right to bottom-left)
    for (let r = -3; r <= 4; r++) {
        for (let c = -3; c <= 4; c++) {
            let count = 0;
            let cells = [];
            for (let i = 0; i < 4; i++) {
                const checkRow = row + r + i;
                const checkCol = col + c - i;
                if (checkRow >= 0 && checkRow < 8 && checkCol >= 0 && checkCol < 8 && 
                    gameState.board[checkRow][checkCol] && 
                    gameState.board[checkRow][checkCol].type === 'node' && 
                    gameState.board[checkRow][checkCol].color === playerColor) {
                    count++;
                    cells.push([checkRow, checkCol]);
                }
            }
            if (count === 4) {
                gameState.winningNexus = cells;
                return cells;
            }
        }
    }
    
    return false;
}

// Highlight nexus cells
function highlightNexus(cells) {
    if (!cells || !Array.isArray(cells) || cells.length !== 4) {
        console.error('Invalid cells array passed to highlightNexus:', cells);
        return;
    }
    
    // First remove any existing nexus highlights
    const allCells = document.querySelectorAll('.cell');
    allCells.forEach(cell => {
        cell.classList.remove('nexus-cell');
        cell.classList.remove('last-move');
        cell.classList.remove('current-state');
    });
    
    // Add nexus highlight to the winning cells
    cells.forEach(([row, col]) => {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) {
            console.error('Invalid cell coordinates:', row, col);
            return;
        }
        
        const cellIndex = row * 8 + col;
        const cell = gameBoard.children[cellIndex];
        if (cell) {
            // Force a reflow to ensure animation plays
            void cell.offsetWidth;
            cell.classList.add('nexus-cell');
        } else {
            console.error('Cell not found at index:', cellIndex);
        }
    });
}

// Check if there are any legal moves left
function hasLegalMoves() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (gameState.board[row][col] === null && 
                !wouldCreateLineTooLong(row, col, gameState.currentPlayer)) {
                return true;
            }
        }
    }
    return false;
}

// End game by node count
function endGameByNodeCount() {
    if (gameState.timerEnabled) {
        stopTimer(gameState.currentPlayer);
    }
    gameState.isGameOver = true;
    
    // Get fresh references to buttons to ensure we have the latest DOM elements
    const startBtn = document.getElementById('start-btn');
    const resignBtn = document.getElementById('resign-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // Restore start button, hide resign button
    if (startBtn) startBtn.style.display = 'inline-block';
    if (resignBtn) resignBtn.style.display = 'none';
    
    // Switch back to pregame controls
    document.getElementById('pregame-controls').style.display = 'block';
    document.getElementById('ingame-controls').style.display = 'none';
    
    let message = '';
    if (gameState.whiteScore > gameState.blackScore) {
        message = `White wins with ${gameState.whiteScore} nodes to ${gameState.blackScore}!`;
    } else if (gameState.blackScore > gameState.whiteScore) {
        message = `Black wins with ${gameState.blackScore} nodes to ${gameState.whiteScore}!`;
    } else {
        message = `Game ends in a draw with ${gameState.whiteScore} nodes each!`;
    }
    
    showNotification(
        "Game Over",
        message,
        "New Game",
        "Review Game",
        startGame,
        enterReviewMode
    );
}

// End game with a winner
function endGame(message) {
    gameState.isGameOver = true;
    
    // Stop timers if they're running
    stopTimer('white');
    stopTimer('black');
    
    // Get fresh references to buttons
    const startBtn = document.getElementById('start-btn');
    const resignBtn = document.getElementById('resign-btn');
    
    // Restore start button, hide resign button
    if (startBtn) startBtn.style.display = 'inline-block';
    if (resignBtn) resignBtn.style.display = 'none';
    
    // Switch back to pregame controls
    document.getElementById('pregame-controls').style.display = 'block';
    document.getElementById('ingame-controls').style.display = 'none';
    
    // If it's a nexus win, ensure the nexus highlighting persists
    if (message.toLowerCase().includes('nexus') && gameState.winningNexus) {
        // Don't remove any existing highlights here, as they should already be set
        // Just ensure the nexus cells are still highlighted
        gameState.winningNexus.forEach(([row, col]) => {
            const cellIndex = row * 8 + col;
            const cell = gameBoard.children[cellIndex];
            if (cell && !cell.classList.contains('nexus-cell')) {
                cell.classList.add('nexus-cell');
            }
        });
    }
    
    // Show game over notification
    showNotification(
        'Game Over',
        message,
        'Review Game',
        'New Game',
        () => {
            closeNotification();
            enterReviewMode();
        },
        () => {
            closeNotification();
            resetGame();
        }
    );
}

// Place an ion on the board
function placeIon(row, col, color) {
    // If in review mode, don't modify the actual game state
    if (gameState.isReviewMode) return;
    
    gameState.board[row][col] = {
        type: 'ion',
        color: color
    };
    
    // Set new last move
    gameState.lastMove = [row, col];
    
    updateBoard();
    
    // Play ion placement sound
    if (window.SoundSystem) {
        window.SoundSystem.playIonSound();
    }
    
    // Add bounce animation to the newly placed ion
    const cellIndex = row * 8 + col;
    const cell = gameBoard.children[cellIndex];
    const ion = cell.querySelector('.ion');
    if (ion) {
        ion.classList.add('new-ion');
        // Remove the class after animation completes to allow future animations
        setTimeout(() => {
            ion.classList.remove('new-ion');
        }, 500);
    }
}

// Update the board display
function updateBoard() {
    const cells = Array.from(gameBoard.children);
    
    // Clear all special cell states
    cells.forEach(cell => {
        cell.classList.remove('last-move');
        cell.classList.remove('current-state');
        cell.classList.remove('nexus-cell'); // Always clear nexus highlighting first
    });
    
    // Only show nexus in these specific cases:
    // 1. In review mode, only on the final move
    // 2. When game is over and not in review mode
    if ((gameState.isReviewMode && gameState.winningNexus && 
         gameState.currentReviewMove === gameState.moveHistory.length - 1) ||
        (gameState.isGameOver && !gameState.isReviewMode && gameState.winningNexus)) {
        highlightNexus(gameState.winningNexus);
    }
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cellIndex = row * 8 + col;
            const cell = gameBoard.children[cellIndex];
            cell.innerHTML = ''; // Clear previous content
            
            const cellState = gameState.board[row][col];
            if (cellState !== null) {
                if (cellState.type === 'ion') {
                    const ion = document.createElement('div');
                    ion.classList.add('ion', cellState.color);
                    if (!gameState.isReviewMode && 
                        gameState.lastMove && 
                        gameState.lastMove[0] === row && 
                        gameState.lastMove[1] === col) {
                        void ion.offsetWidth;
                        ion.classList.add('new-ion');
                        setTimeout(() => ion.classList.remove('new-ion'), 650);
                    }
                    cell.appendChild(ion);
                } else if (cellState.type === 'node') {
                    const ion = document.createElement('div');
                    ion.classList.add('ion', cellState.color);
                    
                    const node = document.createElement('div');
                    node.classList.add('node', cellState.nodeType);
                    
                    if (!gameState.isReviewMode && 
                        gameState.lastMove && 
                        gameState.lastMove[0] === row && 
                        gameState.lastMove[1] === col) {
                        void ion.offsetWidth;
                        ion.classList.add('new-ion');
                        setTimeout(() => ion.classList.remove('new-ion'), 650);
                    }
                    
                    cell.appendChild(ion);
                    cell.appendChild(node);
                }
            }
            
            // Only add last-move highlight if the cell isn't part of a nexus
            if (!gameState.isReviewMode && 
                gameState.lastMove && 
                gameState.lastMove[0] === row && 
                gameState.lastMove[1] === col &&
                !cell.classList.contains('nexus-cell')) {
                cell.classList.add('last-move');
                cell.classList.add('current-state');
            }
        }
    }
}

// Get move notation
function getNotation(col, row) {
    const colLetters = 'ABCDEFGH';
    const rowNumbers = '87654321';
    const colLetter = colLetters[col];
    const rowNumber = rowNumbers[row];
    
    return `${colLetter}${rowNumber}`;
}

// Add move to game log
function addMoveToGameLog(moveNumber, player, notation, isNode) {
    // Check if we need to create a new log entry or update an existing one
    let logEntry;
    const moveIndex = Math.floor(moveNumber / 2);
    const isWhiteMove = player === 'white';
    
    if (isWhiteMove) {
        // Create a new log entry for white's move
        logEntry = document.createElement('div');
        logEntry.classList.add('log-entry');
        logEntry.dataset.moveNumber = moveIndex;
        
        // Create move number element
        const moveNumberElement = document.createElement('div');
        moveNumberElement.classList.add('move-number');
        moveNumberElement.textContent = `${moveIndex + 1}.`;
        
        // Create white move element
        const whiteMoveElement = document.createElement('div');
        whiteMoveElement.classList.add('white-move');
        whiteMoveElement.dataset.moveIndex = moveNumber;
        
        const moveText = document.createElement('span');
        moveText.textContent = notation;
        whiteMoveElement.appendChild(moveText);
        
        // Add node indicator if needed
        if (isNode) {
            const nodeIndicator = document.createElement('span');
            nodeIndicator.classList.add('node-indicator');
            nodeIndicator.textContent = '*';
            whiteMoveElement.appendChild(nodeIndicator);
        }
        
        // Create empty black move element
        const blackMoveElement = document.createElement('div');
        blackMoveElement.classList.add('black-move');
        
        // Assemble the log entry
        logEntry.appendChild(moveNumberElement);
        logEntry.appendChild(whiteMoveElement);
        logEntry.appendChild(blackMoveElement);
        
        gameLogElement.appendChild(logEntry);
    } else {
        // Find the last log entry to add black's move
        logEntry = gameLogElement.lastElementChild;
        
        if (!logEntry || logEntry.querySelector('.black-move').childNodes.length > 0) {
            // If there's no log entry or the last one already has a black move,
            // create a new entry (this shouldn't typically happen)
            logEntry = document.createElement('div');
            logEntry.classList.add('log-entry');
            logEntry.dataset.moveNumber = moveIndex;
            
            const moveNumberElement = document.createElement('div');
            moveNumberElement.classList.add('move-number');
            moveNumberElement.textContent = `${moveIndex + 1}.`;
            
            const whiteMoveElement = document.createElement('div');
            whiteMoveElement.classList.add('white-move');
            whiteMoveElement.textContent = '...';
            
            const blackMoveElement = document.createElement('div');
            blackMoveElement.classList.add('black-move');
            blackMoveElement.dataset.moveIndex = moveNumber;
            
            logEntry.appendChild(moveNumberElement);
            logEntry.appendChild(whiteMoveElement);
            logEntry.appendChild(blackMoveElement);
            
            gameLogElement.appendChild(logEntry);
        }
        
        // Add black's move to the last log entry
        const blackMoveElement = logEntry.querySelector('.black-move');
        blackMoveElement.dataset.moveIndex = moveNumber;
        
        const moveText = document.createElement('span');
        moveText.textContent = notation;
        blackMoveElement.appendChild(moveText);
        
        // Add node indicator if needed
        if (isNode) {
            const nodeIndicator = document.createElement('span');
            nodeIndicator.classList.add('node-indicator');
            nodeIndicator.textContent = '*';
            blackMoveElement.appendChild(nodeIndicator);
        }
    }
    
    // Scroll to the bottom to show the latest move
    gameLogElement.scrollTop = gameLogElement.scrollHeight;
    
    // Add to move history
    gameState.moveHistory.push({
        player: player,
        notation: notation,
        isNode: isNode,
        // Store the current board state after this move
        board: JSON.parse(JSON.stringify(gameState.board))
    });
}

// Handle game log click for review
function handleGameLogClick(event) {
    if (!gameState.isReviewMode) return;
    
    // Find the move element that was clicked
    const whiteMoveElement = event.target.closest('.white-move');
    const blackMoveElement = event.target.closest('.black-move');
    
    if (whiteMoveElement && whiteMoveElement.dataset.moveIndex) {
        const moveIndex = parseInt(whiteMoveElement.dataset.moveIndex);
        goToMove(moveIndex);
    } else if (blackMoveElement && blackMoveElement.dataset.moveIndex) {
        const moveIndex = parseInt(blackMoveElement.dataset.moveIndex);
        goToMove(moveIndex);
    }
}

// Enter review mode for replaying the game
function enterReviewMode() {
    if (gameState.moveHistory.length === 0) {
        showToast("No moves to review.", 2000);
        return;
    }
    
    gameState.isReviewMode = true;
    gameState.currentReviewMove = gameState.moveHistory.length - 1;
    
    // Ensure the gameLogContainer exists
    let gameLogContainer = document.getElementById('game-log-container');
    if (!gameLogContainer) {
        // Create a container that wraps the game log
        gameLogContainer = document.createElement('div');
        gameLogContainer.id = 'game-log-container';
        
        // Insert the container before the game log
        gameLogElement.parentNode.insertBefore(gameLogContainer, gameLogElement);
        
        // Move the game log into the container
        gameLogContainer.appendChild(gameLogElement);
    }
    
    // First ensure the review-section exists
    let reviewSection = document.getElementById('review-section');
    
    // If review section doesn't exist, create it
    if (!reviewSection) {
        console.log("Creating review section as it was not found");
        reviewSection = document.createElement('div');
        reviewSection.id = 'review-section';
        reviewSection.innerHTML = `
            <h3>Review Mode</h3>
            <div class="move-counter" id="move-counter">Move: 0 / 0</div>
            <div class="review-controls">
                <button class="btn" id="first-move-btn" title="First Move"><span class="arrow-icon">&#171;</span></button>
                <button class="btn" id="prev-move-btn" title="Previous Move"><span class="arrow-icon">&#8249;</span></button>
                <button class="btn" id="next-move-btn" title="Next Move"><span class="arrow-icon">&#8250;</span></button>
                <button class="btn" id="last-move-btn" title="Last Move"><span class="arrow-icon">&#187;</span></button>
                <button class="btn" id="exit-review-btn" title="Exit Review">✕</button>
            </div>
        `;
        
        // Append to the game log container (not inside the scrollable content)
        gameLogContainer.appendChild(reviewSection);
    }
    
    // Make review section visible
    reviewSection.style.display = 'block';
    
    // Set the with-review-controls class on the game log
    gameLogElement.classList.add('with-review-controls');
    
    // Update the move counter display
    updateMoveCounter();
    
    // Adjust game log height to make room for controls
    adjustGameLogHeight();
    
    // Disable normal game controls
    startBtn.disabled = true;
    resignBtn.disabled = true;
    resetBtn.disabled = true;
    
    // Set up the controls with a short delay to ensure DOM is fully rendered
    setTimeout(() => {
        try {
            // Get the control buttons
            const prevMoveBtn = document.getElementById('prev-move-btn');
            const nextMoveBtn = document.getElementById('next-move-btn');
            const firstMoveBtn = document.getElementById('first-move-btn');
            const lastMoveBtn = document.getElementById('last-move-btn');
            const exitReviewBtn = document.getElementById('exit-review-btn');
            
            // Log button status for debugging
            console.log("Review controls:", {
                prevMoveBtn, nextMoveBtn, firstMoveBtn, 
                lastMoveBtn, exitReviewBtn
            });
            
            // Make sure all required buttons exist
            if (!prevMoveBtn || !nextMoveBtn || !firstMoveBtn || !lastMoveBtn) {
                throw new Error("Review controls not found");
            }
            
            // Previous move button
            prevMoveBtn.addEventListener('mousedown', startContinuousScrollBackward);
            prevMoveBtn.addEventListener('touchstart', startContinuousScrollBackward);
            prevMoveBtn.addEventListener('mouseup', stopContinuousScroll);
            prevMoveBtn.addEventListener('mouseleave', stopContinuousScroll);
            prevMoveBtn.addEventListener('touchend', stopContinuousScroll);
            
            // Next move button
            nextMoveBtn.addEventListener('mousedown', startContinuousScrollForward);
            nextMoveBtn.addEventListener('touchstart', startContinuousScrollForward);
            nextMoveBtn.addEventListener('mouseup', stopContinuousScroll);
            nextMoveBtn.addEventListener('mouseleave', stopContinuousScroll);
            nextMoveBtn.addEventListener('touchend', stopContinuousScroll);
            
            // First and last move buttons
            firstMoveBtn.addEventListener('click', goToFirstMove);
            lastMoveBtn.addEventListener('click', goToLastMove);
            
            // Exit review button
            if (exitReviewBtn) {
                exitReviewBtn.addEventListener('click', exitReviewMode);
            }
            
            // Show the final position
            goToMove(gameState.currentReviewMove);
            
            // Add global event listeners to stop continuous scrolling
            document.addEventListener('mouseup', stopContinuousScroll);
            document.addEventListener('touchend', stopContinuousScroll);
            
            console.log("Review mode controls configured successfully");
            showToast("Review mode activated.", 2000);
        } catch (error) {
            console.error("Error setting up review controls:", error);
            exitReviewMode();
            showToast("Error setting up review controls", 2000);
        }
    }, 50);
    
    // Hide the review button when in review mode
    if (reviewBtn) {
        reviewBtn.style.display = 'none';
    }
    
    // Make sure reset button works in review mode
    setupResetButton();
}

// Exit review mode
function exitReviewMode() {
    if (!gameState.isReviewMode) return;
    
    gameState.isReviewMode = false;
    
    // Update UI
    gameLogElement.classList.remove('with-review-controls');
    
    // Get the review section directly
    const reviewSection = document.getElementById('review-section');
    if (reviewSection) {
        reviewSection.style.display = 'none';
    }
    
    // Remove global event listeners
    document.removeEventListener('mouseup', stopContinuousScroll);
    document.removeEventListener('touchend', stopContinuousScroll);
    
    // Remove event listeners from review control buttons
    const prevMoveBtn = document.getElementById('prev-move-btn');
    const nextMoveBtn = document.getElementById('next-move-btn');
    const firstMoveBtn = document.getElementById('first-move-btn');
    const lastMoveBtn = document.getElementById('last-move-btn');
    const exitReviewBtn = document.getElementById('exit-review-btn');
    
    if (prevMoveBtn) {
        prevMoveBtn.removeEventListener('mousedown', startContinuousScrollBackward);
        prevMoveBtn.removeEventListener('touchstart', startContinuousScrollBackward);
        prevMoveBtn.removeEventListener('mouseup', stopContinuousScroll);
        prevMoveBtn.removeEventListener('mouseleave', stopContinuousScroll);
        prevMoveBtn.removeEventListener('touchend', stopContinuousScroll);
    }
    
    if (nextMoveBtn) {
        nextMoveBtn.removeEventListener('mousedown', startContinuousScrollForward);
        nextMoveBtn.removeEventListener('touchstart', startContinuousScrollForward);
        nextMoveBtn.removeEventListener('mouseup', stopContinuousScroll);
        nextMoveBtn.removeEventListener('mouseleave', stopContinuousScroll);
        nextMoveBtn.removeEventListener('touchend', stopContinuousScroll);
    }
    
    if (firstMoveBtn) {
        firstMoveBtn.removeEventListener('click', goToFirstMove);
    }
    
    if (lastMoveBtn) {
        lastMoveBtn.removeEventListener('click', goToLastMove);
    }
    
    if (exitReviewBtn) {
        exitReviewBtn.removeEventListener('click', exitReviewMode);
    }
    
    // Re-enable normal game controls if the game is in progress
    if (gameState.isGameStarted && !gameState.isGameOver) {
        resignBtn.disabled = false;
    } else {
        startBtn.disabled = false;
    }
    resetBtn.disabled = false;
    
    // Reset the board to current state
    if (gameState.moveHistory.length > 0) {
        goToMove(gameState.moveHistory.length - 1);
    } else {
        updateBoard();
    }
    
    // Adjust game log height for normal mode
    setTimeout(adjustGameLogHeight, 50);
    
    showToast("Exited review mode.", 2000);
    
    // Show the review button again after exiting review mode
    if (reviewBtn) {
        reviewBtn.style.display = 'inline-block';
    }
    
    // Ensure reset button works after exiting review mode
    setupResetButton();
}

// Setup the review controls with event listeners
function setupReviewControls() {
    try {
        console.log("Setting up review controls...");
        
        // Get the review section directly
        const reviewSection = document.getElementById('review-section');
        
        // Get the control buttons from the review section directly
        const prevMoveBtn = document.getElementById('prev-move-btn');
        const nextMoveBtn = document.getElementById('next-move-btn');
        const firstMoveBtn = document.getElementById('first-move-btn');
        const lastMoveBtn = document.getElementById('last-move-btn');
        const exitReviewBtn = document.getElementById('exit-review-btn');
        
        // Log the elements for debugging
        console.log("Review control elements:", {
            reviewSection,
            prevMoveBtn,
            nextMoveBtn,
            firstMoveBtn,
            lastMoveBtn,
            exitReviewBtn
        });
        
        // Check if all required buttons exist
        if (!prevMoveBtn || !nextMoveBtn || !firstMoveBtn || !lastMoveBtn) {
            console.error("One or more review control buttons not found");
            return false;
        }
        
        // Remove any existing event listeners first to avoid duplicates
        const removeAllListeners = (element, events, handler) => {
            if (element) {
                events.forEach(event => {
                    element.removeEventListener(event, handler);
                });
            }
        };
        
        // Clean up previous event listeners
        if (prevMoveBtn) {
            removeAllListeners(prevMoveBtn, ['mousedown', 'touchstart'], startContinuousScrollBackward);
            removeAllListeners(prevMoveBtn, ['mouseup', 'mouseleave', 'touchend'], stopContinuousScroll);
        }
        
        if (nextMoveBtn) {
            removeAllListeners(nextMoveBtn, ['mousedown', 'touchstart'], startContinuousScrollForward);
            removeAllListeners(nextMoveBtn, ['mouseup', 'mouseleave', 'touchend'], stopContinuousScroll);
        }
        
        if (firstMoveBtn) {
            removeAllListeners(firstMoveBtn, ['click'], goToFirstMove);
        }
        
        if (lastMoveBtn) {
            removeAllListeners(lastMoveBtn, ['click'], goToLastMove);
        }
        
        if (exitReviewBtn) {
            removeAllListeners(exitReviewBtn, ['click'], exitReviewMode);
        }
        
        // Now add event listeners
        
        // Previous move button
        prevMoveBtn.addEventListener('mousedown', startContinuousScrollBackward);
        prevMoveBtn.addEventListener('touchstart', startContinuousScrollBackward);
        prevMoveBtn.addEventListener('mouseup', stopContinuousScroll);
        prevMoveBtn.addEventListener('mouseleave', stopContinuousScroll);
        prevMoveBtn.addEventListener('touchend', stopContinuousScroll);
        
        // Next move button
        nextMoveBtn.addEventListener('mousedown', startContinuousScrollForward);
        nextMoveBtn.addEventListener('touchstart', startContinuousScrollForward);
        nextMoveBtn.addEventListener('mouseup', stopContinuousScroll);
        nextMoveBtn.addEventListener('mouseleave', stopContinuousScroll);
        nextMoveBtn.addEventListener('touchend', stopContinuousScroll);
        
        // First and last move buttons
        firstMoveBtn.addEventListener('click', goToFirstMove);
        lastMoveBtn.addEventListener('click', goToLastMove);
        
        // Exit review button
        if (exitReviewBtn) {
            exitReviewBtn.addEventListener('click', exitReviewMode);
        }
        
        console.log("Review controls setup successfully");
        return true;
    } catch (error) {
        console.error("Error setting up review controls:", error);
        return false;
    }
}

// Variables for continuous scrolling
let continuousScrollTimer = null;
const scrollSpeedInitial = 300; // Initial scroll speed in ms
const scrollSpeedFast = 75;     // Fast scroll speed in ms
let currentScrollSpeed = scrollSpeedInitial;
let continuousScrollTimeElapsed = 0;

// Start continuous scrolling backward (to earlier moves)
function startContinuousScrollBackward(event) {
    event.preventDefault();
    if (continuousScrollTimer) clearInterval(continuousScrollTimer);
    
    // First go back one move immediately
    if (gameState.currentReviewMove > 0) {
        gameState.currentReviewMove--;
        goToMove(gameState.currentReviewMove);
    }
    
    // Setup continuous scrolling with acceleration
    continuousScrollTimeElapsed = 0;
    currentScrollSpeed = scrollSpeedInitial;
    
    continuousScrollTimer = setInterval(() => {
        if (gameState.currentReviewMove > 0) {
            gameState.currentReviewMove--;
            goToMove(gameState.currentReviewMove);
            
            // Accelerate scrolling after holding for a while
            continuousScrollTimeElapsed += currentScrollSpeed;
            if (continuousScrollTimeElapsed > 1000 && currentScrollSpeed > scrollSpeedFast) {
                clearInterval(continuousScrollTimer);
                currentScrollSpeed = scrollSpeedFast;
                continuousScrollTimer = setInterval(() => {
                    if (gameState.currentReviewMove > 0) {
                        gameState.currentReviewMove--;
                        goToMove(gameState.currentReviewMove);
                    } else {
                        stopContinuousScroll();
                    }
                }, currentScrollSpeed);
            }
        } else {
            stopContinuousScroll();
        }
    }, currentScrollSpeed);
}

// Start continuous scrolling forward (to later moves)
function startContinuousScrollForward(event) {
    event.preventDefault();
    if (continuousScrollTimer) clearInterval(continuousScrollTimer);
    
    // First go forward one move immediately
    if (gameState.currentReviewMove < gameState.moveHistory.length - 1) {
        gameState.currentReviewMove++;
        goToMove(gameState.currentReviewMove);
    }
    
    // Setup continuous scrolling with acceleration
    continuousScrollTimeElapsed = 0;
    currentScrollSpeed = scrollSpeedInitial;
    
    continuousScrollTimer = setInterval(() => {
        if (gameState.currentReviewMove < gameState.moveHistory.length - 1) {
            gameState.currentReviewMove++;
            goToMove(gameState.currentReviewMove);
            
            // Accelerate scrolling after holding for a while
            continuousScrollTimeElapsed += currentScrollSpeed;
            if (continuousScrollTimeElapsed > 1000 && currentScrollSpeed > scrollSpeedFast) {
                clearInterval(continuousScrollTimer);
                currentScrollSpeed = scrollSpeedFast;
                continuousScrollTimer = setInterval(() => {
                    if (gameState.currentReviewMove < gameState.moveHistory.length - 1) {
                        gameState.currentReviewMove++;
                        goToMove(gameState.currentReviewMove);
                    } else {
                        stopContinuousScroll();
                    }
                }, currentScrollSpeed);
            }
        } else {
            stopContinuousScroll();
        }
    }, currentScrollSpeed);
}

// Stop continuous scrolling
function stopContinuousScroll() {
    if (continuousScrollTimer) {
        clearInterval(continuousScrollTimer);
        continuousScrollTimer = null;
    }
}

// Go to the first move
function goToFirstMove() {
    gameState.currentReviewMove = 0;
    goToMove(gameState.currentReviewMove);
}

// Go to the last move
function goToLastMove() {
    gameState.currentReviewMove = gameState.moveHistory.length - 1;
    goToMove(gameState.currentReviewMove);
}

// Go to a specific move in the history
function goToMove(moveIndex) {
    if (!gameState.isReviewMode || moveIndex < 0 || moveIndex >= gameState.moveHistory.length) {
        return;
    }
    
    gameState.currentReviewMove = moveIndex;
    
    // Instead of reconstructing the board from move coordinates,
    // use the stored board state directly from the move history
    const move = gameState.moveHistory[moveIndex];
    if (move && move.board) {
        gameState.board = JSON.parse(JSON.stringify(move.board));
    } else {
        console.error("Invalid move data in history at index:", moveIndex);
        return;
    }
    
    // Update the board display
    updateBoard();
    
    // Update the move counter
    updateMoveCounter();
    
    // Highlight the current move in the game log if implemented
    highlightCurrentMoveInLog(moveIndex);
}

// Update the move counter in the review section
function updateMoveCounter() {
    const moveCounter = document.getElementById('move-counter');
    if (moveCounter) {
        moveCounter.textContent = `Move ${gameState.currentReviewMove + 1}/${gameState.moveHistory.length}`;
    }
}

// Highlight the current move in the game log
function highlightCurrentMoveInLog(moveIndex) {
    // Check if gameLogElement is defined
    if (!gameLogElement) {
        console.error("Game log element not found");
        return;
    }
    
    // Remove highlight from all white and black move elements
    const allMoveElements = gameLogElement.querySelectorAll('.white-move, .black-move');
    allMoveElements.forEach(entry => entry.classList.remove('highlighted-move'));
    
    // Find the specific move element to highlight based on moveIndex
    const isWhiteMove = moveIndex % 2 === 0;
    const logEntryIndex = Math.floor(moveIndex / 2);
    
    // Get all log entries
    const logEntries = gameLogElement.querySelectorAll('.log-entry');
    
    // Make sure we have entries and the requested moveIndex is valid
    if (logEntries.length > 0 && logEntryIndex >= 0 && logEntryIndex < logEntries.length) {
        const targetEntry = logEntries[logEntryIndex];
        
        // Select either white or black move element based on moveIndex
        const targetMoveElement = isWhiteMove 
            ? targetEntry.querySelector('.white-move')
            : targetEntry.querySelector('.black-move');
        
        // Add highlight to the specific move element if it exists
        if (targetMoveElement) {
            targetMoveElement.classList.add('highlighted-move');
            
            // Scroll to make the highlighted move visible
            targetMoveElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// Save the current state to history
function saveCurrentStateToHistory() {
    gameState.boardHistory.push(JSON.parse(JSON.stringify(gameState.board)));
}

// Timer functions
function startTimer(player) {
    // Don't start the timer if it's disabled
    if (!gameState.timerEnabled) return;
    
    if (gameState.timers.activeTimer) {
        clearInterval(gameState.timers.activeTimer);
    }
    
    gameState.timers.activeTimer = setInterval(() => {
        if (gameState.timers[player] <= 0) {
            handleTimeOut(player);
            return;
        }
        
        gameState.timers[player]--;
        updateTimerDisplay(player);
    }, 1000);
}

function stopTimer(player) {
    // Don't process if timer is disabled
    if (!gameState.timerEnabled) return;
    
    if (gameState.timers.activeTimer) {
        clearInterval(gameState.timers.activeTimer);
        gameState.timers.activeTimer = null;
    }
    
    // Add increment
    gameState.timers[player] += gameState.timers.increment;
    updateTimerDisplay(player);
}

function updateTimerDisplay(player) {
    const minutes = Math.floor(gameState.timers[player] / 60);
    const seconds = gameState.timers[player] % 60;
    const displayText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    if (player === 'white') {
        whiteTimerElement.textContent = displayText;
    } else {
        blackTimerElement.textContent = displayText;
    }
}

function handleTimeOut(player) {
    // Only handle timeout if timer is enabled
    if (!gameState.timerEnabled) return;
    
    clearInterval(gameState.timers.activeTimer);
    gameState.timers.activeTimer = null;
    gameState.isGameOver = true;
    
    // Restore start button, hide resign button
    startBtn.style.display = 'inline-block';
    resignBtn.style.display = 'none';
    
    // Switch back to pregame controls
    document.getElementById('pregame-controls').style.display = 'block';
    document.getElementById('ingame-controls').style.display = 'none';
    
    const winner = player === 'white' ? 'Black' : 'White';
    showNotification(
        "Time Out",
        `${winner} wins on time!`,
        "New Game",
        "Review Game",
        startGame,
        enterReviewMode
    );
}

// Helper functions
function isOutOfBounds(row, col) {
    return row < 0 || row >= 8 || col < 0 || col >= 8;
}

function isSameTypeCell(row, col, playerColor) {
    return gameState.board[row][col] !== null && 
        gameState.board[row][col].color === playerColor;
}

// Notification system
function showNotification(title, message, primaryBtnText, secondaryBtnText, primaryAction, secondaryAction) {
    notificationTitleElement.textContent = title;
    notificationMessageElement.textContent = message;
    notificationPrimaryBtn.textContent = primaryBtnText;
    notificationSecondaryBtn.textContent = secondaryBtnText;
    
    // Use addEventListener instead of overwriting onclick
    // First, remove any existing click listeners
    notificationPrimaryBtn.onclick = null;
    notificationSecondaryBtn.onclick = null;
    
    // Add new event listeners
    notificationPrimaryBtn.addEventListener('click', function onPrimaryClick() {
        // Remove this listener to prevent duplicates
        notificationPrimaryBtn.removeEventListener('click', onPrimaryClick);
        closeNotification();
        if (primaryAction) primaryAction();
    });
    
    notificationSecondaryBtn.addEventListener('click', function onSecondaryClick() {
        // Remove this listener to prevent duplicates
        notificationSecondaryBtn.removeEventListener('click', onSecondaryClick);
        closeNotification();
        if (secondaryAction) secondaryAction();
    });
    
    notificationElement.style.display = 'block';
    overlayElement.style.display = 'block';
}

function closeNotification() {
    // Hide the notification element
    if (notificationElement) {
        notificationElement.style.display = 'none';
    }
    
    // Hide the overlay
    if (overlayElement) {
        overlayElement.style.display = 'none';
    }
    
    console.log("Notification closed");
}

// Remove these handlers as they conflict with the direct button actions
function handleNotificationPrimary() {
    closeNotification();
    // Don't automatically call startGame
}

function handleNotificationSecondary() {
    closeNotification();
    // Don't automatically call enterReviewMode
}

// Toast notification
function showToast(message, duration) {
    toastElement.textContent = message;
    toastElement.style.display = 'block';
    
    setTimeout(() => {
        toastElement.style.display = 'none';
    }, duration);
}

// Enhanced FluxAI class with improved Level 2 tactical awareness
class FluxAI {
    constructor(level = 1) {
        this.level = level;
        
        // Positional value map - center squares have higher values
        this.positionValues = [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 2, 1],
            [1, 2, 3, 3, 3, 3, 2, 1],
            [1, 2, 3, 4, 4, 3, 2, 1],
            [1, 2, 3, 4, 4, 3, 2, 1],
            [1, 2, 3, 3, 3, 3, 2, 1],
            [1, 2, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ];
        
        // Enhanced position values for Level 2 (more nuanced)
        this.enhancedPositionValues = [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 2, 3, 3, 2, 2, 1],
            [1, 2, 4, 4, 4, 4, 2, 1],
            [1, 3, 4, 5, 5, 4, 3, 1],
            [1, 3, 4, 5, 5, 4, 3, 1],
            [1, 2, 4, 4, 4, 4, 2, 1],
            [1, 2, 2, 3, 3, 2, 2, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ];
        
        // Opening moves for Level 2 AI (for black)
        this.openingMoves = [
            { row: 3, col: 3 }, // D4
            { row: 3, col: 4 }, // E4
            { row: 4, col: 3 }, // D5
            { row: 4, col: 4 }  // E5
        ];
    }

    // Main method to get the AI's move
    getMove(gameState) {
        // Get valid moves
        const validMoves = this.getValidMoves(gameState.board);
        if (!validMoves.length) return null;
        
        // Get move count to determine game phase
        const moveCount = this.getMoveCount(gameState.board);
        
        // STRICT CENTER-FIRST POLICY
        // For the first 8 moves, ONLY consider center and near-center moves
        if (moveCount < 8) {
            // Define center and near-center regions
            const isCenter = (row, col) => row >= 3 && row <= 4 && col >= 3 && col <= 4;
            const isNearCenter = (row, col) => (row >= 2 && row <= 5 && col >= 2 && col <= 5) && !isCenter(row, col);
            
            // Filter to only center and near-center moves
            const centerMoves = validMoves.filter(move => isCenter(move.row, move.col));
            const nearCenterMoves = validMoves.filter(move => isNearCenter(move.row, move.col));
            
            // If we have center moves, ONLY consider those
            if (centerMoves.length > 0) {
                // For the very first move, always take the center
                if (moveCount === 0) {
                    return centerMoves.find(move => move.row === 3 && move.col === 3) || centerMoves[0];
                }
                
                // For other opening moves, prioritize center
                return centerMoves[0];
            }
            
            // If we have near-center moves but no center moves, use those
            if (nearCenterMoves.length > 0) {
                return nearCenterMoves[0];
            }
        }
        
        // Check for winning moves
        const winningMove = this.findWinningMove(gameState, validMoves);
        if (winningMove) return winningMove;
        
        // Check for blocking moves
        const blockingMove = this.findBlockingMove(gameState, validMoves);
        if (blockingMove) return blockingMove;
        
        // Use level-specific move selection
        if (this.level === 1) {
            return this.getLevel1Move(gameState, validMoves);
        } else if (this.level === 2) {
            return this.getLevel2Move(gameState, validMoves);
        } else {
            return this.getLevel3Move(gameState, validMoves);
        }
    }
    
    // Level 1 AI move selection (basic strategy)
    getLevel1Move(gameState, validMoves) {
        // Step 1: Check for immediate nexus threats to block (highest priority)
        const nexusBlockMove = this.findNexusBlockingMove(gameState, validMoves);
        if (nexusBlockMove) return nexusBlockMove;

        // Step 2: Look for moves that complete vectors for the AI
        const vectorCompletionMove = this.findVectorCompletionMove(gameState, validMoves);
        if (vectorCompletionMove) return vectorCompletionMove;

        // Step 3: Block opponent's vectors in progress (3 in a row)
        const blockingMove = this.findBlockingMove(gameState, validMoves);
        if (blockingMove) return blockingMove;

        // Step 4: Fall back to positional play
        return this.findPositionalMove(gameState, validMoves, this.positionValues);
    }
    
    // Level 2 AI move selection with enhanced strategies
    getLevel2Move(gameState, validMoves) {
        // Opening book for the first few moves
        if (gameState.moveHistory.length <= 1) {
            const openingMove = this.getOpeningMove(gameState);
            if (openingMove) return openingMove;
        }
        
        // Step 1: Check for immediate nexus threats to block (highest priority)
        const nexusBlockMove = this.findNexusBlockingMove(gameState, validMoves);
        if (nexusBlockMove) {
            return nexusBlockMove;
        }
        
        // Step 2: CRITICAL - Check if any of our moves would create a nexus opportunity for opponent
        const dangerousMove = this.findDangerousVectorMoves(gameState, validMoves);
        if (dangerousMove.hasDangerousMoves) {
            // If all moves are dangerous, we still need to play the least dangerous one
            if (dangerousMove.safeMoves.length === 0) {
                // Return the least dangerous move
                return dangerousMove.leastDangerousMove;
            }
            // Otherwise, continue with the evaluation using only safe moves
            validMoves = dangerousMove.safeMoves;
        }
        
        // Step 3: Check for potential nexus patterns (3 nodes in a row)
        const potentialNexusBlock = this.findPotentialNexusBlockingMove(gameState, validMoves);
        if (potentialNexusBlock) {
            return potentialNexusBlock;
        }

        // Step 4: Look for moves that complete vectors for the AI
        const vectorCompletionMove = this.findVectorCompletionMove(gameState, validMoves);
        if (vectorCompletionMove) {
            // Check if this vector completion is safe (won't enable a nexus)
            if (!this.willEnableOpponentNexus(gameState, vectorCompletionMove)) {
                return vectorCompletionMove;
            }
        }
        
        // Step 5: Look for moves that set up future vectors (2-move lookahead)
        const setupMove = this.findVectorSetupMove(gameState, validMoves);
        if (setupMove) {
            return setupMove;
        }

        // Step 6: Block opponent's vectors in progress (3 in a row)
        const blockingMove = this.findBlockingMove(gameState, validMoves);
        if (blockingMove) {
            return blockingMove;
        }
        
        // Step 7: Block opponent's potential vector setups
        const blockSetupMove = this.findBlockOpponentSetupMove(gameState, validMoves);
        if (blockSetupMove) {
            return blockSetupMove;
        }

        // Step 8: Fall back to enhanced positional play
        return this.findPositionalMove(gameState, validMoves, this.enhancedPositionValues);
    }
    
    // === Start of Restored Level 2 Helper Methods ===
    
    // Get an opening move from the book (Level 2+)
    getOpeningMove(gameState) {
        const filteredMoves = this.openingMoves.filter(move => {
            // Check if the move is valid
            if (gameState.board[move.row][move.col] !== null) {
                return false;
            }
            // Check if the move would create a line too long
            if (this.wouldCreateLineTooLong(gameState.board, move.row, move.col, gameState.currentPlayer)) {
                return false;
            }
            return true;
        });
        
        if (filteredMoves.length > 0) {
            // Pick a random opening move from the valid options
            const randomIndex = Math.floor(Math.random() * filteredMoves.length);
            return filteredMoves[randomIndex];
        }
        
        return null;
    }
    
    // Find potential nexus blockers - improved to check for 3 nodes in a row (Level 2+)
    findPotentialNexusBlockingMove(gameState, validMoves) {
        const opponentColor = gameState.currentPlayer === 'white' ? 'black' : 'white';
        const filteredMoves = this.filterValidMoves(gameState, validMoves, gameState.currentPlayer);
        
        const potentialBlocks = [];
        
        // First check the board for existing node patterns
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (gameState.board[row][col] === null || 
                    gameState.board[row][col].type !== 'node' || 
                    gameState.board[row][col].color !== opponentColor) {
                    continue;
                }
                
                // For each node, check if there are 2 more nodes in any direction
                const partialNexus = this.findPartialNexus(gameState.board, row, col, opponentColor);
                if (partialNexus.found) {
                    // We found a potential nexus, now check if we can block it
                    const blockingPosition = partialNexus.blockingPosition;
                    
                    if (blockingPosition && 
                        blockingPosition.row >= 0 && blockingPosition.row < 8 &&
                        blockingPosition.col >= 0 && blockingPosition.col < 8 &&
                        gameState.board[blockingPosition.row][blockingPosition.col] === null) {
                        
                        // Check if this move is in our filtered moves
                        const blockMove = filteredMoves.find(move => 
                            move.row === blockingPosition.row && move.col === blockingPosition.col);
                        
                        if (blockMove) {
                            potentialBlocks.push({
                                move: blockMove,
                                priority: partialNexus.priority
                            });
                        }
                    }
                }
            }
        }
        
        // Sort by priority (higher is more urgent)
        potentialBlocks.sort((a, b) => b.priority - a.priority);
        
        if (potentialBlocks.length > 0) {
            return potentialBlocks[0].move;
        }
        
        return null;
    }
    
    // Improved function to find partial nexus (3 nodes in a row with an empty space)
    findPartialNexus(board, startRow, startCol, playerColor) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        for (const [dRow, dCol] of directions) {
            let nodes = [[startRow, startCol]];
            let emptyPositions = [];
            
            // Check in positive direction (up to 3 cells)
            for (let i = 1; i < 4; i++) {
                const newRow = startRow + dRow * i;
                const newCol = startCol + dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol)) {
                    break;
                }
                
                if (board[newRow][newCol] === null) {
                    // If we find an empty cell, record it as potential blocking position
                    emptyPositions.push({row: newRow, col: newCol});
                    // But continue looking, as there might be more nodes beyond
                    continue;
                } else if (board[newRow][newCol].type === 'node' && 
                           board[newRow][newCol].color === playerColor) {
                    nodes.push([newRow, newCol]);
                } else {
                    // If we hit a piece that's not a node of the right color, stop looking
                    break;
                }
            }
            
            // Check in negative direction (up to 3 cells)
            for (let i = 1; i < 4; i++) {
                const newRow = startRow - dRow * i;
                const newCol = startCol - dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol)) {
                    break;
                }
                
                if (board[newRow][newCol] === null) {
                    emptyPositions.push({row: newRow, col: newCol});
                    continue;
                } else if (board[newRow][newCol].type === 'node' && 
                           board[newRow][newCol].color === playerColor) {
                    nodes.push([newRow, newCol]);
                } else {
                    break;
                }
            }
            
            // If we found at least 3 nodes and at least one empty position, this is a critical blocking opportunity
            if (nodes.length >= 3 && emptyPositions.length > 0) {
                return { 
                    found: true, 
                    blockingPosition: emptyPositions[0],
                    priority: nodes.length * 10 + (4 - emptyPositions.length) // Higher priority for more nodes and fewer gaps
                };
            }
            
            // If we found 2 nodes and empty positions on both sides, this could be developing
            if (nodes.length === 2 && emptyPositions.length >= 2) {
                return { 
                    found: true, 
                    blockingPosition: emptyPositions[0],
                    priority: 5 // Medium priority
                };
            }
        }
        
        return { found: false, blockingPosition: null, priority: 0 };
    }
    
    // Find moves that set up future vectors (2-move lookahead)
    findVectorSetupMove(gameState, validMoves) {
        const playerColor = gameState.currentPlayer;
        const filteredMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        
        // For each potential move, simulate it and check if it creates a strong position
        const scoredSetupMoves = [];
        
        for (const move of filteredMoves) {
            // Create a copy of the board with this move
            const tempBoard = JSON.parse(JSON.stringify(gameState.board));
            tempBoard[move.row][move.col] = {
                type: 'ion',
                color: playerColor
            };
            
            // Check if this move creates 3-in-a-row (potential future vector)
            const setupScore = this.evaluateSetupStrength(tempBoard, move.row, move.col, playerColor);
            
            if (setupScore > 0) {
                scoredSetupMoves.push({
                    move: move,
                    score: setupScore
                });
            }
        }
        
        // Sort by score (descending)
        scoredSetupMoves.sort((a, b) => b.score - a.score);
        
        // Return the highest scoring setup move if any found
        if (scoredSetupMoves.length > 0) {
            return scoredSetupMoves[0].move;
        }
        
        return null;
    }
    
    // Evaluate how strong a setup move is (Level 2+)
    evaluateSetupStrength(board, row, col, playerColor) {
        let setupScore = 0;
        
        // Check all directions for potential vectors
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        for (const [dRow, dCol] of directions) {
            let count = 1; // Start with the placed piece
            let openEnds = 0; // Keep track of open ends (for future vector completion)
            
            // Check in positive direction
            let posEnd = true;
            for (let i = 1; i < 4; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol)) {
                    posEnd = false;
                    break;
                }
                
                if (board[newRow][newCol] === null) {
                    openEnds++;
                    break;
                } else if (this.isSameTypeCell(board, newRow, newCol, playerColor)) {
                    count++;
                } else {
                    posEnd = false;
                    break;
                }
            }
            
            // Check in negative direction
            let negEnd = true;
            for (let i = 1; i < 4; i++) {
                const newRow = row - dRow * i;
                const newCol = col - dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol)) {
                    negEnd = false;
                    break;
                }
                
                if (board[newRow][newCol] === null) {
                    openEnds++;
                    break;
                } else if (this.isSameTypeCell(board, newRow, newCol, playerColor)) {
                    count++;
                } else {
                    negEnd = false;
                    break;
                }
            }
            
            // Score based on count of pieces in a row and open ends
            if (count === 3 && openEnds >= 1) {
                // 3 in a row with at least one open end is a very strong setup
                setupScore += 10;
            } else if (count === 2 && openEnds === 2) {
                // 2 in a row with open ends on both sides is good
                setupScore += 5;
            } else if (count === 2 && openEnds === 1) {
                // 2 in a row with one open end is decent
                setupScore += 3;
            }
        }
        
        return setupScore;
    }
    
    // Block opponent's potential vector setups
    findBlockOpponentSetupMove(gameState, validMoves) {
        const playerColor = gameState.currentPlayer;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        const filteredMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        
        // For each potential move, check if it blocks the opponent's setup
        const blockingMoves = [];
        
        for (const move of filteredMoves) {
            // Check if this position would be a good setup move for the opponent
            // If so, we want to block it
            
            // Create a copy of the board
            const tempBoard = JSON.parse(JSON.stringify(gameState.board));
            
            // Simulate the opponent making this move
            tempBoard[move.row][move.col] = {
                type: 'ion',
                color: opponentColor
            };
            
            // Evaluate how strong this setup would be for the opponent
            const opponentSetupScore = this.evaluateSetupStrength(tempBoard, move.row, move.col, opponentColor);
            
            if (opponentSetupScore > 0) {
                blockingMoves.push({
                    move: move,
                    score: opponentSetupScore // Higher score means more important to block
                });
            }
        }
        
        // Sort by score (descending)
        blockingMoves.sort((a, b) => b.score - a.score);
        
        // Return the highest scoring blocking move if any found
        if (blockingMoves.length > 0 && blockingMoves[0].score >= 5) {
            // Only block setups with a score of 5 or higher (important threats)
            return blockingMoves[0].move;
        }
        
        return null;
    }

    // Find moves that would create dangerous vector removals
    findDangerousVectorMoves(gameState, validMoves) {
        const playerColor = gameState.currentPlayer;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        const filteredMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        
        // Track dangerous moves with a danger score
        const dangerousMoves = [];
        const safeMoves = [];
        
        for (const move of filteredMoves) {
            // Simulate making this move and check what vectors it creates
            const vectors = this.checkForVectors(gameState.board, move.row, move.col, playerColor);
            
            if (vectors.length > 0) {
                // This move would create vector(s) - check if any ions to be removed are critical blockers
                const simulatedBoard = this.simulateVectorPlacement(
                    gameState.board, 
                    move.row, 
                    move.col, 
                    vectors, 
                    playerColor
                );
                
                // Check if this new board state enables an opponent nexus
                const enablesNexus = this.enablesOpponentNexus(gameState.board, simulatedBoard, opponentColor);
                
                if (enablesNexus.enables) {
                    // This move is dangerous - add it to the list with a danger score
                    dangerousMoves.push({
                        move: move,
                        dangerScore: enablesNexus.nearCompletionCount
                    });
                } else {
                    // Safe move
                    safeMoves.push(move);
                }
            } else {
                // No vectors created, so it can't remove critical blockers
                safeMoves.push(move);
            }
        }
        
        // If we have dangerous moves, return the result structure
        if (dangerousMoves.length > 0) {
            // Sort dangerous moves by danger score (ascending)
            dangerousMoves.sort((a, b) => a.dangerScore - b.dangerScore);
            
            return {
                hasDangerousMoves: true,
                safeMoves: safeMoves,
                leastDangerousMove: dangerousMoves[0].move
            };
        }
        
        // No dangerous moves found
        return {
            hasDangerousMoves: false,
            safeMoves: filteredMoves,
            leastDangerousMove: null
        };
    }
    
    // Check if a vector completion move will enable an opponent nexus
    willEnableOpponentNexus(gameState, move) {
        const playerColor = gameState.currentPlayer;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        
        // Check what vectors would be created
        const vectors = this.checkForVectors(gameState.board, move.row, move.col, playerColor);
        
        if (vectors.length > 0) {
            // Simulate the board after this move and vector processing
            const simulatedBoard = this.simulateVectorPlacement(
                gameState.board, 
                move.row, 
                move.col, 
                vectors, 
                playerColor
            );
            
            // Check if this enables an opponent nexus
            const enablesNexus = this.enablesOpponentNexus(gameState.board, simulatedBoard, opponentColor);
            return enablesNexus.enables;
        }
        
        return false;
    }
    
    // Simulate placing a vector and processing the board
    simulateVectorPlacement(board, row, col, vectors, playerColor) {
        // Deep copy the board
        const newBoard = JSON.parse(JSON.stringify(board));
        
        // Create a node at the last placed ion
        const nodeType = this.getNodeType(vectors.length);
        newBoard[row][col] = {
            type: 'node',
            color: playerColor,
            nodeType: nodeType,
            isNode: true // Added for clarity
        };
        
        // Collect cells to remove
        const cellsToRemove = new Set();
        
        for (const vector of vectors) {
            for (const [vRow, vCol] of vector) {
                // Skip the current cell (it's already a node)
                if (vRow === row && vCol === col) continue;
                
                // Check if the cell is already a node in the new board state
                if (newBoard[vRow][vCol] === null || 
                   (newBoard[vRow][vCol].type !== 'node' && !newBoard[vRow][vCol].isNode)) {
                    cellsToRemove.add(`${vRow},${vCol}`);
                }
            }
        }
        
        // Remove non-node ions from the board
        for (const cellStr of cellsToRemove) {
            const [removeRow, removeCol] = cellStr.split(',').map(Number);
            newBoard[removeRow][removeCol] = null;
        }
        
        return newBoard;
    }
    
    // Check if new board state enables an opponent nexus
    enablesOpponentNexus(originalBoard, newBoard, opponentColor) {
        // Track cells that were cleared by the vector
        const clearedCells = [];
        
        // Find cells that were cleared (had ions before, now null)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (originalBoard[row][col] !== null && newBoard[row][col] === null) {
                    clearedCells.push({row, col});
                }
            }
        }
        
        // If no cells were cleared, there's no new nexus opportunity
        if (clearedCells.length === 0) {
            return { enables: false, nearCompletionCount: 0 };
        }
        
        // For each cleared cell, check if placing an opponent node would create a nexus
        let potentialNexusCount = 0;
        let nearCompletionCount = 0;
        
        for (const cell of clearedCells) {
             // Don't check if the cleared cell is already occupied in the new board (e.g., by the node itself)
             if (newBoard[cell.row][cell.col] !== null) continue;

            // Create a copy of the board and place an opponent node in the cleared cell
            const testBoard = JSON.parse(JSON.stringify(newBoard));
            testBoard[cell.row][cell.col] = {
                type: 'node',
                color: opponentColor,
                nodeType: 'standard', // Type doesn't matter for this test
                isNode: true
            };
            
            // Check if this creates a nexus
            if (this.checkForNexus(testBoard, cell.row, cell.col, opponentColor)) {
                potentialNexusCount++;
            } else {
                // Also check if this cell is part of a "near-completion" (3 nodes aligned)
                if (this.isCellPartOfNearCompletion(testBoard, cell.row, cell.col, opponentColor)) {
                    nearCompletionCount++;
                }
            }
        }
        
        return {
            enables: potentialNexusCount > 0,
            potentialNexusCount: potentialNexusCount,
            nearCompletionCount: nearCompletionCount
        };
    }
    
    // Check if a cell would form a "near completion" (3 nodes aligned)
    isCellPartOfNearCompletion(board, row, col, playerColor) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        // Consider the board state *as if* the node is placed at row, col
        // No need to copy, just check neighbors based on the passed board
        
        for (const [dRow, dCol] of directions) {
            let count = 1;  // Include the hypothetical node at row, col
            
            // Check in positive direction
            for (let i = 1; i < 4; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    board[newRow][newCol] === null || 
                    board[newRow][newCol].type !== 'node' || 
                    board[newRow][newCol].color !== playerColor) {
                    break;
                }
                count++;
            }
            
            // Check in negative direction
            for (let i = 1; i < 4; i++) {
                const newRow = row - dRow * i;
                const newCol = col - dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    board[newRow][newCol] === null || 
                    board[newRow][newCol].type !== 'node' || 
                    board[newRow][newCol].color !== playerColor) {
                    break;
                }
                count++;
            }
            
            // If we found 3 nodes aligned (including the hypothetical one), this is a near completion
            if (count >= 3) {
                return true;
            }
        }
        
        return false;
    }

    // Calculate bonus for proximity to friendly pieces (Level 2+)
    calculateProximityBonus(board, row, col, playerColor) {
        let bonus = 0;
        
        // Check all 8 adjacent squares
        for (let dRow = -1; dRow <= 1; dRow++) {
            for (let dCol = -1; dCol <= 1; dCol++) {
                // Skip the center square (the move itself)
                if (dRow === 0 && dCol === 0) continue;
                
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                // Check if the adjacent square is within bounds
                if (!this.isOutOfBounds(newRow, newCol)) {
                    // Add a small bonus for each adjacent friendly piece
                    if (this.isSameTypeCell(board, newRow, newCol, playerColor)) {
                        bonus += 0.5;
                        
                        // Extra bonus if the adjacent piece is a node
                        if (board[newRow][newCol].type === 'node') {
                            bonus += 0.5;
                        }
                    }
                }
            }
        }
        
        return bonus;
    }

        // Get the type of node based on number of vectors
        getNodeType(vectorCount) {
            switch (vectorCount) {
                case 1: return 'standard';
                case 2: return 'double';
                case 3: return 'triple';
                case 4: return 'quadruple';
                default: return 'standard';
            }
        }
    // === End of Restored Level 2 Helper Methods ===

    // ========================================
    // === Level 3 AI - Minimax with Alpha-Beta ===
    // ========================================
    
    getLevel3Move(gameState, validMoves) {
        console.log("AI Level 3 Thinking...");
        const startTime = performance.now();
        const timeLimit = 5500; // Allow 5.5 seconds (leaving buffer)
        let bestMove = null;
        let currentDepth = 1;
        const playerColor = gameState.currentPlayer; // AI is always black? Need to confirm this assumption.
        const opponentColor = playerColor === 'white' ? 'black' : 'white';

        // Filter moves initially
        const filteredValidMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        if (filteredValidMoves.length === 0) return null;
        
        // Fallback: If only one move, take it immediately
        if (filteredValidMoves.length === 1) return filteredValidMoves[0];

        bestMove = filteredValidMoves[0]; // Default to first valid move

        try {
            while (true) {
                const elapsedTime = performance.now() - startTime;
                if (elapsedTime > timeLimit) {
                    console.log(`Time limit reached (${elapsedTime.toFixed(0)}ms). Best move from depth ${currentDepth - 1}.`);
                    break;
                }

                console.log(`Starting search at depth ${currentDepth}...`);
                let moveFoundThisDepth = this.minimaxSearch(gameState.board, playerColor, opponentColor, currentDepth, startTime, timeLimit);

                if (moveFoundThisDepth) {
                    // Check if the found move is actually valid (sometimes edge cases might arise)
                    const isValid = filteredValidMoves.some(m => m.row === moveFoundThisDepth.row && m.col === moveFoundThisDepth.col);
                    if (isValid) {
                         bestMove = moveFoundThisDepth;
                        console.log(`Depth ${currentDepth} complete. Best move so far:`, bestMove);
                    } else {
                        console.warn(`Move found at depth ${currentDepth} is invalid, sticking with previous best.`, moveFoundThisDepth);
                        // Stick with the best move from the previous depth
                        break; 
                    }
                } else {
                    // If minimaxSearch returns null (e.g., timeout during search), break and use previous best
                    console.log(`Search aborted or no move found at depth ${currentDepth}. Using best from depth ${currentDepth - 1}.`);
                    break;
                }
                
                currentDepth++;
                 // Add a hard cap to prevent infinite loops in edge cases
                if (currentDepth > 10) { 
                    console.warn("Reached max search depth (10).");
                    break;
                }
            }
        } catch (error) {
            console.error("Error during AI search:", error);
            // Fallback to a simpler strategy or the best move found so far
            if (!bestMove) {
                 console.log("Search failed, falling back to Level 2 logic.");
                 return this.getLevel2Move(gameState, validMoves);
            }
        }

        const endTime = performance.now();
        console.log(`AI Level 3 Decision (${(endTime - startTime).toFixed(0)}ms):`, bestMove);
        return bestMove;
    }

    minimaxSearch(board, playerColor, opponentColor, maxDepth, startTime, timeLimit) {
        let bestScore = -Infinity;
        let bestMove = null;
        const validMoves = this.getValidMoves(board).filter(move => 
            !this.wouldCreateLineTooLong(board, move.row, move.col, playerColor));

        if (validMoves.length === 0) return null; // Should not happen if called correctly
        bestMove = validMoves[0]; // Initialize with a fallback

        for (const move of validMoves) {
            // Check time before processing each root move
            if (performance.now() - startTime > timeLimit) {
                 console.log("Time limit reached during root move evaluation.");
                 return bestMove; // Return best found so far at this depth
            }

            const simulatedBoard = this.makeMoveSimulation(board, move, playerColor);
            // Start minimax from opponent's perspective (minimizing player)
            let score = this.minimax(simulatedBoard, opponentColor, playerColor, 1, maxDepth, -Infinity, Infinity, false, startTime, timeLimit);
            
             // Handle potential null return from timeout during recursion
            if (score === null) { 
                console.log("Minimax returned null (timeout likely), aborting depth search.");
                return null; // Signal to iterative deepening to stop and use previous best
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    minimax(board, playerColor, opponentColor, depth, maxDepth, alpha, beta, isMaximizingPlayer, startTime, timeLimit) {
         // --- Terminal State Check --- 
         const winCheck = this.checkWinState(board); // Check for Nexus wins first
         if (winCheck.isGameOver) {
             // Ensure score is relative to the AI color (which is opponentColor in this function call context for the initial call)
             if (winCheck.winner === opponentColor) return Infinity; // AI Wins
             if (winCheck.winner === playerColor) return -Infinity; // Opponent Wins
             return 0; // Draw by Nexus (? Should not happen) or other condition
         }
         
         // --- Depth Limit Check --- 
         if (depth === maxDepth) {
             // Evaluate the board from the perspective of the AI (opponentColor here)
             return this.evaluateBoard(board, opponentColor);
         }
         
         // Time check inside recursion
        if (performance.now() - startTime > timeLimit) {
            return null; // Signal timeout
        }

        const validMoves = this.getValidMoves(board).filter(move => 
            !this.wouldCreateLineTooLong(board, move.row, move.col, playerColor));

        if (validMoves.length === 0) {
            // No moves for current player. Check node counts.
            // Note: evaluateBoard *could* handle this, but explicit check is clearer
            let aiNodes = 0;
            let humanNodes = 0;
            const aiColor = opponentColor; // The AI player's color
            for(let r=0; r<8; ++r) {
                for(let c=0; c<8; ++c) {
                    if (board[r][c] && board[r][c].type === 'node') {
                        if (board[r][c].color === aiColor) aiNodes++;
                        else humanNodes++;
                    }
                }
            }
            if (aiNodes > humanNodes) return Infinity - depth; // Win for AI (subtract depth for faster wins)
            if (humanNodes > aiNodes) return -Infinity + depth; // Loss for AI (add depth for slower losses)
            return 0; // Draw by node count
        }

        if (isMaximizingPlayer) { // AI's turn to maximize (opponentColor is AI)
            let maxEval = -Infinity;
            for (const move of validMoves) {
                const simulatedBoard = this.makeMoveSimulation(board, move, playerColor);
                let evaluation = this.minimax(simulatedBoard, opponentColor, playerColor, depth + 1, maxDepth, alpha, beta, false, startTime, timeLimit);
                if (evaluation === null) return null; // Propagate timeout signal
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) {
                    break; // Beta cut-off
                }
            }
            return maxEval;
        } else { // Minimizing player
            let minEval = Infinity;
            for (const move of validMoves) {
                const simulatedBoard = this.makeMoveSimulation(board, move, playerColor);
                let evaluation = this.minimax(simulatedBoard, opponentColor, playerColor, depth + 1, maxDepth, alpha, beta, true, startTime, timeLimit);
                 if (evaluation === null) return null; // Propagate timeout signal
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) {
                    break; // Alpha cut-off
                }
            }
            return minEval;
        }
    }
    
    // Helper to check for win state (Nexus)
    checkWinState(board) {
        // Check White Nexus
        if (this.checkForNexus(board, -1, -1, 'white')) { // Use dummy coords for general check
            return { isGameOver: true, winner: 'white' };
        }
        // Check Black Nexus
        if (this.checkForNexus(board, -1, -1, 'black')) { // Use dummy coords for general check
            return { isGameOver: true, winner: 'black' };
        }
        // TODO: Add check for no legal moves? (Handled in minimax loop)
        return { isGameOver: false, winner: null };
    }

    evaluateBoard(board, aiColor) {
        const opponentColor = aiColor === 'black' ? 'white' : 'black';
        
        // Check for immediate winning conditions
        const aiNodes = this.countNodes(board, aiColor);
        const opponentNodes = this.countNodes(board, opponentColor);
        
        // If someone has a node, that's the most important factor
        if (aiNodes > 0 && opponentNodes === 0) return 10000;
        if (opponentNodes > 0 && aiNodes === 0) return -10000;
        
        // If both have nodes, count is important
        if (aiNodes > 0 && opponentNodes > 0) {
            return (aiNodes - opponentNodes) * 1000;
        }
        
        // Evaluate center control
        const aiCenterControl = this.evaluateCenterControl(board, aiColor);
        const opponentCenterControl = this.evaluateCenterControl(board, opponentColor);
        
        // Evaluate node connectivity
        const aiConnectivity = this.evaluateNodeConnectivity(board, aiColor);
        const opponentConnectivity = this.evaluateNodeConnectivity(board, opponentColor);
        
        // Evaluate potential vectors
        const aiVectors = this.evaluatePotentialVectors(board, aiColor);
        const opponentVectors = this.evaluatePotentialVectors(board, opponentColor);
        
        // Evaluate mobility
        const aiMobility = this.evaluateMobility(board, aiColor);
        const opponentMobility = this.evaluateMobility(board, opponentColor);
        
        // Evaluate defensive structure
        const aiDefense = this.evaluateDefensiveStructure(board, aiColor);
        const opponentDefense = this.evaluateDefensiveStructure(board, opponentColor);
        
        // Evaluate node formation potential
        const aiFormationPotential = this.evaluateNodeFormationPotential(board, aiColor);
        const opponentFormationPotential = this.evaluateNodeFormationPotential(board, opponentColor);
        
        // Evaluate strategic patterns
        const aiPatterns = this.evaluateStrategicPatterns(board, aiColor);
        const opponentPatterns = this.evaluateStrategicPatterns(board, opponentColor);
        
        // Evaluate diagonal control
        const aiDiagonalControl = this.evaluateDiagonalControl(board, aiColor);
        const opponentDiagonalControl = this.evaluateDiagonalControl(board, opponentColor);
        
        // Evaluate center box control
        const aiCenterBoxControl = this.evaluateCenterBoxControl(board, aiColor);
        const opponentCenterBoxControl = this.evaluateCenterBoxControl(board, opponentColor);
        
        // Evaluate node distribution
        const aiNodeDistribution = this.evaluateNodeDistribution(board, aiColor);
        const opponentNodeDistribution = this.evaluateNodeDistribution(board, opponentColor);
        
        // Evaluate connected nodes
        const aiConnectedNodes = this.evaluateConnectedNodes(board, aiColor);
        const opponentConnectedNodes = this.evaluateConnectedNodes(board, opponentColor);
        
        // Evaluate connected ions
        const aiConnectedIons = this.evaluateConnectedIons(board, aiColor);
        const opponentConnectedIons = this.evaluateConnectedIons(board, opponentColor);
        
        // Calculate final score with adjusted weights
        let score = 0;
        
        // Center control is very important
        score += (aiCenterControl * 15);
        score -= (opponentCenterControl * 15);
        
        // Node connectivity is critical
        score += (aiConnectivity * 12);
        score -= (opponentConnectivity * 12);
        
        // Potential vectors are important
        score += (aiVectors * 10);
        score -= (opponentVectors * 10);
        
        // Mobility allows for flexibility
        score += (aiMobility * 8);
        score -= (opponentMobility * 8);
        
        // Defensive structure prevents opponent nodes
        score += (aiDefense * 10);
        score -= (opponentDefense * 10);
        
        // Node formation potential is important for future development
        score += (aiFormationPotential * 12);
        score -= (opponentFormationPotential * 12);
        
        // Strategic patterns can lead to winning positions
        score += (aiPatterns * 10);
        score -= (opponentPatterns * 10);
        
        // Diagonal control is important for vector formation
        score += (aiDiagonalControl * 8);
        score -= (opponentDiagonalControl * 8);
        
        // Center box control is important for flexibility
        score += (aiCenterBoxControl * 10);
        score -= (opponentCenterBoxControl * 10);
        
        // Node distribution affects the ability to form nodes
        score += (aiNodeDistribution * 8);
        score -= (opponentNodeDistribution * 8);
        
        // Connected nodes are more valuable than isolated ones
        score += (aiConnectedNodes * 15);
        score -= (opponentConnectedNodes * 15);
        
        // Connected ions are important for vector formation
        score += (aiConnectedIons * 10);
        score -= (opponentConnectedIons * 10);
        
        return score;
    }

    // Helper function to get all possible lines of 4 on the board
    getAllLines() {
        if (this._cachedLines) return this._cachedLines; // Cache lines for efficiency

        const lines = [];
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal \ 
            [1, -1] // Diagonal /
        ];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                for (const [dr, dc] of directions) {
                    const line = [];
                    let possible = true;
                    for (let i = 0; i < 4; i++) {
                        const nr = r + i * dr;
                        const nc = c + i * dc;
                        if (this.isOutOfBounds(nr, nc)) {
                            possible = false;
                            break;
                        }
                        line.push([nr, nc]);
                    }
                    if (possible) {
                        lines.push(line);
                    }
                }
            }
        }
        this._cachedLines = lines; // Cache the result
        return lines;
    }

    makeMoveSimulation(board, move, playerColor) {
        // Create a deep copy to avoid modifying the original board
        const newBoard = JSON.parse(JSON.stringify(board));
        
        // Basic check: Ensure the target cell is empty (should be guaranteed by validMoves, but good practice)
        if (newBoard[move.row][move.col] !== null) {
            console.error("Simulation Error: Attempting to move on occupied cell", move);
            return newBoard; // Return unchanged board on error
        }

        // --- Step 1: Place the initial ion ---
        newBoard[move.row][move.col] = { type: 'ion', color: playerColor };

        // --- Step 2: Check for vectors --- 
        // Note: checkForVectors already simulates the piece placement internally for its check
        // So we pass the *original* board state + the move coordinates.
        const vectors = this.checkForVectors(board, move.row, move.col, playerColor); 

        // --- Step 3: Process if vectors are formed --- 
        if (vectors.length > 0) {
            // It's a node
            const nodeType = this.getNodeType(vectors.length);
            newBoard[move.row][move.col] = {
                type: 'node',
                color: playerColor,
                nodeType: nodeType,
                isNode: true // Explicitly mark as node for clarity
            };

            // Collect non-node ions within the vectors for removal
            const cellsToRemove = new Set();
            for (const vector of vectors) {
                for (const [vRow, vCol] of vector) {
                    // Skip the node itself
                    if (vRow === move.row && vCol === move.col) continue;

                    // Check the state *before* node formation
                    const originalCellState = board[vRow][vCol]; 
                    // Only remove original ions, not existing nodes
                    if (originalCellState && originalCellState.type === 'ion') {
                         // Check using the *new* board state, as we place the initial ion first
                         const currentCellState = newBoard[vRow][vCol];
                         // We only remove pieces that are not already nodes
                         if (currentCellState && (!currentCellState.isNode && currentCellState.type !== 'node')) {
                            cellsToRemove.add(`${vRow},${vCol}`);
                        }
                    }
                }
            }

            // Remove the collected ions from the new board state
            for (const cellStr of cellsToRemove) {
                const [removeRow, removeCol] = cellStr.split(',').map(Number);
                newBoard[removeRow][removeCol] = null;
            }
        } 
        // --- Step 4: Return the final board state for this simulation --- 
        return newBoard;
    }

    // Adapt helper functions to work with passed board state
    getValidMoves(board) {
        const validMoves = [];
        const moveCount = this.getMoveCount(board);
        
        // STRICT CENTER-FIRST POLICY
        // During opening phase (first 8 moves), enforce strict center control
        const isOpeningPhase = moveCount < 8;
        
        // Define center and near-center regions
        const isCenter = (row, col) => row >= 3 && row <= 4 && col >= 3 && col <= 4;
        const isNearCenter = (row, col) => (row >= 2 && row <= 5 && col >= 2 && col <= 5) && !isCenter(row, col);
        const isEdge = (row, col) => row === 0 || row === 7 || col === 0 || col === 7;
        const isNearEdge = (row, col) => (row === 1 || row === 6 || col === 1 || col === 6) && !isNearCenter(row, col);
        
        // First pass: only collect center moves during opening
        if (isOpeningPhase) {
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    // Skip if cell is already occupied
                    if (board[row][col] !== null) continue;
                    
                    // During opening, ONLY allow center and near-center moves
                    if (!isCenter(row, col) && !isNearCenter(row, col)) continue;
                    
                    // Check if move would create a line that's too long
                    if (this.wouldCreateLineTooLong(board, row, col, this.color)) continue;
                    
                    validMoves.push({ row, col });
                }
            }
            
            // If we have center moves, ONLY return those
            const centerMoves = validMoves.filter(move => isCenter(move.row, move.col));
            if (centerMoves.length > 0) {
                return centerMoves;
            }
            
            // If we have near-center moves but no center moves, return those
            const nearCenterMoves = validMoves.filter(move => isNearCenter(move.row, move.col));
            if (nearCenterMoves.length > 0) {
                return nearCenterMoves;
            }
            
            // If we have no center or near-center moves, return all valid moves
            return validMoves;
        }
        
        // After opening phase, still prioritize center but allow other moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Skip if cell is already occupied
                if (board[row][col] !== null) continue;
                
                // Check if move would create a line that's too long
                if (this.wouldCreateLineTooLong(board, row, col, this.color)) continue;
                
                validMoves.push({ row, col });
            }
        }
        
        return validMoves;
    }

    // Filter moves by checking the "too long" rule
    filterValidMoves(gameState, moves, playerColor) {
        return moves.filter(move => {
            return !this.wouldCreateLineTooLong(gameState.board, move.row, move.col, playerColor);
        });
    }

    // Check if a move would create a line too long (more than 4 ions)
    wouldCreateLineTooLong(board, row, col, playerColor) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        for (const [dRow, dCol] of directions) {
            let count = 1;  // Include the new piece
            
            // Check in positive direction
            for (let i = 1; i < 5; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    !this.isSameTypeCell(board, newRow, newCol, playerColor)) {
                    break;
                }
                count++;
            }
            
            // Check in negative direction
            for (let i = 1; i < 5; i++) {
                const newRow = row - dRow * i;
                const newCol = col - dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    !this.isSameTypeCell(board, newRow, newCol, playerColor)) {
                    break;
                }
                count++;
            }
            
            // If the total count exceeds 4, it would create a line too long
            if (count > 4) {
                return true;
            }
        }
        
        return false;
    }

    // Find moves that block an opponent's potential nexus
    findNexusBlockingMove(gameState, validMoves) {
        const opponentColor = gameState.currentPlayer === 'white' ? 'black' : 'white';
        const filteredMoves = this.filterValidMoves(gameState, validMoves, gameState.currentPlayer);
        
        for (const move of filteredMoves) {
            // Temporarily place an opponent's node at this position
            const tempBoard = JSON.parse(JSON.stringify(gameState.board));
            tempBoard[move.row][move.col] = {
                type: 'node',
                color: opponentColor
            };
            
            // Check if this would form a nexus for the opponent
            if (this.checkForNexus(tempBoard, move.row, move.col, opponentColor)) {
                return move;
            }
        }
        
        return null;
    }

    // Find moves that complete a vector for the AI
    findVectorCompletionMove(gameState, validMoves) {
        const playerColor = gameState.currentPlayer;
        const filteredMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        
        for (const move of filteredMoves) {
            // Check if this move would create a vector
            const vectors = this.checkForVectors(gameState.board, move.row, move.col, playerColor);
            if (vectors.length > 0) {
                return move;
            }
        }
        
        return null;
    }

    // Find moves that block an opponent's vector in progress
    findBlockingMove(gameState, validMoves) {
        const playerColor = gameState.currentPlayer;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        const filteredMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        
        const potentialBlocks = [];
        
        for (const move of filteredMoves) {
            // Check if opponent could create a vector by playing here on their next turn
            const opponentVectors = this.checkForVectors(gameState.board, move.row, move.col, opponentColor);
            
            if (opponentVectors.length > 0) {
                // If opponent could create multiple vectors, prioritize this block
                potentialBlocks.push({
                    move: move,
                    threatLevel: opponentVectors.length
                });
            }
        }
        
        // Sort blocks by threat level (number of potential vectors blocked)
        potentialBlocks.sort((a, b) => b.threatLevel - a.threatLevel);
        
        if (potentialBlocks.length > 0) {
            return potentialBlocks[0].move;
        }
        
        return null;
    }

    // Find moves based on positional value when no tactical moves are available
    findPositionalMove(gameState, validMoves, positionValueMap) {
        const playerColor = gameState.currentPlayer;
        const filteredMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        
        if (filteredMoves.length === 0) return null;
        
        // Score moves based on position value
        const scoredMoves = filteredMoves.map(move => {
            // Basic position score
            let score = positionValueMap[move.row][move.col];
            
            // Level 2: Add proximity bonuses to existing friendly pieces
            if (this.level >= 2) {
                score += this.calculateProximityBonus(gameState.board, move.row, move.col, playerColor);
            }
            
            return {
                move: move,
                score: score
            };
        });
        
        // Sort by score (descending)
        scoredMoves.sort((a, b) => b.score - a.score);
        
        // Take one of the top moves randomly for some variety
        // Level 1: Choose from top 3
        // Level 2: Choose from top 2 (more consistent)
        const topCount = this.level >= 2 ? 2 : 3;
        const topMoves = scoredMoves.slice(0, Math.min(topCount, scoredMoves.length));
        const randomIndex = Math.floor(Math.random() * topMoves.length);
        
        return topMoves[randomIndex].move;
    }
    
    // Calculate bonus for proximity to friendly pieces (Level 2+)
    calculateProximityBonus(board, row, col, playerColor) {
        let bonus = 0;
        
        // Check all 8 adjacent squares
        for (let dRow = -1; dRow <= 1; dRow++) {
            for (let dCol = -1; dCol <= 1; dCol++) {
                // Skip the center square (the move itself)
                if (dRow === 0 && dCol === 0) continue;
                
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                // Check if the adjacent square is within bounds
                if (!this.isOutOfBounds(newRow, newCol)) {
                    // Add a small bonus for each adjacent friendly piece
                    if (this.isSameTypeCell(board, newRow, newCol, playerColor)) {
                        bonus += 0.5;
                        
                        // Extra bonus if the adjacent piece is a node
                        if (board[newRow][newCol].type === 'node') {
                            bonus += 0.5;
                        }
                    }
                }
            }
        }
        
        return bonus;
    }

    // Check for vectors (lines of exactly 4)
    checkForVectors(board, row, col, playerColor) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        const vectors = [];
        
        // Create a temporary board with the hypothetical move
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[row][col] = {
            type: 'ion',
            color: playerColor
        };
        
        for (const [dRow, dCol] of directions) {
            const vector = [[row, col]]; // Start with the placed piece
            
            // Check in positive direction
            for (let i = 1; i < 4; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    !this.isSameTypeCell(tempBoard, newRow, newCol, playerColor)) {
                    break;
                }
                vector.push([newRow, newCol]);
            }
            
            // Check in negative direction
            for (let i = 1; i < 4; i++) {
                const newRow = row - dRow * i;
                const newCol = col - dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    !this.isSameTypeCell(tempBoard, newRow, newCol, playerColor)) {
                    break;
                }
                vector.push([newRow, newCol]);
            }
            
            // If we have exactly 4 cells, we have a vector
            if (vector.length === 4) {
                vectors.push(vector);
            }
        }
        
        return vectors;
    }

    // Check for a Nexus (4 nodes in a row)
    checkForNexus(board, checkRow, checkCol, playerColor) { 
        // If checkRow/checkCol are -1, check the entire board
        if (checkRow === -1 && checkCol === -1) {
             for (let r = 0; r < 8; r++) {
                 for (let c = 0; c < 8; c++) {
                     const cell = board[r][c];
                     if (cell && cell.type === 'node' && cell.color === playerColor) {
                         // Call helper to check from this node
                         if (this.checkNexusFromCell(board, r, c, playerColor)) {
                             return true; // Found a Nexus anywhere
                         }
                     }
                 }
             }
             return false; // No Nexus found on the board
        }
        // Otherwise, check starting from the specified cell (original logic)
        return this.checkNexusFromCell(board, checkRow, checkCol, playerColor);
    }

    // Helper to check nexus starting from a specific cell
    checkNexusFromCell(board, row, col, playerColor) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
        // Ensure the starting cell is actually a node of the correct color
        // (This check might be redundant if called carefully, but adds safety)
        const startCell = board[row][col];
        if (!startCell || startCell.type !== 'node' || startCell.color !== playerColor) {
           // This case should ideally not happen if called from a valid node check,
           // but prevents errors if called with invalid start coords.
           // For the specific-cell check after a move, the initial cell IS the one just placed.
           // If called with checkRow = -1, this check prevents unnecessary checks from non-node cells.
           // Let's adjust the logic slightly for the specific cell check context.
           // If checkRow != -1, the starting cell is the one being checked
           return false; // Return early if the cell is not valid
        }
        
        for (const [dRow, dCol] of directions) {
            let count = 1; // Start with the current node
            
            // Check in positive direction
            for (let i = 1; i < 4; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    board[newRow][newCol] === null || 
                    board[newRow][newCol].type !== 'node' || 
                    board[newRow][newCol].color !== playerColor) {
                    break;
                }
                count++;
            }
            
            // Check in negative direction
            for (let i = 1; i < 4; i++) {
                const newRow = row - dRow * i;
                const newCol = col - dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    board[newRow][newCol] === null || 
                    board[newRow][newCol].type !== 'node' || 
                    board[newRow][newCol].color !== playerColor) {
                    break;
                }
                count++;
            }
            
            if (count >= 4) return true;
        }
        
        return false;
    }

    // Helper function: Check if a cell is out of bounds
    isOutOfBounds(row, col) {
        return row < 0 || row >= 8 || col < 0 || col >= 8;
    }

    // Helper function: Check if a cell contains the same type
    isSameTypeCell(board, row, col, playerColor) {
        return board[row][col] !== null && 
               (board[row][col].color === playerColor);
    }

    // Helper method to count the number of moves made so far
    getMoveCount(board) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] !== null) {
                    count++;
                }
            }
        }
        return count;
    }

    // Find a winning move if one exists
    findWinningMove(gameState, validMoves) {
        const board = gameState.board;
        const opponentColor = this.color === 'black' ? 'white' : 'black';
        
        // Check each valid move to see if it creates a winning vector
        for (const move of validMoves) {
            // Simulate the move
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[move.row][move.col] = this.color;
            
            // Check if this creates a winning vector
            const vectors = this.checkForVectors(newBoard, move.row, move.col, this.color);
            if (vectors && vectors.length > 0) {
                // Check if any of these vectors would create a node
                for (const vector of vectors) {
                    if (vector.length >= 3) {
                        return move;
                    }
                }
            }
        }
        
        return null;
    }
    
    // Find a move that blocks the opponent from winning
    findBlockingMove(gameState, validMoves) {
        const board = gameState.board;
        const opponentColor = this.color === 'black' ? 'white' : 'black';
        
        // Check each valid move to see if it blocks an opponent winning vector
        for (const move of validMoves) {
            // Simulate the move
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[move.row][move.col] = this.color;
            
            // Check if this blocks an opponent winning vector
            const opponentVectors = this.checkForVectors(board, move.row, move.col, opponentColor);
            if (opponentVectors && opponentVectors.length > 0) {
                // Check if any of these vectors would create a node for the opponent
                for (const vector of opponentVectors) {
                    if (vector.length >= 3) {
                        return move;
                    }
                }
            }
        }
        
        return null;
    }

    // Evaluate center control
    evaluateCenterControl(board, color) {
        let score = 0;
        
        // Define center and near-center regions
        const isCenter = (row, col) => row >= 3 && row <= 4 && col >= 3 && col <= 4;
        const isNearCenter = (row, col) => (row >= 2 && row <= 5 && col >= 2 && col <= 5) && !isCenter(row, col);
        
        // Count pieces in center and near-center
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] && board[row][col].color === color) {
                    if (isCenter(row, col)) {
                        score += 3; // Center pieces are worth more
                    } else if (isNearCenter(row, col)) {
                        score += 1; // Near-center pieces are worth less
                    }
                }
            }
        }
        
        return score;
    }
    
    // Evaluate node connectivity
    evaluateNodeConnectivity(board, color) {
        let score = 0;
        
        // Find all nodes of the given color
        const nodes = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] && board[row][col].color === color && board[row][col].type === 'node') {
                    nodes.push({row, col});
                }
            }
        }
        
        // If there are no nodes, return 0
        if (nodes.length === 0) return 0;
        
        // If there's only one node, it's not connected to anything
        if (nodes.length === 1) return 1;
        
        // Check connectivity between nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const node1 = nodes[i];
                const node2 = nodes[j];
                
                // Check if nodes are adjacent or connected by a line of ions
                if (this.areNodesConnected(board, node1, node2, color)) {
                    score += 2; // Connected nodes are worth more
                }
            }
        }
        
        return score + nodes.length; // Base score is the number of nodes
    }
    
    // Check if two nodes are connected
    areNodesConnected(board, node1, node2, color) {
        // Check if nodes are adjacent
        const dr = Math.abs(node1.row - node2.row);
        const dc = Math.abs(node1.col - node2.col);
        
        if (dr <= 1 && dc <= 1) return true; // Adjacent nodes
        
        // Check if nodes are connected by a line of ions
        return this.analyzeNodeConnection(board, node1, node2, dr, dc, color);
    }
    
    // Analyze connection between two nodes
    analyzeNodeConnection(board, node1, node2, dr, dc, color) {
        // Determine direction vector
        const dr_dir = node2.row > node1.row ? 1 : (node2.row < node1.row ? -1 : 0);
        const dc_dir = node2.col > node1.col ? 1 : (node2.col < node1.col ? -1 : 0);
        
        // Check if there's a continuous line of ions between the nodes
        let r = node1.row + dr_dir;
        let c = node1.col + dc_dir;
        
        while (r !== node2.row || c !== node2.col) {
            if (!board[r][c] || board[r][c].color !== color) {
                return false; // Line is broken
            }
            r += dr_dir;
            c += dc_dir;
        }
        
        return true; // Continuous line found
    }
    
    // Evaluate potential vectors
    evaluatePotentialVectors(board, color) {
        let score = 0;
        
        // Check all possible lines of 4
        const lines = this.getAllLines();
        for (const line of lines) {
            let ionCount = 0;
            let emptyCount = 0;
            
            for (const [r, c] of line) {
                if (!board[r][c]) {
                    emptyCount++;
                } else if (board[r][c].color === color) {
                    ionCount++;
                }
            }
            
            // Score based on potential to form a vector
            if (ionCount === 2 && emptyCount === 2) {
                score += 1; // Potential to form a vector
            } else if (ionCount === 3 && emptyCount === 1) {
                score += 3; // Almost a vector
            }
        }
        
        return score;
    }
    
    // Evaluate mobility (number of valid moves)
    evaluateMobility(board, color) {
        return this.getValidMoves(board).length;
    }
    
    // Evaluate defensive structure
    evaluateDefensiveStructure(board, color) {
        let score = 0;
        const opponentColor = color === 'black' ? 'white' : 'black';
        
        // Find all opponent pieces
        const opponentPieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] && board[row][col].color === opponentColor) {
                    opponentPieces.push({row, col});
                }
            }
        }
        
        // Check if our pieces are protecting against opponent vectors
        for (const piece of opponentPieces) {
            // Count how many of our pieces are adjacent to this opponent piece
            const protectingNodes = this.countProtectingNodes(board, piece.row, piece.col, color);
            score += protectingNodes;
        }
        
        return score;
    }
    
    // Count how many nodes are protecting a position
    countProtectingNodes(board, row, col, color) {
        let count = 0;
        
        // Check all 8 directions
        const directions = [
            {dr: -1, dc: 0}, {dr: 1, dc: 0}, {dr: 0, dc: -1}, {dr: 0, dc: 1},
            {dr: -1, dc: -1}, {dr: -1, dc: 1}, {dr: 1, dc: -1}, {dr: 1, dc: 1}
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            // Check if there's a node in this direction
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (board[r][c] && board[r][c].color === color && board[r][c].type === 'node') {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    // Evaluate node formation potential
    evaluateNodeFormationPotential(board, color) {
        let score = 0;
        
        // Check all possible lines of 4
        const lines = this.getAllLines();
        for (const line of lines) {
            let ionCount = 0;
            let emptyCount = 0;
            
            for (const [r, c] of line) {
                if (!board[r][c]) {
                    emptyCount++;
                } else if (board[r][c].color === color) {
                    ionCount++;
                }
            }
            
            // Score based on potential to form a node
            if (ionCount === 2 && emptyCount === 2) {
                score += 1; // Potential to form a node
            } else if (ionCount === 3 && emptyCount === 1) {
                score += 5; // Almost a node
            }
        }
        
        return score;
    }
    
    // Evaluate strategic patterns
    evaluateStrategicPatterns(board, color) {
        let score = 0;
        
        // Check for common strategic patterns
        // This is a simplified version - a more sophisticated version would check for specific patterns
        
        // Check for diagonal patterns
        score += this.evaluateDiagonalControl(board, color);
        
        // Check for center box control
        score += this.evaluateCenterBoxControl(board, color);
        
        return score;
    }
    
    // Evaluate diagonal control
    evaluateDiagonalControl(board, color) {
        let score = 0;
        
        // Check main diagonals
        for (let i = 0; i < 8; i++) {
            if (board[i][i] && board[i][i].color === color) {
                score += 1;
            }
            if (board[i][7-i] && board[i][7-i].color === color) {
                score += 1;
            }
        }
        
        return score;
    }
    
    // Evaluate center box control
    evaluateCenterBoxControl(board, color) {
        let score = 0;
        
        // Define center box (2x2 in the middle)
        const centerBox = [
            {row: 3, col: 3}, {row: 3, col: 4},
            {row: 4, col: 3}, {row: 4, col: 4}
        ];
        
        // Count pieces in center box
        for (const pos of centerBox) {
            if (board[pos.row][pos.col] && board[pos.row][pos.col].color === color) {
                score += 2;
            }
        }
        
        return score;
    }
    
    // Evaluate node distribution
    evaluateNodeDistribution(board, color) {
        let score = 0;
        
        // Find all nodes of the given color
        const nodes = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] && board[row][col].color === color && board[row][col].type === 'node') {
                    nodes.push({row, col});
                }
            }
        }
        
        // If there are no nodes, return 0
        if (nodes.length === 0) return 0;
        
        // Calculate average distance between nodes
        let totalDistance = 0;
        let count = 0;
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const node1 = nodes[i];
                const node2 = nodes[j];
                
                // Calculate Manhattan distance
                const distance = Math.abs(node1.row - node2.row) + Math.abs(node1.col - node2.col);
                totalDistance += distance;
                count++;
            }
        }
        
        // Lower average distance is better (nodes are closer together)
        const avgDistance = count > 0 ? totalDistance / count : 0;
        score = 10 - avgDistance; // Higher score for closer nodes
        
        return Math.max(0, score); // Ensure non-negative
    }
    
    // Evaluate connected nodes
    evaluateConnectedNodes(board, color) {
        let score = 0;
        
        // Find all nodes of the given color
        const nodes = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] && board[row][col].color === color && board[row][col].type === 'node') {
                    nodes.push({row, col});
                }
            }
        }
        
        // If there are no nodes, return 0
        if (nodes.length === 0) return 0;
        
        // Use flood fill to find connected components
        const visited = new Set();
        const components = [];
        
        for (const node of nodes) {
            const key = `${node.row},${node.col}`;
            if (!visited.has(key)) {
                const component = [];
                this.floodFillNodes(board, node.row, node.col, color, visited, component);
                components.push(component);
            }
        }
        
        // Score based on component sizes
        for (const component of components) {
            // Larger components are worth more
            score += component.length * component.length;
        }
        
        return score;
    }
    
    // Flood fill to find connected nodes
    floodFillNodes(board, row, col, color, visited, component) {
        const key = `${row},${col}`;
        if (visited.has(key)) return;
        
        visited.add(key);
        
        // Check if this is a node of the right color
        if (board[row][col] && board[row][col].color === color && board[row][col].type === 'node') {
            component.push({row, col});
            
            // Check all 8 directions
            const directions = [
                {dr: -1, dc: 0}, {dr: 1, dc: 0}, {dr: 0, dc: -1}, {dr: 0, dc: 1},
                {dr: -1, dc: -1}, {dr: -1, dc: 1}, {dr: 1, dc: -1}, {dr: 1, dc: 1}
            ];
            
            for (const dir of directions) {
                const newRow = row + dir.dr;
                const newCol = col + dir.dc;
                
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    this.floodFillNodes(board, newRow, newCol, color, visited, component);
                }
            }
        }
    }
    
    // Evaluate connected ions
    evaluateConnectedIons(board, color) {
        let score = 0;
        
        // Find all ions of the given color
        const ions = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] && board[row][col].color === color && board[row][col].type !== 'node') {
                    ions.push({row, col});
                }
            }
        }
        
        // If there are no ions, return 0
        if (ions.length === 0) return 0;
        
        // Check for connected ions in lines
        const lines = this.getAllLines();
        for (const line of lines) {
            let ionCount = 0;
            
            for (const [r, c] of line) {
                if (board[r][c] && board[r][c].color === color && board[r][c].type !== 'node') {
                    ionCount++;
                }
            }
            
            // Score based on connected ions
            if (ionCount >= 2) {
                score += ionCount * ionCount; // Square the count to favor longer lines
            }
        }
        
        return score;
    }
}

// Function to initialize AI with the specified level
function initializeAI() {
    const ai = new FluxAI(gameState.aiLevel);
    return ai;
}

// Function to handle AI moves with delay
function makeAIMove(gameState, ai) {
    // Simulate "thinking" with a delay of 1-3 seconds
    const thinkingTime = 1000 + Math.random() * 2000; // 1-3 seconds
    
    return new Promise(resolve => {
        setTimeout(() => {
            const move = ai.getMove(gameState);
            // Reset waitingForAI when the move is complete
            gameState.waitingForAI = false;
            resolve(move); // Returns {row, col} or null if no valid moves
        }, thinkingTime);
    });
}

// Function to integrate AI with the existing game
function integrateAI(gameState, aiPlayer = 'black') {
    // If it's AI's turn and the game is active
    if (gameState.currentPlayer === aiPlayer && 
        gameState.isGameStarted && 
        !gameState.isGameOver && 
        !gameState.isReviewMode) {
        
        const ai = initializeAI();
        
        // Make AI move after "thinking"
        makeAIMove(gameState, ai).then(move => {
            if (move) {
                // Use the existing handleCellClick function to process the move
                handleCellClick(move.row, move.col);
            }
        });
    }
}

// This function would be called after each player move to trigger AI's turn if needed
function checkForAITurn() {
    integrateAI(gameState);
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

// Create an empty board for review mode
function createEmptyBoard() {
    return Array(8).fill().map(() => Array(8).fill(null));
}

// Function to directly set up the reset button
function setupResetButton() {
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        // First remove all existing event listeners by cloning the element
        const newResetBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
        
        // Now add a simple direct event listener
        newResetBtn.addEventListener('click', function() {
            resetGame();
        });
        
        console.log("Reset button handler installed directly");
    }
}

// Function to directly set up the start button
function setupStartButton() {
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        // First remove all existing event listeners by cloning the element
        const newStartBtn = startBtn.cloneNode(true);
        startBtn.parentNode.replaceChild(newStartBtn, startBtn);
        
        // Now add a simple direct event listener
        newStartBtn.addEventListener('click', function() {
            startGame();
        });
        
        console.log("Start button handler installed directly");
    }
}

// Function to directly set up the resign button
function setupResignButton() {
    const resignBtn = document.getElementById('resign-btn');
    if (resignBtn) {
        // First remove all existing event listeners by cloning the element
        const newResignBtn = resignBtn.cloneNode(true);
        resignBtn.parentNode.replaceChild(newResignBtn, resignBtn);
        
        // Now add a simple direct event listener
        newResignBtn.addEventListener('click', function() {
            handleResign();
        });
        
        console.log("Resign button handler installed directly");
    }
}

// CORE Avatar Control
const coreAvatar = {
    element: null,
    lastNodeCount: 0,
    levelIndicator: null,
    
    init() {
        this.element = document.getElementById('core-avatar');
        // Create level indicator element
        this.levelIndicator = document.createElement('div');
        this.levelIndicator.className = 'core-level';
        if (this.element) {
            this.element.appendChild(this.levelIndicator);
        }
    },
    
    show() {
        if (this.element) {
            this.element.style.display = 'block';
            this.setDefaultState();
            // Update level indicator
            if (this.levelIndicator && gameState.aiOpponent) {
                this.levelIndicator.textContent = `CORE-${gameState.aiLevel}`;
            }
        }
    },
    
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    },
    
    setDefaultState() {
        if (!this.element) return;
        this.element.className = 'core-avatar';
        this.updateBreathingState();
    },
    
    setThinkingState() {
        if (!this.element) return;
        this.element.className = 'core-avatar thinking';
        this.updateBreathingState();
    },
    
    setReactingState() {
        if (!this.element) return;
        this.element.className = 'core-avatar reacting';
        this.updateBreathingState();
        setTimeout(() => this.setDefaultState(), 2000);
    },
    
    setWaitingState() {
        if (!this.element) return;
        this.element.className = 'core-avatar waiting';
        this.updateBreathingState();
        setTimeout(() => {
            if (this.element.classList.contains('waiting')) {
                this.setDefaultState();
            }
        }, 1500);
    },

    updateBreathingState() {
        if (!this.element || !gameState) return;

        // Remove existing state classes
        this.element.classList.remove('ahead', 'behind');

        // Get current node counts
        const aiNodes = this.countNodes(gameState.board, 'black');
        const playerNodes = this.countNodes(gameState.board, 'white');
        
        // Update breathing state based on node difference
        const nodeDifference = aiNodes - playerNodes;
        
        if (nodeDifference < -1) {
            // AI is behind by 2 or more nodes
            this.element.classList.add('behind');
        } else if (nodeDifference > 1) {
            // AI is ahead by 2 or more nodes
            this.element.classList.add('ahead');
        }
        
        this.lastNodeCount = aiNodes;
    },

    countNodes(board, color) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === color && this.isNode(board, row, col)) {
                    count++;
                }
            }
        }
        return count;
    },

    isNode(board, row, col) {
        // Check if the cell is a node by counting adjacent same-colored cells
        const color = board[row][col];
        let adjacentCount = 0;
        
        // Check all 8 directions
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                if (board[newRow][newCol] === color) {
                    adjacentCount++;
                }
            }
        }
        
        return adjacentCount >= 2;
    }
};

// Initialize CORE avatar when document loads
document.addEventListener('DOMContentLoaded', () => {
    coreAvatar.init();
});

// Modify startGame function to show/hide CORE avatar
const originalStartGame = startGame;
startGame = function() {
    originalStartGame.apply(this, arguments);
    
    // Show CORE avatar only if AI opponent is enabled
    if (gameState.aiOpponent) {
        coreAvatar.show();
    } else {
        coreAvatar.hide();
    }
};

// Modify makeAIMove to show thinking state and update breathing
const originalMakeAIMove = makeAIMove;
makeAIMove = function(gameState, ai) {
    if (coreAvatar.element) {
        coreAvatar.setThinkingState();
    }
    return originalMakeAIMove.apply(this, arguments).then(move => {
        if (coreAvatar.element) {
            coreAvatar.setDefaultState();
        }
        return move;
    });
};

// Add CORE reactions to vector formation and game end
const originalProcessVectors = processVectors;
processVectors = function(row, col) {
    const result = originalProcessVectors.apply(this, arguments);
    if (result && gameState.aiOpponent) {
        coreAvatar.setReactingState();
    }
    return result;
};

// Modify handleCellClick to show waiting state and update breathing
const originalHandleCellClick = handleCellClick;
handleCellClick = function(row, col) {
    if (gameState.aiOpponent && !gameState.waitingForAI && gameState.currentPlayer === 'white') {
        const result = originalHandleCellClick.apply(this, arguments);
        if (result && !gameState.isGameOver) {
            setTimeout(() => {
                if (!gameState.isGameOver && gameState.currentPlayer === 'black') {
                    coreAvatar.setWaitingState();
                }
            }, 3000);
        }
        return result;
    }
    return originalHandleCellClick.apply(this, arguments);
};

// Add breathing state update after each move
const originalUpdateBoard = updateBoard;
updateBoard = function() {
    originalUpdateBoard.apply(this, arguments);
    if (gameState.aiOpponent) {
        coreAvatar.updateBreathingState();
    }
};

// --- Multiplayer Setup ---
let socket = null;
let roomId = null;
let playerNumber = null;
let isMultiplayer = false;

// Save the original handleCellClick so it's available everywhere
let _originalHandleCellClick = handleCellClick;

function joinMultiplayerRoom(room) {
    if (!room) {
        showToast('Please enter a room code.', 2000);
        return;
    }
    isMultiplayer = true;
    roomId = room;
    socket = io();

    socket.emit('joinRoom', roomId);

    socket.on('playerNumber', (num) => {
        playerNumber = num;
        showToast(`You are Player ${num}`, 2000);
    });

    socket.on('playerJoined', (num) => {
        showToast(`Player ${num} joined the room!`, 2000);
    });

    socket.on('opponentMove', (move) => {
        const myColor = playerNumber === 1 ? 'white' : 'black';
        if (gameState.currentPlayer !== myColor) {
            if (gameState.board[move.row][move.col] === null) {
                _originalHandleCellClick(move.row, move.col);
            }
        }
    });

    socket.on('playerLeft', () => {
        showToast('Opponent left the game.', 3000);
    });
}
window.joinMultiplayerRoom = joinMultiplayerRoom;

if (!window._multiplayerPatched) {
    window._multiplayerPatched = true;
    handleCellClick = function(row, col) {
        if (isMultiplayer && playerNumber) {
            const myColor = playerNumber === 1 ? 'white' : 'black';
            if (gameState.currentPlayer !== myColor) {
                showToast('Wait for your turn!', 1500);
                return;
            }
        }
        // Call the original logic
        const result = _originalHandleCellClick.apply(this, arguments);
        // After a successful move, emit to server if multiplayer
        if (isMultiplayer && socket && roomId) {
            socket.emit('move', {
                roomId: roomId,
                move: { row, col }
            });
        }
        return result;
    };
}
// ... existing code ...