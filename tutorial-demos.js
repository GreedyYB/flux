// Demo setup functions
function setupBoardDemo(demoElement) {
    const board = document.createElement('div');
    board.className = 'tutorial-demo-board';
    board.style.cssText = `
        display: grid;
        grid-template-columns: repeat(8, 30px);
        grid-template-rows: repeat(8, 30px);
        gap: 1px;
        background: #bdc3c7;
        padding: 5px;
        border-radius: 5px;
        border: 2px solid #2c3e50;
    `;

    // Create the 8x8 grid
    for (let i = 0; i < 64; i++) {
        const cell = document.createElement('div');
        cell.className = 'tutorial-demo-cell';
        cell.style.cssText = `
            background: #d1e6f9;
            border-radius: 2px;
            position: relative;
            transition: background-color 0.2s;
        `;
        cell.addEventListener('mouseenter', () => {
            cell.style.backgroundColor = '#b3d4fc';
        });
        cell.addEventListener('mouseleave', () => {
            cell.style.backgroundColor = '#d1e6f9';
        });
        board.appendChild(cell);
    }

    demoElement.appendChild(board);

    // Add necessary CSS for animations if not already present
    if (!document.querySelector('#tutorial-animations')) {
        const style = document.createElement('style');
        style.id = 'tutorial-animations';
        style.textContent = `
            @keyframes ionAppear {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.2);
                    opacity: 0.7;
                }
                100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }
            
            .ion-appear {
                animation: ionAppear 0.5s ease-out forwards;
            }
            
            @keyframes ionFade {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(0.8);
                    opacity: 0;
                }
            }
            
            .ion-fade {
                animation: ionFade 0.5s ease-out forwards !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Define the sequence of moves
    const moves = [
        { color: 'white', pos: 'D5', cell: 8 * (8 - 5) + (3) },  // WD5
        { color: 'black', pos: 'F3', cell: 8 * (8 - 3) + (5) },  // BF3
        { color: 'white', pos: 'D4', cell: 8 * (8 - 4) + (3) },  // WD4
        { color: 'black', pos: 'F4', cell: 8 * (8 - 4) + (5) },  // BF4
        { color: 'white', pos: 'F5', cell: 8 * (8 - 5) + (5) },  // WF5
        { color: 'black', pos: 'E5', cell: 8 * (8 - 5) + (4) },  // BE5
        { color: 'white', pos: 'C4', cell: 8 * (8 - 4) + (2) },  // WC4
        { color: 'black', pos: 'D6', cell: 8 * (8 - 6) + (3) }   // BD6
    ];

    let currentMove = 0;
    
    function createAnimatedIon(color) {
        const ion = createTutorialIon(color);
        ion.classList.add('ion-appear');
        return ion;
    }
    
    function placeMove() {
        if (currentMove < moves.length) {
            const move = moves[currentMove];
            const ion = createAnimatedIon(move.color);
            board.children[move.cell].appendChild(ion);
            currentMove++;
            
            setTimeout(placeMove, 1000);
        } else {
            // Wait 2 seconds before fading
            setTimeout(() => {
                Array.from(board.children).forEach(cell => {
                    if (cell.firstChild) {
                        cell.firstChild.classList.add('ion-fade');
                    }
                });
                
                setTimeout(() => {
                    clearTutorialBoard(board);
                    currentMove = 0;
                    placeMove();
                }, 500);
            }, 2000);
        }
    }

    setTimeout(placeMove, 1000);
}

function setupTurnsPlacingDemo(demoElement) {
    const board = createSmallBoard();
    const turnIndicator = document.createElement('div');
    turnIndicator.textContent = "White's Turn";
    turnIndicator.style.cssText = `
        margin-bottom: 10px;
        color: white;
        font-weight: bold;
    `;
    
    demoElement.appendChild(turnIndicator);
    demoElement.appendChild(board);
    
    let currentPlayer = 'white';
    animationInterval = setInterval(() => {
        const emptyCell = findEmptyCell(board);
        if (emptyCell) {
            const ion = createIon(currentPlayer);
            emptyCell.appendChild(ion);
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
            turnIndicator.textContent = `${currentPlayer}'s Turn`;
        } else {
            clearBoard(board);
            currentPlayer = 'white';
            turnIndicator.textContent = "White's Turn";
        }
    }, 1500);
}

