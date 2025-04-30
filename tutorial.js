// Global tutorial state
let currentStep = 0;
let tutorialActive = false;
let animationInterval = null; // Track animation intervals for continuous animations

// Tutorial steps configuration
const tutorialSteps = [
    {
        title: "Basic Gameplay",
        message: "Flux is played on an 8×8 board.<br>Players alternate turns,<br>white moves first, then black,<br>placing ions on empty cells.",
        highlight: "#game-board",
        demo: "board"
    },
    {
        title: "Building Vectors",
        message: "Your first tactical step is to create <b>Vectors</b>:<br>Vectors are lines of exactly 4 ions of your color,<br>horizontal, vertical, or diagonal.",
        highlight: null,
        demo: "vector"
    },
    {
        title: "Nodes",
        message: "When a Vector is formed, the last ion placed becomes a <b>Node</b> (with a red mark) and remains on the board while all other (non-<b>Node</b>) ions in the Vector are removed.",
        highlight: null,
        demo: "node"
    },
    {
        title: "No Long Lines",
        message: "You cannot place an ion that would create a line longer than 4 ions of your color.",
        highlight: null,
        demo: "long-line"
    },
    {
        title: "The Winning Goal",
        message: "Win by forming a <b>Nexus</b>:<br>A <b>Nexus</b> is a line of 4 Nodes of one color!",
        highlight: null,
        demo: "nexus"
    },
    {
        title: "Alternative Win",
        message: "<b>No legal moves:</b><br>If at any time either player is unable to play a legal move, the game ends and the player with the most Nodes wins.<br><br><b>Timer expiry:</b><br>If players have chosen to play using a timer, the game will end immediately if one player runs out of time, and the opponent will be awarded the win.<br><br><b>Resignation:</b><br>A player may choose to resign a game at any point and this will award the win to their opponent.",
        highlight: null,
        demo: null
    },
    {
        title: "Ready to Play!",
        message: "You have two options - play against a human opponent or try your luck against our resident AI <b>CORE</b> (Cognitive, Operational Reasoning Engine).<br><br>You can play with a timer or without.<br>Choose from a 3-minute game or up to an hour on the clock.<br>You can even choose increments from 2 to 10 seconds which add time to your clock after every move.<br>Once you run out of time, it's game over.<br><br>Is it better to build your own Vectors or block your opponent?<br>Will you go for a Nexus or fill the board and see who ends up with the most Nodes?<br>The options are endless.<br><br>That's all you need to know!<br>Click 'Start' and enjoy playing Flux!",
        highlight: "#start-btn",
        demo: null
    }
];

// Initialize the tutorial system
function initTutorial() {
    const tutorialBtn = document.getElementById('tutorial-btn');
    const tutorialPopup = document.getElementById('tutorial-popup');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    const closeBtn = document.getElementById('tutorial-close-btn');
    const overlay = document.getElementById('overlay');
    const tutorialContent = document.getElementById('tutorial-content');
    const tutorialDemo = document.getElementById('tutorial-demo');

    if (!tutorialBtn || !tutorialPopup || !prevBtn || !nextBtn || !closeBtn || !overlay || !tutorialContent || !tutorialDemo) {
        console.error('Tutorial elements not found. Initialization failed.');
        return;
    }

    // Reset tutorial state
    tutorialPopup.style.display = 'none';
    overlay.style.display = 'none';
    tutorialActive = false;
    currentStep = 0;

    // Remove any existing event listeners
    const newTutorialBtn = tutorialBtn.cloneNode(true);
    tutorialBtn.parentNode.replaceChild(newTutorialBtn, tutorialBtn);
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    // Add event listeners
    newTutorialBtn.addEventListener('click', startTutorial);
    newPrevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            showCurrentStep();
        }
    });
    newNextBtn.addEventListener('click', () => {
        if (currentStep < tutorialSteps.length - 1) {
            currentStep++;
            showCurrentStep();
        } else {
            closeTutorial();
        }
    });
    newCloseBtn.addEventListener('click', closeTutorial);
}

// Start the tutorial
function startTutorial() {
    const tutorialPopup = document.getElementById('tutorial-popup');
    const overlay = document.getElementById('overlay');
    const tutorialDemo = document.getElementById('tutorial-demo');
    
    if (!tutorialPopup || !overlay || !tutorialDemo) {
        console.error('Tutorial elements not found');
        return;
    }
    
    // Clean up any existing tutorial state
    cleanupDemo();
    clearHighlights();
    
    // Reset tutorial state
    currentStep = 0;
    tutorialActive = true;
    
    // Show tutorial
    tutorialPopup.style.display = 'flex';
    overlay.style.display = 'block';
    
    showCurrentStep();
}

// Close the tutorial
function closeTutorial() {
    const tutorialPopup = document.getElementById('tutorial-popup');
    const overlay = document.getElementById('overlay');
    
    if (!tutorialPopup || !overlay) {
        console.error('Tutorial elements not found');
        return;
    }
    
    // Clean up
    cleanupDemo();
    clearHighlights();
    
    // Reset state
    tutorialActive = false;
    currentStep = 0;
    
    // Hide tutorial
    tutorialPopup.style.display = 'none';
    overlay.style.display = 'none';
}

