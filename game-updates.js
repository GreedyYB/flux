// Function to update game information display
function updateGameInfo() {
    // Update scores
    const whiteScoreDisplay = document.getElementById('white-score-display');
    const blackScoreDisplay = document.getElementById('black-score-display');
    
    if (whiteScoreDisplay && window.state) {
        whiteScoreDisplay.textContent = window.state.whiteScore;
    }
    
    if (blackScoreDisplay && window.state) {
        blackScoreDisplay.textContent = window.state.blackScore;
    }
    
    // Update current turn
    const currentTurnElement = document.getElementById('current-turn');
    if (currentTurnElement && window.state) {
        const currentPlayer = window.state.currentPlayer;
        currentTurnElement.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} to move`;
        
        // Highlight current player
        document.querySelector('.white-player').classList.toggle('active-player', currentPlayer === 'white');
        document.querySelector('.black-player').classList.toggle('active-player', currentPlayer === 'black');
    }
    
    // Update game mode
    const gameModeDisplay = document.getElementById('game-mode-display');
    if (gameModeDisplay) {
        const gameMode = document.getElementById('game-mode')?.value || 'human';
        const aiDifficulty = document.getElementById('ai-difficulty')?.value || '3';
        
        let modeText = "Playing Locally";
        if (gameMode === 'ai') {
            modeText = `Playing vs AI (Level ${aiDifficulty})`;
        } else if (gameMode === 'multiplayer') {
            modeText = "Playing Online";
        }
        
        gameModeDisplay.textContent = modeText;
    }
}

// Call this function periodically to update game info
setInterval(updateGameInfo, 500);

// Game mode selection functionality
document.addEventListener('DOMContentLoaded', function() {
    // Show game mode overlay when clicking New Game
    const newGameBtn = document.getElementById('new-game-btn');
    const gameModeOverlay = document.getElementById('game-mode-overlay');
    
    if (newGameBtn && gameModeOverlay) {
        newGameBtn.addEventListener('click', function() {
            gameModeOverlay.classList.add('active');
        });
    }
    
    // Mode option selection
    const modeOptions = document.querySelectorAll('.mode-option');
    modeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            modeOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            const mode = this.getAttribute('data-mode');
            
            // Show/hide AI options based on selection
            const aiOptions = document.getElementById('ai-options');
            if (aiOptions) {
                aiOptions.style.display = mode === 'ai' ? 'block' : 'none';
            }
            
            // Show/hide color selection for AI and multiplayer modes
            const colorSelection = document.getElementById('color-selection');
            if (colorSelection) {
                colorSelection.style.display = (mode === 'ai' || mode === 'multiplayer') ? 'block' : 'none';
            }
        });
    });
    
    // Difficulty button selection
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            difficultyBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Color button selection
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            colorBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Start Game button
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            // Get selected mode
            const selectedMode = document.querySelector('.mode-option.selected');
            if (!selectedMode) return;
            
            const mode = selectedMode.getAttribute('data-mode');
            
            // Get selected difficulty for AI mode
            let difficulty = '3';
            if (mode === 'ai') {
                const selectedDifficulty = document.querySelector('.difficulty-btn.selected');
                if (selectedDifficulty) {
                    difficulty = selectedDifficulty.getAttribute('data-difficulty');
                }
            }
            
            // Get selected color for AI or multiplayer mode
            let color = 'white';
            if (mode === 'ai' || mode === 'multiplayer') {
                const selectedColor = document.querySelector('.color-btn.selected');
                if (selectedColor) {
                    color = selectedColor.getAttribute('data-color');
                }
            }
            
            // Set game mode and options
            const gameModeSelect = document.getElementById('game-mode');
            const aiDifficultySelect = document.getElementById('ai-difficulty');
            const playWhiteRadio = document.getElementById('play-white');
            const playBlackRadio = document.getElementById('play-black');
            
            if (gameModeSelect) gameModeSelect.value = mode;
            if (aiDifficultySelect) aiDifficultySelect.value = difficulty;
            
            if (playWhiteRadio && playBlackRadio) {
                if (color === 'white') {
                    playWhiteRadio.checked = true;
                } else {
                    playBlackRadio.checked = true;
                }
            }
            
            // Close the overlay
            gameModeOverlay.classList.remove('active');
            
            // Start the game
            if (typeof window.resetGame === 'function') {
                window.resetGame();
            }
            
            // If multiplayer, initialize connection
            if (mode === 'multiplayer' && window.multiplayer && typeof window.multiplayer.initialize === 'function') {
                window.multiplayer.initialize();
            }
            
            // Trigger game start
            if (typeof window.startGame === 'function') {
                window.startGame();
            } else {
                // Fallback if startGame function is not available
                document.body.classList.add('game-started');
                
                // Start AI game if needed
                if (mode === 'ai' && typeof window.gameLoop === 'function') {
                    window.gameLoop();
                }
            }
        });
    }
    
    // Cancel button
    const cancelModeBtn = document.getElementById('cancel-mode-btn');
    if (cancelModeBtn && gameModeOverlay) {
        cancelModeBtn.addEventListener('click', function() {
            gameModeOverlay.classList.remove('active');
        });
    }
});