function setupVectorDemo(demoElement) {
    const board = createSmallBoard();
    demoElement.appendChild(board);
    
    let step = 0;
    const whiteRow = [6, 7, 8, 9];    // Second row cells
    const blackRow = [12, 13, 14, 15]; // Third row cells
    
    function createPulsingArrow() {
        const arrow = document.createElement('div');
        arrow.className = 'pulsing-arrow';
        arrow.style.cssText = `
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 15px solid #2ecc71;
            animation: pulse 1s infinite;
        `;
        return arrow;
    }

    function createAnimatedIon(color) {
        const ion = createTutorialIon(color);
        ion.classList.add('ion-appear');
        return ion;
    }

    function resetDemo() {
        step = 0;
        startSequence();
    }

    function startSequence() {
        const sequence = () => {
            if (step < 6) { // Place first three pairs of ions
                const isWhite = step % 2 === 0;
                const cellIndex = Math.floor(step / 2);
                const ion = createAnimatedIon(isWhite ? 'white' : 'black');
                board.children[isWhite ? whiteRow[cellIndex] : blackRow[cellIndex]].appendChild(ion);
                step++;
                setTimeout(sequence, 1000);
            } else if (step === 6) { // Add pulsing arrow only for white's fourth position
                const whiteArrow = createPulsingArrow();
                board.children[whiteRow[3]].appendChild(whiteArrow);
                step++;
                setTimeout(sequence, 2000);
            } else if (step === 7) { // Place final white ion and highlight
                // Remove arrow
                const fourthCell = board.children[whiteRow[3]];
                if (fourthCell.querySelector('.pulsing-arrow')) {
                    fourthCell.removeChild(fourthCell.querySelector('.pulsing-arrow'));
                }
                
                // Place final white ion
                const whiteIon = createAnimatedIon('white');
                fourthCell.appendChild(whiteIon);
                
                // Highlight only the white vector
                whiteRow.forEach(cellIndex => {
                    const cell = board.children[cellIndex];
                    cell.style.backgroundColor = 'rgba(46, 204, 113, 0.3)';
                    cell.style.boxShadow = 'inset 0 0 10px rgba(46, 204, 113, 0.5)';
                    cell.style.transition = 'all 0.5s ease';
                });
                
                step++;
                // Wait 3 seconds before fading everything
                setTimeout(() => {
                    // Fade out both ions and highlighting together
                    Array.from(board.children).forEach(cell => {
                        const ion = cell.querySelector('.tutorial-demo-ion');
                        if (ion) {
                            ion.classList.add('ion-fade');
                        }
                        cell.style.backgroundColor = '#d1e6f9';
                        cell.style.boxShadow = 'none';
                    });
                    
                    // Wait for fade animation to complete before cleanup
                    setTimeout(() => {
                        clearTutorialBoard(board);
                        resetDemo();
                    }, 500);
                }, 3000);
            }
        };
        
        // Start with 1 second delay
        setTimeout(sequence, 1000);
    }

    // Add necessary CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); opacity: 1; }
            50% { transform: translateX(-50%) scale(1.2); opacity: 0.7; }
            100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }

        @keyframes ionAppear {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.7;
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        
        .ion-appear {
            animation: ionAppear 0.5s ease-out forwards;
        }
        
        .ion-fade {
            animation: ionFade 0.5s ease-out forwards !important;
        }
        
        @keyframes ionFade {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Start the animation sequence with 1 second delay
    setTimeout(startSequence, 1000);
}

function setupNodeDemo(demoElement) {
    const board = createSmallBoard();
    demoElement.appendChild(board);
    
    let step = 0;
    const moves = [
        { color: 'white', pos: [1, 1] },
        { color: 'black', pos: [2, 1] },
        { color: 'white', pos: [1, 2] },
        { color: 'black', pos: [2, 2] },
        { color: 'white', pos: [1, 3] },
        { color: 'black', pos: [2, 3] },
        { color: 'white', pos: [1, 4] }  // Final move that creates the vector
    ];
    
    function createPulsingArrow() {
        const arrow = document.createElement('div');
        arrow.className = 'pulsing-arrow';
        arrow.style.cssText = `
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 15px solid #2ecc71;
            animation: pulse 1s infinite;
        `;
        return arrow;
    }

    function createAnimatedIon(color, isNode = false) {
        const ion = createTutorialIon(color);
        if (isNode) {
            ion.classList.add('node');
        }
        ion.classList.add('ion-appear');
        return ion;
    }
    
    function placeNextMove() {
        if (step < moves.length) {
            const move = moves[step];
            const [row, col] = move.pos;
            const index = row * 6 + col;
            const cell = board.children[index];
            
            if (cell) {
                if (step === moves.length - 1) {
                    // Show arrow for final move
                    const arrow = createPulsingArrow();
                    cell.appendChild(arrow);
                    setTimeout(() => {
                        cell.removeChild(arrow);
                        const ion = createAnimatedIon('white', true);
                        cell.appendChild(ion);
                        
                        // Highlight the vector and create node
                        for (let i = 1; i <= 4; i++) {
                            const vectorCell = board.children[1 * 6 + i];
                            vectorCell.style.backgroundColor = 'rgba(46, 204, 113, 0.3)';
                            vectorCell.style.boxShadow = 'inset 0 0 10px rgba(46, 204, 113, 0.5)';
                            vectorCell.style.transition = 'all 0.3s ease';
                            
                            if (i < 4) {
                                const whiteIon = vectorCell.querySelector('.tutorial-demo-ion');
                                if (whiteIon) {
                                    whiteIon.classList.add('ion-fade');
                                }
                            }
                        }
                        
                        // Wait 3 seconds, then fade everything
                        setTimeout(() => {
                            // Fade out all remaining ions (black ions and node)
                            Array.from(board.children).forEach(cell => {
                                const ion = cell.querySelector('.tutorial-demo-ion');
                                if (ion) {
                                    ion.classList.add('ion-fade');
                                }
                                cell.style.backgroundColor = '#d1e6f9';
                                cell.style.boxShadow = 'none';
                            });
                            
                            // Wait for fade animation to complete before cleanup and restart
                            setTimeout(() => {
                                clearTutorialBoard(board);
                                step = 0;
                                setTimeout(placeNextMove, 1000); // 1 second delay before restart
                            }, 500);
                        }, 3000);
                    }, 1000);
                } else {
                    const ion = createAnimatedIon(move.color);
                    cell.appendChild(ion);
                    step++;
                    setTimeout(placeNextMove, 1000);
                }
            }
        }
    }
    
    // Add necessary CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); opacity: 1; }
            50% { transform: translateX(-50%) scale(1.2); opacity: 0.7; }
            100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }

        @keyframes ionAppear {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.7;
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        
        .ion-appear {
            animation: ionAppear 0.5s ease-out forwards;
        }
        
        .ion-fade {
            animation: ionFade 0.5s ease-out forwards !important;
        }
        
        @keyframes ionFade {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Start with 1 second delay
    setTimeout(placeNextMove, 1000);
}

function setupLongLineDemo(demoElement) {
    const board = createSmallBoard();
    demoElement.appendChild(board);
    
    let step = 0;
    const moves = [
        { pos: [1, 0] },  // Column 6
        { pos: [1, 1] },  // Column 7
        { pos: [1, 3] },  // Column 9
        { pos: [1, 4] }   // Column 10
    ];
    
    function createPulsingArrow() {
        const arrow = document.createElement('div');
        arrow.className = 'pulsing-arrow';
        arrow.style.cssText = `
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 15px solid #2ecc71;
            animation: pulse 1s infinite;
            transition: opacity 0.3s ease;
        `;
        return arrow;
    }

    function createAnimatedIon(color) {
        const ion = createTutorialIon(color);
        ion.classList.add('ion-appear');
        return ion;
    }
    
    function placeNextMove() {
        if (step < moves.length) {
            const move = moves[step];
            const [row, col] = move.pos;
            const index = row * 6 + col;
            const cell = board.children[index];
            
            if (cell) {
                const ion = createAnimatedIon('white');
                cell.appendChild(ion);
                
                if (step === moves.length - 1) {
                    // Wait 1 second after last ion before showing arrow
                    setTimeout(() => {
                        const invalidCell = board.children[1 * 6 + 2]; // Column 8
                        const arrow = createPulsingArrow();
                        invalidCell.appendChild(arrow);
                        
                        // After 1 second, show red X
                        setTimeout(() => {
                            invalidCell.style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
                            invalidCell.style.boxShadow = 'inset 0 0 10px rgba(231, 76, 60, 0.5)';
                            invalidCell.style.transition = 'all 0.3s ease';
                            
                            const x = document.createElement('div');
                            x.textContent = '✕';
                            x.style.cssText = `
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                color: #e74c3c;
                                font-size: 24px;
                                font-weight: bold;
                                z-index: 2;
                                transition: opacity 0.3s ease;
                            `;
                            invalidCell.appendChild(x);
                            
                            // After 3 seconds, fade everything together
                            setTimeout(() => {
                                // Start fade animations
                                arrow.style.opacity = '0';
                                x.style.opacity = '0';
                                invalidCell.style.backgroundColor = '#d1e6f9';
                                invalidCell.style.boxShadow = 'none';
                                
                                // Fade ions
                                Array.from(board.children).forEach(cell => {
                                    const ion = cell.querySelector('.tutorial-demo-ion');
                                    if (ion) {
                                        ion.classList.add('ion-fade');
                                    }
                                });
                                
                                // Reset after fade animation completes
                                setTimeout(() => {
                                    clearTutorialBoard(board);
                                    step = 0;
                                    setTimeout(placeNextMove, 1000); // 1 second delay before restart
                                }, 500);
                            }, 3000);
                        }, 1000);
                    }, 1000);
                } else {
                    step++;
                    setTimeout(placeNextMove, 1000);
                }
            }
        }
    }
    
    // Add necessary CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); opacity: 1; }
            50% { transform: translateX(-50%) scale(1.2); opacity: 0.7; }
            100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }

        @keyframes ionAppear {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.7;
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        
        .ion-appear {
            animation: ionAppear 0.5s ease-out forwards;
        }
        
        .ion-fade {
            animation: ionFade 0.5s ease-out forwards !important;
        }
        
        @keyframes ionFade {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Start with 1 second delay
    setTimeout(placeNextMove, 1000);
}

function setupNexusDemo(demoElement) {
    const board = createSmallBoard();
    demoElement.appendChild(board);
    
    const initialNodes = [
        { pos: [1, 1] },  // Column 7
        { pos: [1, 2] },  // Column 8
        { pos: [1, 4] }   // Column 10
    ];
    const finalNode = { pos: [1, 3] };  // Column 9
    
    function createPulsingArrow() {
        const arrow = document.createElement('div');
        arrow.className = 'pulsing-arrow';
        arrow.style.cssText = `
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 15px solid #2ecc71;
            animation: pulse 1s infinite;
        `;
        return arrow;
    }
    
    function createNodeWithAnimation(color) {
        const ion = createTutorialIon(color);
        ion.classList.add('node');
        ion.classList.add('node-appear');
        return ion;
    }
    
    function startSequence() {
        // Place first three nodes together with animation
        initialNodes.forEach(move => {
            const [row, col] = move.pos;
            const index = row * 6 + col;
            const cell = board.children[index];
            if (cell) {
                const ion = createNodeWithAnimation('white');
                cell.appendChild(ion);
            }
        });
        
        // After 1 second, show arrow at final position
        setTimeout(() => {
            const finalCell = board.children[1 * 6 + 3]; // Column 9
            const arrow = createPulsingArrow();
            finalCell.appendChild(arrow);
            
            // After 2 seconds, remove arrow and place final node
            setTimeout(() => {
                finalCell.removeChild(arrow);
                const ion = createNodeWithAnimation('white');
                finalCell.appendChild(ion);
                
                // Highlight nexus
                for (let i = 1; i <= 4; i++) {
                    const nexusCell = board.children[1 * 6 + i];
                    nexusCell.style.animation = 'nexus-pulse 2s infinite ease-in-out';
                }
                
                // After 3 seconds, fade everything
                setTimeout(() => {
                    // Remove nexus animation and start fade-out
                    Array.from(board.children).forEach(cell => {
                        cell.style.animation = 'none';
                        cell.style.transition = 'all 0.5s ease';
                        cell.style.backgroundColor = '#d1e6f9';
                        cell.style.boxShadow = 'none';
                        
                        const ion = cell.querySelector('.tutorial-demo-ion');
                        if (ion) {
                            ion.classList.add('node-fade');
                        }
                    });
                    
                    // Reset after fade animation completes
                    setTimeout(() => {
                        clearTutorialBoard(board);
                        setTimeout(startSequence, 1000); // 1 second delay before restart
                    }, 500);
                }, 3000);
            }, 2000);
        }, 1000);
    }
    
    // Add necessary CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); opacity: 1; }
            50% { transform: translateX(-50%) scale(1.2); opacity: 0.7; }
            100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        
        @keyframes nexus-pulse {
            0% { 
                box-shadow: inset 0 0 10px 2px rgba(212, 175, 55, 0.4);
                background-color: rgba(212, 175, 55, 0.2);
            }
            50% { 
                box-shadow: inset 0 0 20px 5px rgba(212, 175, 55, 0.7);
                background-color: rgba(212, 175, 55, 0.4);
            }
            100% { 
                box-shadow: inset 0 0 10px 2px rgba(212, 175, 55, 0.4);
                background-color: rgba(212, 175, 55, 0.2);
            }
        }
        
        @keyframes nodeAppear {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.7;
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        
        .node-appear {
            animation: nodeAppear 0.5s ease-out forwards;
        }
        
        .node-fade {
            animation: nodeFade 0.5s ease-out forwards !important;
        }
        
        @keyframes nodeFade {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
            }
        }
        
        .tutorial-demo-ion.node-appear {
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
    
    // Start with 1 second delay
    setTimeout(startSequence, 1000);
}

// Helper functions
function createSmallBoard() {
    const board = document.createElement('div');
    board.className = 'tutorial-demo-board';
    board.style.gridTemplateColumns = 'repeat(6, 40px)';
    board.style.gridTemplateRows = 'repeat(4, 40px)';

    for (let i = 0; i < 24; i++) {
        const cell = document.createElement('div');
        cell.className = 'tutorial-demo-cell';
        cell.dataset.row = Math.floor(i / 6);
        cell.dataset.col = i % 6;
        board.appendChild(cell);
    }
    return board;
}

function createIon(color) {
    const ion = document.createElement('div');
    ion.className = `tutorial-demo-ion ${color}`;
    ion.style.cssText = `
        position: absolute;
        width: 80%;
        height: 80%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        transition: all 0.3s ease;
        ${color === 'white' 
            ? 'background: #ecf0f1; border: 2px solid #2c3e50; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);'
            : 'background: #2c3e50; border: 2px solid #1a252f; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);'
        }
    `;
    return ion;
}

function highlightTutorialNexus(board, cells) {
    if (!board || !cells || !Array.isArray(cells)) return;
    
    // Clear existing highlights first
    Array.from(board.children).forEach(cell => {
        cell.style.backgroundColor = '#d1e6f9';
        cell.style.boxShadow = 'none';
    });
    
    // Add new highlights
    cells.forEach(([row, col]) => {
        const index = row * 6 + col;
        const cell = board.children[index];
        if (cell) {
            cell.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
            cell.style.boxShadow = 'inset 0 0 10px rgba(255, 215, 0, 0.5)';
        }
    });
}

function findEmptyCell(board) {
    if (!board) return null;
    const emptyCells = Array.from(board.children).filter(cell => !cell.hasChildNodes());
    return emptyCells.length > 0 ? emptyCells[0] : null;
}

function clearBoard(board) {
    if (!board) return;
    Array.from(board.children).forEach(cell => {
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
        cell.style.backgroundColor = '#d1e6f9';
        cell.style.boxShadow = 'none';
    });
}

function createTutorialIon(color) {
    const ion = document.createElement('div');
    ion.className = `tutorial-demo-ion ${color}`;
    ion.style.cssText = `
        position: absolute;
        width: 80%;
        height: 80%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        transition: all 0.3s ease;
        ${color === 'white' 
            ? 'background: #ecf0f1; border: 2px solid #2c3e50; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);'
            : 'background: #2c3e50; border: 2px solid #1a252f; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);'
        }
    `;
    return ion;
}

function clearTutorialBoard(board) {
    if (!board || !board.classList.contains('tutorial-demo-board')) return;
    Array.from(board.children).forEach(cell => {
        if (cell.classList.contains('tutorial-demo-cell')) {
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }
            cell.style.backgroundColor = '#d1e6f9';
            cell.style.boxShadow = 'none';
        }
    });
}

// Add tutorial-specific styles
const tutorialStyles = document.createElement('style');
tutorialStyles.textContent = `
    .tutorial-demo-ion {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        transition: transform 0.3s ease;
    }

    .tutorial-demo-ion.tutorial-shrink {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        transition: transform 0.5s ease, opacity 0.5s ease;
    }

    .tutorial-demo-ion.node::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        background-color: #e74c3c;
        border-radius: 50%;
        z-index: 2;
    }
`;
document.head.appendChild(tutorialStyles);

function resetDemo() {
    const demoContainer = document.getElementById('tutorial-demo');
    if (!demoContainer) return;
    
    // Only clear tutorial-specific elements
    const board = demoContainer.querySelector('.tutorial-demo-board');
    if (board) {
        const cells = board.querySelectorAll('.tutorial-demo-cell');
        cells.forEach(cell => {
            cell.style.backgroundColor = '#d1e6f9';
            cell.style.boxShadow = 'none';
            // Remove any tutorial ions
            const ion = cell.querySelector('.tutorial-demo-ion');
            if (ion) ion.remove();
        });
    }
}

function highlightNexus(cells) {
    cells.forEach(([row, col]) => {
        const nexusCell = document.querySelector(`.tutorial-demo-cell[data-row="${row}"][data-col="${col}"]`);
        if (nexusCell) {
            // Just store the nexus state without visual effects
            nexusCell.dataset.nexus = 'true';
        }
    });
} 