// Clean up any running demos
function cleanupDemo() {
    // Clear any animation intervals
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    
    // Clear demo container
    const tutorialDemo = document.getElementById('tutorial-demo');
    if (tutorialDemo) {
        while (tutorialDemo.firstChild) {
            tutorialDemo.removeChild(tutorialDemo.firstChild);
        }
    }
    
    // Remove any highlights
    clearHighlights();
}

// Clear all tutorial highlights
function clearHighlights() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });
}

// Show the current tutorial step
function showCurrentStep() {
    if (!tutorialActive) return;

    const tutorialContent = document.getElementById('tutorial-content');
    const tutorialTitle = document.getElementById('tutorial-title');
    const tutorialMessage = document.getElementById('tutorial-message');
    const tutorialDemo = document.getElementById('tutorial-demo');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');
    
    if (!tutorialContent || !tutorialTitle || !tutorialMessage || !tutorialDemo || !prevBtn || !nextBtn) {
        console.error('Required tutorial elements not found');
        closeTutorial();
        return;
    }

    try {
        // Clean up previous demo
        cleanupDemo();

        // Update navigation buttons
        prevBtn.style.visibility = currentStep > 0 ? 'visible' : 'hidden';
        nextBtn.style.visibility = currentStep < tutorialSteps.length - 1 ? 'visible' : 'hidden';
        nextBtn.textContent = currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next';

        const step = tutorialSteps[currentStep];
        if (!step) {
            throw new Error(`Tutorial step ${currentStep} not found`);
        }

        // Update content
        tutorialTitle.textContent = step.title;
        tutorialMessage.innerHTML = step.message;

        // Setup demo if one exists for this step
        if (step.demo) {
            setupDemo(step.demo);
        }

        // Add highlights if specified
        if (step.highlight) {
            const element = document.querySelector(step.highlight);
            if (element) {
                element.classList.add('tutorial-highlight');
            }
        }
    } catch (error) {
        console.error('Error showing tutorial step:', error);
        closeTutorial();
    }
}

// Ensure DOM is fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTutorial);
} else {
    initTutorial();
}

// Setup the appropriate demo for the current step
function setupDemo(demoId) {
    try {
        const demoContainer = document.getElementById('tutorial-demo');
        if (!demoContainer) {
            throw new Error('Demo container not found');
        }

        // Clear any existing demo
        cleanupDemo();

        switch (demoId) {
            case 'board':
                setupBoardDemo(demoContainer);
                break;
            case 'turns-placing':
                setupTurnsPlacingDemo(demoContainer);
                break;
            case 'vector':
                setupVectorDemo(demoContainer);
                break;
            case 'node':
                setupNodeDemo(demoContainer);
                break;
            case 'long-line':
                setupLongLineDemo(demoContainer);
                break;
            case 'nexus':
                setupNexusDemo(demoContainer);
                break;
            default:
                console.warn(`Unknown demo ID: ${demoId}`);
                return;
        }
    } catch (error) {
        console.error('Error setting up demo:', error);
        cleanupDemo();
    }
}

function setupIonPlacementDemo(container) {
    try {
        const board = createDemoBoard(3, 3);
        container.appendChild(board);

        animationInterval = setInterval(() => {
            const emptyCell = findEmptyCell(board);
            if (emptyCell) {
                const ion = createIon('white');
                emptyCell.appendChild(ion);
                ion.classList.add('new-ion');
                setTimeout(() => ion.remove(), 2000);
            }
        }, 3000);
    } catch (error) {
        console.error('Error in ion placement demo:', error);
        cleanupDemo();
    }
}

function setupVectorCreationDemo(container) {
    try {
        const board = createDemoBoard(4, 4);
        container.appendChild(board);

        let step = 0;
        animationInterval = setInterval(() => {
            try {
                switch (step % 3) {
                    case 0:
                        placeIon(board, 1, 1, 'white');
                        break;
                    case 1:
                        placeIon(board, 1, 2, 'white');
                        createVector(board, 1, 1, 1, 2);
                        break;
                    case 2:
                        clearBoard(board);
                        break;
                }
                step++;
            } catch (error) {
                console.error('Error in vector demo animation step:', error);
                cleanupDemo();
            }
        }, 2000);
    } catch (error) {
        console.error('Error in vector creation demo:', error);
        cleanupDemo();
    }
}

function setupNexusFormationDemo(container) {
    try {
        const board = createDemoBoard(5, 5);
        container.appendChild(board);

        let step = 0;
        animationInterval = setInterval(() => {
            try {
                switch (step % 4) {
                    case 0:
                        placeIon(board, 2, 2, 'white');
                        break;
                    case 1:
                        placeIon(board, 2, 3, 'white');
                        createVector(board, 2, 2, 2, 3);
                        break;
                    case 2:
                        placeIon(board, 3, 2, 'white');
                        createVector(board, 2, 2, 3, 2);
                        highlightNexus(board, [[2, 2], [2, 3], [3, 2]]);
                        break;
                    case 3:
                        clearBoard(board);
                        break;
                }
                step++;
            } catch (error) {
                console.error('Error in nexus demo animation step:', error);
                cleanupDemo();
            }
        }, 2500);
    } catch (error) {
        console.error('Error in nexus formation demo:', error);
        cleanupDemo();
    }
} 