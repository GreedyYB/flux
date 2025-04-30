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
        
        // Enhanced position values for Level 2 & 3 (more nuanced)
        this.enhancedPositionValues = [
            [0, 0, 0, 0, 0, 0, 0, 0],  // Edge rows have 0 value
            [0, 1, 2, 3, 3, 2, 1, 0],
            [0, 2, 4, 5, 5, 4, 2, 0],
            [0, 3, 5, 6, 6, 5, 3, 0],
            [0, 3, 5, 6, 6, 5, 3, 0],
            [0, 2, 4, 5, 5, 4, 2, 0],
            [0, 1, 2, 3, 3, 2, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]   // Edge rows have 0 value
        ];
        
        // Opening moves for Level 2+ AI (for black)
        this.openingMoves = [
            { row: 3, col: 3 }, // D4 - Center
            { row: 3, col: 4 }, // E4 - Center
            { row: 4, col: 3 }, // D5 - Center
            { row: 4, col: 4 }, // E5 - Center
            { row: 2, col: 3 }, // C4 - Near center
            { row: 2, col: 4 }, // C5 - Near center
            { row: 5, col: 3 }, // F4 - Near center
            { row: 5, col: 4 }  // F5 - Near center
        ];

        // Level 3 specific weights for evaluation
        this.level3Weights = {
            NODE_WEIGHT: 100,
            NEXUS_THREAT_3_AI: 150,      // Increased from 75
            NEXUS_THREAT_3_OPP: -200,    // Increased from -100
            NEXUS_THREAT_2_AI: 30,       // Increased from 10
            NEXUS_THREAT_2_OPP: -45,     // Increased from -15
            VECTOR_THREAT_AI: 40,        // Increased from 20
            VECTOR_THREAT_OPP: -50,      // Increased from -25
            POSITIONAL_WEIGHT: 2,        // Increased from 1
            MOBILITY_WEIGHT: 15,         // New weight for mobility
            CONTROL_WEIGHT: 25,          // New weight for board control
            DEFENSIVE_STRUCTURE: 20,     // New weight for defensive formations
            CONNECTIVITY_WEIGHT: 10      // New weight for piece connectivity
        };
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
    
    // Level 3 AI move selection with minimax search
    getLevel3Move(gameState, validMoves) {
        const playerColor = gameState.currentPlayer;
        const gamePhase = this.getGamePhase(gameState);
        
        // First, check for immediate winning moves (highest priority)
        const winningMove = this.findWinningMove(gameState, validMoves);
        if (winningMove) {
            return winningMove;
        }

        // In opening phase, prioritize center control and strategic positioning
        if (gamePhase === 'opening') {
            const openingMove = this.getStrategicOpeningMove(gameState, validMoves);
            if (openingMove) {
                return openingMove;
            }
        }

        // Dynamic time management based on game phase and board state
        const startTime = Date.now();
        const baseTimeLimit = 10000; // 10 seconds base time
        const timeLimit = this.calculateTimeLimit(gameState, baseTimeLimit);
        let bestMove = null;
        let bestScore = -Infinity;
        
        // Initialize transposition table and history table
        this.transpositionTable = new Map();
        this.historyTable = new Map();
        
        // Iterative deepening with dynamic depth
        const maxDepth = this.calculateMaxDepth(gameState);
        for (let depth = 2; depth <= maxDepth; depth++) {
            if (Date.now() - startTime > timeLimit) break;
            
            let alpha = -Infinity;
            let beta = Infinity;
            let bestMoveAtDepth = null;
            let bestScoreAtDepth = -Infinity;
            
            // Enhanced move ordering with history heuristic
            const sortedMoves = this.orderMovesWithHistory(gameState, validMoves, playerColor);
            
            for (const move of sortedMoves) {
                // Simulate the move
                const newState = this.simulateMove(gameState, move, playerColor);
                
                // Get score from minimax search with quiescence
                const score = this.minimaxWithQuiescence(newState, depth - 1, alpha, beta, false, playerColor, startTime, timeLimit);
                
                if (score > bestScoreAtDepth) {
                    bestScoreAtDepth = score;
                    bestMoveAtDepth = move;
                }
                alpha = Math.max(alpha, score);
                
                // Update history table
                this.updateHistoryTable(move, depth, score);
                
                // Store evaluation in transposition table
                this.transpositionTable.set(this.getBoardHash(newState.board), {
                    score: score,
                    depth: depth,
                    move: move
                });
                
                // Time check
                if (Date.now() - startTime > timeLimit) break;
            }
            
            // Update best move if we completed this depth
            if (Date.now() - startTime <= timeLimit) {
                bestMove = bestMoveAtDepth;
                bestScore = bestScoreAtDepth;
            }
        }
        
        return bestMove || this.getLevel2Move(gameState, validMoves);
    }

    calculateTimeLimit(gameState, baseTimeLimit) {
        const gamePhase = this.getGamePhase(gameState);
        const moveCount = gameState.moveCount || 0;
        
        // Adjust time based on game phase
        let timeMultiplier = 1.0;
        if (gamePhase === 'opening') {
            timeMultiplier = 1.2; // More time in opening
        } else if (gamePhase === 'endgame') {
            timeMultiplier = 0.8; // Less time in endgame
        }
        
        // Adjust time based on move count
        if (moveCount < 10) {
            timeMultiplier *= 1.3; // More time in early game
        } else if (moveCount > 30) {
            timeMultiplier *= 0.7; // Less time in late game
        }
        
        return Math.floor(baseTimeLimit * timeMultiplier);
    }

    calculateMaxDepth(gameState) {
        const gamePhase = this.getGamePhase(gameState);
        const moveCount = gameState.moveCount || 0;
        
        // Base depth
        let maxDepth = 6;
        
        // Adjust depth based on game phase
        if (gamePhase === 'opening') {
            maxDepth = 5; // Shallow search in opening
        } else if (gamePhase === 'middlegame') {
            maxDepth = 7; // Deeper search in middlegame
        } else if (gamePhase === 'endgame') {
            maxDepth = 8; // Deepest search in endgame
        }
        
        // Adjust depth based on move count
        if (moveCount < 10) {
            maxDepth = Math.min(maxDepth, 5); // Shallow search in early game
        } else if (moveCount > 30) {
            maxDepth = Math.min(maxDepth, 9); // Deeper search in late game
        }
        
        return maxDepth;
    }

    orderMovesWithHistory(gameState, moves, playerColor) {
        // Get basic move ordering
        const orderedMoves = this.orderMoves(gameState, moves, playerColor);
        
        // Add history heuristic
        return orderedMoves.sort((a, b) => {
            const scoreA = this.getHistoryScore(a, playerColor);
            const scoreB = this.getHistoryScore(b, playerColor);
            return scoreB - scoreA;
        });
    }

    getHistoryScore(move, playerColor) {
        const key = `${playerColor}-${move.row}-${move.col}`;
        return this.historyTable.get(key) || 0;
    }

    updateHistoryTable(move, depth, score) {
        const key = `${move.playerColor}-${move.row}-${move.col}`;
        const currentScore = this.historyTable.get(key) || 0;
        const newScore = currentScore + (depth * depth * score);
        this.historyTable.set(key, newScore);
    }

    minimaxWithQuiescence(gameState, depth, alpha, beta, isMaximizing, aiColor, startTime, timeLimit) {
        // Check time limit
        if (Date.now() - startTime > timeLimit) {
            return this.evaluatePosition(gameState, aiColor);
        }
        
        // Base cases
        if (depth === 0) {
            // If in quiescence search or position is quiet, evaluate
            if (this.isPositionQuiet(gameState) || depth < -2) {
                return this.evaluatePosition(gameState, aiColor);
            }
            // Otherwise, continue quiescence search
            return this.quiescenceSearch(gameState, alpha, beta, isMaximizing, aiColor, startTime, timeLimit);
        }
        
        if (this.isGameOver(gameState)) {
            return this.evaluatePosition(gameState, aiColor);
        }
        
        const validMoves = this.getValidMoves(gameState.board);
        if (validMoves.length === 0) {
            return this.evaluatePosition(gameState, aiColor);
        }
        
        // Sort moves for better pruning
        const sortedMoves = this.orderMovesWithHistory(gameState, validMoves, gameState.currentPlayer);
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of sortedMoves) {
                const newState = this.simulateMove(gameState, move, gameState.currentPlayer);
                const evaluation = this.minimaxWithQuiescence(newState, depth - 1, alpha, beta, false, aiColor, startTime, timeLimit);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of sortedMoves) {
                const newState = this.simulateMove(gameState, move, gameState.currentPlayer);
                const evaluation = this.minimaxWithQuiescence(newState, depth - 1, alpha, beta, true, aiColor, startTime, timeLimit);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    quiescenceSearch(gameState, alpha, beta, isMaximizing, aiColor, startTime, timeLimit) {
        // Get only tactical moves (moves that create or block vectors)
        const tacticalMoves = this.getTacticalMoves(gameState);
        
        if (tacticalMoves.length === 0) {
            return this.evaluatePosition(gameState, aiColor);
        }
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of tacticalMoves) {
                const newState = this.simulateMove(gameState, move, gameState.currentPlayer);
                const evaluation = this.minimaxWithQuiescence(newState, -1, alpha, beta, false, aiColor, startTime, timeLimit);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of tacticalMoves) {
                const newState = this.simulateMove(gameState, move, gameState.currentPlayer);
                const evaluation = this.minimaxWithQuiescence(newState, -1, alpha, beta, true, aiColor, startTime, timeLimit);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    isPositionQuiet(gameState) {
        // A position is considered quiet if there are no immediate tactical opportunities
        const tacticalMoves = this.getTacticalMoves(gameState);
        return tacticalMoves.length === 0;
    }

    getTacticalMoves(gameState) {
        const validMoves = this.getValidMoves(gameState.board);
        return validMoves.filter(move => {
            // Check if move creates or blocks a vector
            return this.wouldCreateVector(gameState, move) || 
                   this.wouldBlockVector(gameState, move) ||
                   this.wouldCreateNode(gameState, move) ||
                   this.wouldBlockNode(gameState, move);
        });
    }

    // Minimax with alpha-beta pruning
    minimax(gameState, depth, alpha, beta, isMaximizing, aiColor, startTime, timeLimit) {
        // Check time limit
        if (Date.now() - startTime > timeLimit) {
            return this.evaluatePosition(gameState, aiColor);
        }
        
        // Base cases
        if (depth === 0 || this.isGameOver(gameState)) {
            return this.evaluatePosition(gameState, aiColor);
        }
        
        const validMoves = this.getValidMoves(gameState.board);
        if (validMoves.length === 0) {
            return this.evaluatePosition(gameState, aiColor);
        }
        
        // Sort moves for better pruning
        const sortedMoves = this.orderMoves(gameState, validMoves, gameState.currentPlayer);
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of sortedMoves) {
                const newState = this.simulateMove(gameState, move, gameState.currentPlayer);
                const evaluation = this.minimax(newState, depth - 1, alpha, beta, false, aiColor, startTime, timeLimit);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of sortedMoves) {
                const newState = this.simulateMove(gameState, move, gameState.currentPlayer);
                const evaluation = this.minimax(newState, depth - 1, alpha, beta, true, aiColor, startTime, timeLimit);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }
    
    // Move ordering for better alpha-beta pruning
    orderMoves(gameState, moves, playerColor) {
        return moves.sort((a, b) => {
            const scoreA = this.getQuickMoveScore(gameState, a, playerColor);
            const scoreB = this.getQuickMoveScore(gameState, b, playerColor);
            return scoreB - scoreA;
        });
    }
    
    // Quick move scoring for move ordering
    getQuickMoveScore(gameState, move, playerColor) {
        let score = 0;
        
        // Check transposition table
        const simState = this.simulateMove(gameState, move, playerColor);
        const hash = this.getBoardHash(simState.board);
        if (this.transpositionTable.has(hash)) {
            score += this.transpositionTable.get(hash);
        }
        
        // Immediate vector formation (highest priority)
        const vectors = this.checkForVectors(gameState.board, move.row, move.col, playerColor);
        score += vectors.length * 1000;
        
        // Block opponent vector
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        const blocksVector = this.checkForVectors(gameState.board, move.row, move.col, opponentColor);
        score += blocksVector.length * 800;
        
        // Node connection potential
        if (this.isNearExistingNode(gameState.board, move, playerColor)) {
            score += 500;
        }
        
        // Center control (weighted by distance)
        const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
        score += (7 - centerDistance) * 50;
        
        return score;
    }
    
    // Get board hash for transposition table
    getBoardHash(board) {
        return board.map(row => 
            row.map(cell => 
                cell === null ? '0' : 
                `${cell.type[0]}${cell.color[0]}`
            ).join('')
        ).join('|');
    }
    
    // Simulate a move and return new game state
    simulateMove(gameState, move, playerColor) {
        const newState = {
            board: JSON.parse(JSON.stringify(gameState.board)),
            currentPlayer: playerColor === 'white' ? 'black' : 'white',
            moveHistory: [...gameState.moveHistory],
            isGameOver: false
        };
        
        // Place the piece
        newState.board[move.row][move.col] = {
            type: 'ion',
            color: playerColor
        };
        
        // Check for vectors and update board
        const vectors = this.checkForVectors(newState.board, move.row, move.col, playerColor);
        if (vectors.length > 0) {
            // Convert last placed piece to node
            newState.board[move.row][move.col] = {
                type: 'node',
                color: playerColor,
                nodeType: this.getNodeType(vectors.length)
            };
            
            // Remove other pieces in vectors (except nodes)
            for (const vector of vectors) {
                for (const [vRow, vCol] of vector) {
                    if (vRow === move.row && vCol === move.col) continue;
                    if (newState.board[vRow][vCol]?.type !== 'node') {
                        newState.board[vRow][vCol] = null;
                    }
                }
            }
        }
        
        return newState;
    }
    
    // Enhanced position evaluation
    evaluatePosition(gameState, aiColor) {
        const board = gameState.board;
        const opponentColor = aiColor === 'black' ? 'white' : 'black';
        
        // Base evaluation components
        let score = 0;
        
        // 1. Node evaluation (existing)
        score += this.evaluateNodes(board, aiColor) * 2;
        score -= this.evaluateNodes(board, opponentColor) * 2;
        
        // 2. Vector evaluation (existing)
        score += this.evaluatePotentialVectors(board, aiColor) * 1.5;
        score -= this.evaluatePotentialVectors(board, opponentColor) * 1.5;
        
        // 3. Center control (existing)
        score += this.evaluateControl(board, aiColor) * 1.2;
        score -= this.evaluateControl(board, opponentColor) * 1.2;
        
        // 4. Mobility evaluation (existing)
        score += this.evaluateMobility(board, aiColor) * 0.8;
        score -= this.evaluateMobility(board, opponentColor) * 0.8;
        
        // 5. Node connectivity (existing)
        score += this.evaluateNodeConnectivity(board, aiColor) * 1.5;
        score -= this.evaluateNodeConnectivity(board, opponentColor) * 1.5;
        
        // New evaluation components
        
        // 6. Pattern recognition
        score += this.evaluatePatterns(board, aiColor) * 2;
        score -= this.evaluatePatterns(board, opponentColor) * 2;
        
        // 7. Strategic formations
        score += this.evaluateStrategicFormations(board, aiColor) * 1.8;
        score -= this.evaluateStrategicFormations(board, opponentColor) * 1.8;
        
        // 8. Node protection
        score += this.evaluateNodeProtection(board, aiColor) * 1.3;
        score -= this.evaluateNodeProtection(board, opponentColor) * 1.3;
        
        // 9. Vector threats
        score += this.evaluateVectorThreats(board, aiColor) * 1.6;
        score -= this.evaluateVectorThreats(board, opponentColor) * 1.6;
        
        // 10. Position flexibility
        score += this.evaluatePositionFlexibility(board, aiColor) * 0.9;
        score -= this.evaluatePositionFlexibility(board, opponentColor) * 0.9;
        
        return score;
    }
    
    // Helper evaluation functions
    evaluateNodes(board, color) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    score += 1;
                    // Bonus for central nodes
                    score += (4 - Math.abs(r - 3.5) - Math.abs(c - 3.5)) * 0.2;
                }
            }
        }
        return score;
    }
    
    evaluateControl(board, color) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    // Control value decreases with distance from center
                    score += (4 - Math.abs(r - 3.5) - Math.abs(c - 3.5)) * 0.3;
                }
            }
        }
        return score;
    }
    
    evaluatePotentialVectors(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        let count = 1;
                        let gaps = 0;
                        
                        // Look in both directions
                        for (let i = 1; i <= 3; i++) {
                            const pos1 = this.checkCell(board, r + dr * i, c + dc * i, color);
                            const pos2 = this.checkCell(board, r - dr * i, c - dc * i, color);
                            
                            if (pos1 === 'same') count++;
                            else if (pos1 === 'empty') gaps++;
                            
                            if (pos2 === 'same') count++;
                            else if (pos2 === 'empty') gaps++;
                        }
                        
                        // Score based on piece count and gaps
                        if (count >= 2 && gaps <= 2) {
                            score += count * (4 - gaps);
                        }
                    }
                }
            }
        }
        return score;
    }
    
    checkCell(board, r, c, color) {
        if (this.isOutOfBounds(r, c)) return 'invalid';
        if (board[r][c] === null) return 'empty';
        return board[r][c].color === color ? 'same' : 'different';
    }
    
    evaluateMobility(board, color) {
        let mobility = 0;
        const moves = this.getValidMoves(board);
        
        for (const move of moves) {
            if (!this.wouldCreateLineTooLong(board, move.row, move.col, color)) {
                mobility++;
            }
        }
        
        return mobility;
    }
    
    evaluateNodeConnectivity(board, color) {
        let score = 0;
        const nodes = [];
        
        // Collect all nodes
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    nodes.push({row: r, col: c});
                }
            }
        }
        
        // Evaluate distances between nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = Math.abs(nodes[i].row - nodes[j].row) + 
                           Math.abs(nodes[i].col - nodes[j].col);
                           
                // Nodes closer together are better
                if (dist <= 4) {
                    score += (5 - dist);
                }
            }
        }
        
        return score;
    }
    
    isGameOver(gameState) {
        // Check for nexus
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (gameState.board[r][c]?.type === 'node') {
                    if (this.checkForNexus(gameState.board, r, c, gameState.board[r][c].color)) {
                        return true;
                    }
                }
            }
        }
        
        // Check for no valid moves
        return this.getValidMoves(gameState.board).length === 0;
    }
    
    hasWon(gameState, color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (gameState.board[r][c]?.type === 'node' && 
                    gameState.board[r][c]?.color === color) {
                    if (this.checkForNexus(gameState.board, r, c, color)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    countNodes(board, color) {
        let count = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    count++;
                }
            }
        }
        return count;
    }

    // New method to specifically look for winning moves
    findWinningMove(gameState, validMoves) {
        const playerColor = gameState.currentPlayer;
        const filteredMoves = this.filterValidMoves(gameState, validMoves, playerColor);
        
        // Count existing nodes
        let nodePositions = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (gameState.board[r][c]?.type === 'node' && 
                    gameState.board[r][c]?.color === playerColor) {
                    nodePositions.push({row: r, col: c});
                }
            }
        }

        // If we have 3 or more nodes, check each valid move to see if it completes a nexus
        if (nodePositions.length >= 3) {
            for (const move of filteredMoves) {
                // Create a temporary board with this move as a node
                const tempBoard = JSON.parse(JSON.stringify(gameState.board));
                tempBoard[move.row][move.col] = {
                    type: 'node',
                    color: playerColor
                };
                
                // Check if this creates a nexus
                if (this.checkForNexus(tempBoard, move.row, move.col, playerColor)) {
                    return move;
                }
                
                // Also check from each existing node's perspective
                for (const node of nodePositions) {
                    if (this.checkForNexus(tempBoard, node.row, node.col, playerColor)) {
                        return move;
                    }
                }
            }
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
            nodeType: nodeType
        };
        
        // Collect cells to remove
        const cellsToRemove = new Set();
        
        for (const vector of vectors) {
            for (const [vRow, vCol] of vector) {
                // Skip the current cell (it's already a node)
                if (vRow === row && vCol === col) continue;
                
                // Check if the cell is already a node
                if (newBoard[vRow][vCol] === null || 
                    newBoard[vRow][vCol].type !== 'node') {
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
            // Create a copy of the board and place an opponent node in the cleared cell
            const testBoard = JSON.parse(JSON.stringify(newBoard));
            testBoard[cell.row][cell.col] = {
                type: 'node',
                color: opponentColor,
                nodeType: 'standard' // Type doesn't matter for this test
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
        
        // Place a temporary node at this position
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[row][col] = {
            type: 'node',
            color: playerColor
        };
        
        for (const [dRow, dCol] of directions) {
            let count = 1;  // Include the placed node
            
            // Check in positive direction
            for (let i = 1; i < 4; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    tempBoard[newRow][newCol] === null || 
                    tempBoard[newRow][newCol].type !== 'node' || 
                    tempBoard[newRow][newCol].color !== playerColor) {
                    break;
                }
                count++;
            }
            
            // Check in negative direction
            for (let i = 1; i < 4; i++) {
                const newRow = row - dRow * i;
                const newCol = col - dCol * i;
                
                if (this.isOutOfBounds(newRow, newCol) || 
                    tempBoard[newRow][newCol] === null || 
                    tempBoard[newRow][newCol].type !== 'node' || 
                    tempBoard[newRow][newCol].color !== playerColor) {
                    break;
                }
                count++;
            }
            
            // If we found 3 nodes aligned, this is a near completion
            if (count >= 3) {
                return true;
            }
        }
        
        return false;
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
    
    // Helper methods for AI decision-making
    
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
    
    // Find moves that set up future vectors (Level 2+)
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
    
    // More AI helper methods
    
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
    
    // Block opponent's potential vector setups (Level 2+)
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

    // Core game functions used by the AI
    
    // Get all valid moves on the current board
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
                    
                    // Check if this move would lead to an edge node in the future
                    if (this.wouldLeadToEdgeNode(board, row, col, this.color)) continue;
                    
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
                
                // Check if this move would lead to an edge node in the future
                if (this.wouldLeadToEdgeNode(board, row, col, this.color)) continue;
                
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
    checkForNexus(board, row, col, playerColor) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [1, -1]   // diagonal down-left
        ];
        
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

    evaluateBoard(board, aiColor) {
        let score = 0;
        const opponentColor = aiColor === 'white' ? 'black' : 'white';
        const WIN_SCORE = 1000000;

        // Check for immediate win/loss
        const winCheck = this.checkWinState(board);
        if (winCheck.isGameOver) {
            if (winCheck.winner === aiColor) return WIN_SCORE;
            if (winCheck.winner === opponentColor) return -WIN_SCORE;
            return 0;
        }

        const weights = this.level3Weights;
        
        // Material and Basic Position Evaluation
        let aiNodes = 0;
        let opponentNodes = 0;
        let aiPositionalScore = 0;
        let opponentPositionalScore = 0;
        let aiMobilityScore = 0;
        let opponentMobilityScore = 0;
        
        // Board Analysis
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = board[r][c];
                if (cell) {
                    if (cell.color === aiColor) {
                        if (cell.type === 'node') {
                            aiNodes++;
                            // Calculate mobility and control for AI pieces
                            aiMobilityScore += this.calculateMobility(board, r, c, aiColor);
                            aiPositionalScore += this.enhancedPositionValues[r][c];
                        }
                    } else {
                        if (cell.type === 'node') {
                            opponentNodes++;
                            // Calculate mobility and control for opponent pieces
                            opponentMobilityScore += this.calculateMobility(board, r, c, opponentColor);
                            opponentPositionalScore += this.enhancedPositionValues[r][c];
                        }
                    }
                }
            }
        }

        // Material and Position Score
        score += (aiNodes - opponentNodes) * weights.NODE_WEIGHT;
        score += (aiPositionalScore - opponentPositionalScore) * weights.POSITIONAL_WEIGHT;
        
        // Mobility Score
        score += (aiMobilityScore - opponentMobilityScore) * weights.MOBILITY_WEIGHT;

        // Defensive Structure Evaluation
        const aiDefensiveScore = this.evaluateDefensiveStructure(board, aiColor);
        const oppDefensiveScore = this.evaluateDefensiveStructure(board, opponentColor);
        score += (aiDefensiveScore - oppDefensiveScore) * weights.DEFENSIVE_STRUCTURE;

        // Connectivity Evaluation
        const aiConnectivity = this.evaluateConnectivity(board, aiColor);
        const oppConnectivity = this.evaluateConnectivity(board, opponentColor);
        score += (aiConnectivity - oppConnectivity) * weights.CONNECTIVITY_WEIGHT;

        // Threat Analysis
        const lines = this.getAllLines();
        for (const line of lines) {
            const threatAnalysis = this.analyzeLine(board, line, aiColor);
            
            // Apply threat scores
            if (threatAnalysis.aiNexusThreat3) score += weights.NEXUS_THREAT_3_AI;
            if (threatAnalysis.oppNexusThreat3) score += weights.NEXUS_THREAT_3_OPP;
            if (threatAnalysis.aiNexusThreat2) score += weights.NEXUS_THREAT_2_AI;
            if (threatAnalysis.oppNexusThreat2) score += weights.NEXUS_THREAT_2_OPP;
            if (threatAnalysis.aiVectorThreat) score += weights.VECTOR_THREAT_AI;
            if (threatAnalysis.oppVectorThreat) score += weights.VECTOR_THREAT_OPP;
        }

        return score;
    }

    // New helper methods for enhanced evaluation

    calculateMobility(board, row, col, color) {
        let mobility = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1], [-1,0], [0,-1], [-1,-1], [-1,1]];
        
        for (const [dr, dc] of directions) {
            for (let dist = 1; dist <= 3; dist++) {
                const newRow = row + dr * dist;
                const newCol = col + dc * dist;
                
                if (this.isOutOfBounds(newRow, newCol)) break;
                if (board[newRow][newCol] === null) mobility++;
                else break;
            }
        }
        
        return mobility;
    }

    evaluateDefensiveStructure(board, color) {
        let score = 0;
        
        // Check for defensive formations (nodes protecting each other)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    // Check for nearby friendly nodes
                    const protectedBy = this.countProtectingNodes(board, r, c, color);
                    score += protectedBy * 5;  // More protection = better defense
                }
            }
        }
        
        return score;
    }

    countProtectingNodes(board, row, col, color) {
        let count = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1], [-1,0], [0,-1], [-1,-1], [-1,1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (!this.isOutOfBounds(newRow, newCol) && 
                board[newRow][newCol]?.type === 'node' && 
                board[newRow][newCol]?.color === color) {
                count++;
            }
        }
        
        return count;
    }

    evaluateConnectivity(board, color) {
        let score = 0;
        const visited = Array(8).fill().map(() => Array(8).fill(false));
        
        // Find connected groups of nodes
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (!visited[r][c] && board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    const groupSize = this.floodFillNodes(board, r, c, color, visited);
                    score += groupSize * groupSize;  // Square the group size to favor larger groups
                }
            }
        }
        
        return score;
    }

    floodFillNodes(board, row, col, color, visited) {
        if (this.isOutOfBounds(row, col) || visited[row][col] || 
            board[row][col]?.type !== 'node' || board[row][col]?.color !== color) {
            return 0;
        }

        visited[row][col] = true;
        let size = 1;
        
        const directions = [[0,1], [1,0], [1,1], [1,-1], [-1,0], [0,-1], [-1,-1], [-1,1]];
        for (const [dr, dc] of directions) {
            size += this.floodFillNodes(board, row + dr, col + dc, color, visited);
        }
        
        return size;
    }

    analyzeLine(board, line, aiColor) {
        const opponentColor = aiColor === 'white' ? 'black' : 'white';
        let aiNodes = 0, oppNodes = 0, aiIons = 0, oppIons = 0, empty = 0;
        
        for (const [r, c] of line) {
            const cell = board[r][c];
            if (cell === null) {
                empty++;
            } else if (cell.color === aiColor) {
                if (cell.type === 'node') aiNodes++;
                else aiIons++;
            } else {
                if (cell.type === 'node') oppNodes++;
                else oppIons++;
            }
        }
        
        return {
            aiNexusThreat3: aiNodes === 3 && empty === 1,
            oppNexusThreat3: oppNodes === 3 && empty === 1,
            aiNexusThreat2: aiNodes === 2 && empty === 2,
            oppNexusThreat2: oppNodes === 2 && empty === 2,
            aiVectorThreat: aiIons === 3 && empty === 1,
            oppVectorThreat: oppIons === 3 && empty === 1
        };
    }

    // New method to analyze threat patterns
    analyzeThreatPatterns(board, color) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        let score = 0;
        
        // Check for potential nexus formations
        const nexusThreats = this.findNexusThreats(board, color);
        const opponentNexusThreats = this.findNexusThreats(board, opponentColor);
        
        // Heavily weight nexus threats
        score += nexusThreats.immediate * 1000;
        score += nexusThreats.potential * 200;
        score -= opponentNexusThreats.immediate * 1200; // Defensive priority
        score -= opponentNexusThreats.potential * 250;
        
        // Check for vector formation threats
        const vectorThreats = this.findVectorThreats(board, color);
        const opponentVectorThreats = this.findVectorThreats(board, opponentColor);
        
        score += vectorThreats.immediate * 150;
        score += vectorThreats.potential * 50;
        score -= opponentVectorThreats.immediate * 180;
        score -= opponentVectorThreats.potential * 60;
        
        return { score };
    }

    // New method to find nexus threats
    findNexusThreats(board, color) {
        let immediate = 0;
        let potential = 0;
        
        // Check all possible lines for nexus threats
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        const threat = this.analyzeNexusLine(board, r, c, dr, dc, color);
                        immediate += threat.immediate;
                        potential += threat.potential;
                    }
                }
            }
        }
        
        return { immediate, potential };
    }

    // New method to analyze a line for nexus threats
    analyzeNexusLine(board, startR, startC, dr, dc, color) {
        let nodes = 1;
        let gaps = 0;
        let gapPositions = [];
        
        // Look in positive direction
        for (let i = 1; i < 4; i++) {
            const r = startR + dr * i;
            const c = startC + dc * i;
            
            if (this.isOutOfBounds(r, c)) break;
            
            if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                nodes++;
            } else if (board[r][c] === null) {
                gaps++;
                gapPositions.push({r, c});
            } else {
                break;
            }
        }
        
        // Look in negative direction
        for (let i = 1; i < 4; i++) {
            const r = startR - dr * i;
            const c = startC - dc * i;
            
            if (this.isOutOfBounds(r, c)) break;
            
            if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                nodes++;
            } else if (board[r][c] === null) {
                gaps++;
                gapPositions.push({r, c});
            } else {
                break;
            }
        }
        
        // Analyze the threat level
        let immediate = 0;
        let potential = 0;
        
        if (nodes === 3 && gaps === 1) {
            immediate = 1;
        } else if (nodes === 2 && gaps === 2) {
            potential = 1;
        }
        
        return { immediate, potential, gapPositions };
    }

    // New method to evaluate node formation potential
    evaluateNodeFormationPotential(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        score += this.evaluateFormationLine(board, r, c, dr, dc, color);
                    }
                }
            }
        }
        
        return score;
    }

    // New method to evaluate a line for potential formations
    evaluateFormationLine(board, startR, startC, dr, dc, color) {
        let score = 0;
        let pieces = 1;
        let gaps = 0;
        let nodes = board[startR][startC]?.type === 'node' ? 1 : 0;
        
        // Look in both directions
        for (const multiplier of [1, -1]) {
            for (let i = 1; i < 4; i++) {
                const r = startR + dr * i * multiplier;
                const c = startC + dc * i * multiplier;
                
                if (this.isOutOfBounds(r, c)) break;
                
                const cell = board[r][c];
                if (cell?.color === color) {
                    pieces++;
                    if (cell.type === 'node') nodes++;
                } else if (cell === null) {
                    gaps++;
                    if (gaps > 2) break; // Too many gaps to be useful
                } else {
                    break;
                }
            }
        }
        
        // Score the formation potential
        if (pieces === 3 && gaps === 1) {
            score += 5; // Near vector formation
            if (nodes > 0) score += 3; // Includes nodes
        } else if (pieces === 2 && gaps === 2) {
            score += 2; // Potential vector setup
            if (nodes > 0) score += 2; // Includes nodes
        }
        
        return score;
    }

    // New method to evaluate strategic patterns
    evaluateStrategicPatterns(board, color) {
        let score = 0;
        
        // Evaluate diagonal control
        score += this.evaluateDiagonalControl(board, color) * 2;
        
        // Evaluate center box control (2x2 in center)
        score += this.evaluateCenterBoxControl(board, color) * 3;
        
        // Evaluate node distribution
        score += this.evaluateNodeDistribution(board, color) * 2;
        
        return score;
    }

    // Helper method for diagonal control
    evaluateDiagonalControl(board, color) {
        let score = 0;
        const diagonals = [
            [[0,0], [1,1], [2,2], [3,3]],
            [[4,4], [5,5], [6,6], [7,7]],
            [[0,7], [1,6], [2,5], [3,4]],
            [[4,3], [5,2], [6,1], [7,0]]
        ];
        
        for (const diagonal of diagonals) {
            let controlCount = 0;
            for (const [r, c] of diagonal) {
                if (board[r][c]?.color === color) {
                    controlCount++;
                    if (board[r][c]?.type === 'node') {
                        controlCount++; // Extra value for nodes
                    }
                }
            }
            score += controlCount * 2;
        }
        
        return score;
    }

    // Helper method for center box control
    evaluateCenterBoxControl(board, color) {
        let score = 0;
        for (let r = 3; r <= 4; r++) {
            for (let c = 3; c <= 4; c++) {
                if (board[r][c]?.color === color) {
                    score += 3;
                    if (board[r][c]?.type === 'node') {
                        score += 2;
                    }
                }
            }
        }
        return score;
    }

    // Helper method for node distribution
    evaluateNodeDistribution(board, color) {
        let score = 0;
        let nodes = [];
        
        // Collect all nodes
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    nodes.push({r, c});
                }
            }
        }
        
        // Evaluate node spacing
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = Math.abs(nodes[i].r - nodes[j].r) + Math.abs(nodes[i].c - nodes[j].c);
                if (dist === 3) {
                    score += 4; // Perfect spacing for nexus
                } else if (dist === 2 || dist === 4) {
                    score += 2; // Good spacing
                }
            }
        }
        
        return score;
    }

    // New helper method to check if move is near existing node
    isNearExistingNode(board, move, color) {
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const r = move.row + dr;
                const c = move.col + dc;
                
                if (!this.isOutOfBounds(r, c) && 
                    board[r][c]?.type === 'node' && 
                    board[r][c]?.color === color) {
                    return true;
                }
            }
        }
        return false;
    }

    // New method to evaluate connected nodes threat level
    evaluateConnectedNodes(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        const nodePositions = [];
        
        // First collect all nodes
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    nodePositions.push({r, c});
                }
            }
        }
        
        // Check each pair of nodes for dangerous connections
        for (let i = 0; i < nodePositions.length; i++) {
            for (let j = i + 1; j < nodePositions.length; j++) {
                const node1 = nodePositions[i];
                const node2 = nodePositions[j];
                
                // Check if nodes are on same line and close enough
                for (const [dr, dc] of directions) {
                    if (this.areNodesConnected(node1, node2, dr, dc)) {
                        const connectionInfo = this.analyzeNodeConnection(board, node1, node2, dr, dc, color);
                        
                        // Very high score for three connected nodes with space at either end
                        if (connectionInfo.connectedNodeCount >= 3 && connectionInfo.hasSpaceAtEnd) {
                            score += 10000; // Critical threat/opportunity
                        }
                        // High score for two connected nodes with potential for more
                        else if (connectionInfo.connectedNodeCount === 2) {
                            score += 1000 * (4 - connectionInfo.gapCount); // More dangerous with fewer gaps
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    // Helper to check if two nodes are connected (on same line and within 2 cells)
    areNodesConnected(node1, node2, dr, dc) {
        const deltaR = node2.r - node1.r;
        const deltaC = node2.c - node1.c;
        
        // Check if nodes are on the same line
        if (Math.abs(deltaR * dc) === Math.abs(deltaC * dr)) {
            // Check if they're within 2 cells of each other
            const distance = Math.max(Math.abs(deltaR), Math.abs(deltaC));
            return distance <= 2;
        }
        return false;
    }
    
    // Analyze a connection between nodes
    analyzeNodeConnection(board, node1, node2, dr, dc, color) {
        let connectedNodeCount = 2; // Start with the two nodes we know about
        let gapCount = 0;
        let hasSpaceAtEnd = false;
        
        // Get direction between nodes
        const deltaR = Math.sign(node2.r - node1.r);
        const deltaC = Math.sign(node2.c - node1.c);
        
        // Check cells between nodes
        let r = node1.r + deltaR;
        let c = node1.c + deltaC;
        while (r !== node2.r || c !== node2.c) {
            if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                connectedNodeCount++;
            } else if (board[r][c] === null) {
                gapCount++;
            }
            r += deltaR;
            c += deltaC;
        }
        
        // Check one space beyond in both directions
        if (!this.isOutOfBounds(node1.r - deltaR, node1.c - deltaC)) {
            hasSpaceAtEnd = board[node1.r - deltaR][node1.c - deltaC] === null;
        }
        if (!this.isOutOfBounds(node2.r + deltaR, node2.c + deltaC)) {
            hasSpaceAtEnd = hasSpaceAtEnd || board[node2.r + deltaR][node2.c + deltaC] === null;
        }
        
        return {
            connectedNodeCount,
            gapCount,
            hasSpaceAtEnd
        };
    }
    
    // Enhanced evaluation of connected ions
    evaluateConnectedIons(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        const connectionInfo = this.analyzeIonConnection(board, r, c, dr, dc, color);
                        
                        // Score based on number of connected ions and gaps
                        if (connectionInfo.connectedCount >= 3) {
                            score += 50 * (connectionInfo.connectedCount - connectionInfo.gapCount);
                        } else if (connectionInfo.connectedCount === 2) {
                            score += 20 * (3 - connectionInfo.gapCount);
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    // Analyze ion connections in a line
    analyzeIonConnection(board, startR, startC, dr, dc, color) {
        let connectedCount = 1;
        let gapCount = 0;
        
        // Look in both directions
        for (const multiplier of [1, -1]) {
            for (let i = 1; i <= 2; i++) {
                const r = startR + dr * i * multiplier;
                const c = startC + dc * i * multiplier;
                
                if (this.isOutOfBounds(r, c)) break;
                
                if (board[r][c]?.color === color) {
                    connectedCount++;
                } else if (board[r][c] === null) {
                    gapCount++;
                } else {
                    break;
                }
            }
        }
        
        return {
            connectedCount,
            gapCount
        };
    }

    // Update evaluatePosition to include connected nodes/ions evaluation
    evaluatePosition(gameState, aiColor) {
        const opponentColor = aiColor === 'white' ? 'black' : 'white';
        let score = 0;
        
        // Check for game-ending conditions first
        if (this.isGameOver(gameState)) {
            if (this.hasWon(gameState, aiColor)) return 1000000;
            if (this.hasWon(gameState, opponentColor)) return -1000000;
            const aiNodes = this.countNodes(gameState.board, aiColor);
            const oppNodes = this.countNodes(gameState.board, opponentColor);
            return (aiNodes - oppNodes) * 100;
        }

        // Connected nodes evaluation (highest priority after immediate wins)
        score += this.evaluateConnectedNodes(gameState.board, aiColor) * 5;
        score -= this.evaluateConnectedNodes(gameState.board, opponentColor) * 6; // Slightly higher weight for defense
        
        // Connected ions evaluation (lower priority than nodes)
        score += this.evaluateConnectedIons(gameState.board, aiColor);
        score -= this.evaluateConnectedIons(gameState.board, opponentColor);
        
        // Existing evaluations...
        const threatAnalysis = this.analyzeThreatPatterns(gameState.board, aiColor);
        score += threatAnalysis.score * 200;
        
        score += this.evaluateNodes(gameState.board, aiColor) * 150;
        score -= this.evaluateNodes(gameState.board, opponentColor) * 150;
        
        score += this.evaluateNodeFormationPotential(gameState.board, aiColor) * 100;
        score -= this.evaluateNodeFormationPotential(gameState.board, opponentColor) * 100;
        
        score += this.evaluateStrategicPatterns(gameState.board, aiColor) * 80;
        score -= this.evaluateStrategicPatterns(gameState.board, opponentColor) * 80;
        
        score += this.evaluateControl(gameState.board, aiColor) * 50;
        score -= this.evaluateControl(gameState.board, opponentColor) * 50;
        
        score += this.evaluateNodeConnectivity(gameState.board, aiColor) * 60;
        score -= this.evaluateNodeConnectivity(gameState.board, opponentColor) * 60;
        
        return score;
    }

    // Update getQuickMoveScore to consider connected nodes/ions
    getQuickMoveScore(gameState, move, playerColor) {
        let score = 0;
        const board = gameState.board;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        
        // Check if move creates or blocks connected nodes
        if (this.wouldCreateConnectedNodes(board, move, playerColor)) {
            score += 2000;
        }
        if (this.wouldBlockConnectedNodes(board, move, opponentColor)) {
            score += 2500; // Higher priority for blocking opponent's connected nodes
        }
        
        // Rest of the existing score calculations...
        const simState = this.simulateMove(gameState, move, playerColor);
        const hash = this.getBoardHash(simState.board);
        if (this.transpositionTable.has(hash)) {
            score += this.transpositionTable.get(hash);
        }
        
        const vectors = this.checkForVectors(board, move.row, move.col, playerColor);
        score += vectors.length * 1000;
        
        const blocksVector = this.checkForVectors(board, move.row, move.col, opponentColor);
        score += blocksVector.length * 800;
        
        if (this.isNearExistingNode(board, move, playerColor)) {
            score += 500;
        }
        
        const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
        score += (7 - centerDistance) * 50;
        
        return score;
    }
    
    // Helper to check if a move would create connected nodes
    wouldCreateConnectedNodes(board, move, color) {
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        // First check if this move would create a node
        const vectors = this.checkForVectors(board, move.row, move.col, color);
        if (vectors.length === 0) return false;
        
        // Check for nearby nodes
        for (const [dr, dc] of directions) {
            for (let dist = 1; dist <= 2; dist++) {
                const r = move.row + dr * dist;
                const c = move.col + dc * dist;
                
                if (!this.isOutOfBounds(r, c) && 
                    board[r][c]?.type === 'node' && 
                    board[r][c]?.color === color) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Helper to check if a move would block opponent's connected nodes
    wouldBlockConnectedNodes(board, move, opponentColor) {
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dr, dc] of directions) {
            let nodeCount = 0;
            
            // Check both directions
            for (const multiplier of [1, -1]) {
                for (let dist = 1; dist <= 2; dist++) {
                    const r = move.row + dr * dist * multiplier;
                    const c = move.col + dc * dist * multiplier;
                    
                    if (!this.isOutOfBounds(r, c) && 
                        board[r][c]?.type === 'node' && 
                        board[r][c]?.color === opponentColor) {
                        nodeCount++;
                    }
                }
            }
            
            if (nodeCount >= 2) return true;
        }
        
        return false;
    }

    // New method to detect critical node-ion patterns
    detectCriticalNodeIonPatterns(board, color) {
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        let criticalMoves = [];
        
        // For each node, look for this pattern
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.type === 'node' && board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        // Check each direction for the pattern
                        const pattern = this.checkForCriticalPattern(board, r, c, dr, dc, color);
                        if (pattern.found) {
                            criticalMoves.push({
                                row: pattern.blockingMove.row,
                                col: pattern.blockingMove.col,
                                urgency: pattern.urgency
                            });
                        }
                    }
                }
            }
        }
        
        return criticalMoves;
    }
    
    // Check for the critical pattern in a given direction
    checkForCriticalPattern(board, startR, startC, dr, dc, color) {
        // Look for: Ion-Node-Node-Empty or Empty-Node-Node-Ion
        let cells = [];
        let positions = [];
        
        // Collect 5 cells in this direction (need one extra on each side to check for empty spaces)
        for (let i = -2; i <= 2; i++) {
            const r = startR + dr * i;
            const c = startC + dc * i;
            
            if (this.isOutOfBounds(r, c)) {
                return { found: false };
            }
            
            cells.push(board[r][c]);
            positions.push({row: r, col: c});
        }
        
        // Check for the pattern: Ion-Node-Node-Empty-Empty
        // or its mirror: Empty-Empty-Node-Node-Ion
        for (let i = 0; i < 2; i++) { // Check both orientations
            let pattern = cells.slice(i, i + 5);
            let patternPos = positions.slice(i, i + 5);
            
            if (this.matchesCriticalPattern(pattern, color)) {
                // Find which empty space needs to be blocked
                const blockingMove = this.findBlockingMove(pattern, patternPos);
                if (blockingMove) {
                    return {
                        found: true,
                        blockingMove: blockingMove,
                        urgency: 100000 // Extremely high urgency - must be blocked
                    };
                }
            }
        }
        
        return { found: false };
    }
    
    // Check if a sequence of cells matches our critical pattern
    matchesCriticalPattern(cells, color) {
        // Check for Ion-Node-Node-Empty pattern
        const pattern1 = 
            cells[0]?.type === 'ion' && cells[0]?.color === color &&
            cells[1]?.type === 'node' && cells[1]?.color === color &&
            cells[2]?.type === 'node' && cells[2]?.color === color &&
            cells[3] === null;
            
        // Check for Empty-Node-Node-Ion pattern
        const pattern2 = 
            cells[3]?.type === 'ion' && cells[3]?.color === color &&
            cells[1]?.type === 'node' && cells[1]?.color === color &&
            cells[2]?.type === 'node' && cells[2]?.color === color &&
            cells[0] === null;
            
        return pattern1 || pattern2;
    }
    
    // Find which empty space needs to be blocked
    findBlockingMove(pattern, positions) {
        // If Ion-Node-Node-Empty pattern
        if (pattern[0]?.type === 'ion') {
            return positions[3]; // Block the empty space after the nodes
        }
        // If Empty-Node-Node-Ion pattern
        else if (pattern[3]?.type === 'ion') {
            return positions[0]; // Block the empty space before the nodes
        }
        return null;
    }

    // Update evaluatePosition to include critical pattern detection
    evaluatePosition(gameState, aiColor) {
        const opponentColor = aiColor === 'white' ? 'black' : 'white';
        let score = 0;
        
        // Check for game-ending conditions first
        if (this.isGameOver(gameState)) {
            if (this.hasWon(gameState, aiColor)) return 1000000;
            if (this.hasWon(gameState, opponentColor)) return -1000000;
            const aiNodes = this.countNodes(gameState.board, aiColor);
            const oppNodes = this.countNodes(gameState.board, opponentColor);
            return (aiNodes - oppNodes) * 100;
        }

        // Check for critical patterns that must be blocked
        const opponentCriticalMoves = this.detectCriticalNodeIonPatterns(gameState.board, opponentColor);
        if (opponentCriticalMoves.length > 0) {
            score -= 100000; // Extremely negative score if opponent has this pattern
        }
        
        // Check if we have any critical patterns
        const ourCriticalMoves = this.detectCriticalNodeIonPatterns(gameState.board, aiColor);
        if (ourCriticalMoves.length > 0) {
            score += 50000; // High positive score if we have this pattern
        }

        // Rest of the existing evaluation...
        score += this.evaluateConnectedNodes(gameState.board, aiColor) * 5;
        score -= this.evaluateConnectedNodes(gameState.board, opponentColor) * 6;
        
        score += this.evaluateConnectedIons(gameState.board, aiColor);
        score -= this.evaluateConnectedIons(gameState.board, opponentColor);
        
        const threatAnalysis = this.analyzeThreatPatterns(gameState.board, aiColor);
        score += threatAnalysis.score * 200;
        
        // ... rest of the existing evaluation code ...
        
        return score;
    }

    // Update getQuickMoveScore to prioritize blocking critical patterns
    getQuickMoveScore(gameState, move, playerColor) {
        let score = 0;
        const board = gameState.board;
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        
        // Check if this move blocks a critical pattern
        const opponentCriticalMoves = this.detectCriticalNodeIonPatterns(board, opponentColor);
        for (const criticalMove of opponentCriticalMoves) {
            if (move.row === criticalMove.row && move.col === criticalMove.col) {
                score += 100000; // Highest priority - must block this
                break;
            }
        }
        
        // Check if this move completes our critical pattern
        const ourCriticalMoves = this.detectCriticalNodeIonPatterns(board, playerColor);
        for (const criticalMove of ourCriticalMoves) {
            if (move.row === criticalMove.row && move.col === criticalMove.col) {
                score += 50000; // High priority but lower than blocking opponent
                break;
            }
        }
        
        // Rest of the existing score calculations...
        if (this.wouldCreateConnectedNodes(board, move, playerColor)) {
            score += 2000;
        }
        if (this.wouldBlockConnectedNodes(board, move, opponentColor)) {
            score += 2500;
        }
        
        // ... rest of the existing scoring code ...
        
        return score;
    }

    // Add game phase detection
    getGamePhase(gameState) {
        const moveCount = gameState.moveHistory.length;
        if (moveCount <= 8) return 'opening';
        if (moveCount <= 16) return 'middle';
        return 'end';
    }

    // New method for strategic opening moves
    getStrategicOpeningMove(board, moveCount) {
        // Only use strategic opening for first 6 moves (increased from 4)
        if (moveCount > 6) return null;

        const validMoves = this.getValidMoves(board);
        if (!validMoves.length) return null;

        // Filter moves to focus on center control and prevent edge moves
        const centerMoves = validMoves.filter(move => {
            const row = move.row;
            const col = move.col;
            
            // Completely exclude edge moves
            if (row === 0 || row === 7 || col === 0 || col === 7) return false;
            
            // Prioritize center and near-center squares
            return (row >= 2 && row <= 5 && col >= 2 && col <= 5);
        });

        if (!centerMoves.length) return null;

        // Score moves based on strategic value
        const scoredMoves = centerMoves.map(move => {
            let score = 0;
            const row = move.row;
            const col = move.col;

            // Center control bonus (increased)
            if (row >= 3 && row <= 4 && col >= 3 && col <= 4) {
                score += 20; // Doubled from 10
            }

            // Near center bonus (increased)
            if ((row === 2 || row === 5) && (col >= 3 && col <= 4)) {
                score += 10; // Doubled from 5
            }
            if ((col === 2 || col === 5) && (row >= 3 && row <= 4)) {
                score += 10; // Doubled from 5
            }

            // Block opponent nodes (increased)
            const opponentColor = this.color === 'black' ? 'white' : 'black';
            const wouldBlockNode = this.wouldBlockOpponentNode(board, move, opponentColor);
            if (wouldBlockNode) {
                score += 30; // Doubled from 15
            }

            // Future vector opportunities (increased)
            const futureVectors = this.countFutureVectorOpportunities(board, move);
            score += futureVectors * 4; // Doubled from 2

            // Check if this move would prevent opponent from forming a node on the edge
            if (this.wouldPreventEdgeNode(board, move, opponentColor)) {
                score += 25; // New bonus for preventing edge nodes
            }

            // Check if this move would force opponent to play on the edge
            if (this.wouldForceOpponentToEdge(board, move, opponentColor)) {
                score += 15; // New bonus for forcing opponent to edge
            }

            return { move, score };
        });

        // Sort by score and return the best move
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves[0].move;
    }

    // New helper method to check if a move would prevent opponent from forming a node on the edge
    wouldPreventEdgeNode(board, move, opponentColor) {
        // Simulate the move
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[move.row][move.col] = this.color;
        
        // Check if opponent has any moves that would create a node on the edge
        const opponentMoves = this.getValidMoves(newBoard);
        for (const oppMove of opponentMoves) {
            if ((oppMove.row === 0 || oppMove.row === 7 || oppMove.col === 0 || oppMove.col === 7) &&
                this.wouldCreateNode(newBoard, oppMove.row, oppMove.col, opponentColor)) {
                return true;
            }
        }
        return false;
    }

    // New helper method to check if a move would force opponent to play on the edge
    wouldForceOpponentToEdge(board, move, opponentColor) {
        // Simulate the move
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[move.row][move.col] = this.color;
        
        // Get opponent's valid moves after this move
        const opponentMoves = this.getValidMoves(newBoard);
        
        // Count how many non-edge moves opponent has
        const nonEdgeMoves = opponentMoves.filter(move => 
            move.row !== 0 && move.row !== 7 && move.col !== 0 && move.col !== 7
        );
        
        // If opponent has no non-edge moves, this forces them to the edge
        return nonEdgeMoves.length === 0 && opponentMoves.length > 0;
    }

    // Helper method to check if a move would create a node
    wouldCreateNode(board, row, col, playerColor) {
        // Simulate the move
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[row][col] = playerColor;
        
        // Check if this creates a node
        return this.isNode(newBoard, row, col);
    }

    // Helper to check if a move would block opponent's potential node
    wouldBlockOpponentNode(board, move, playerColor) {
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        
        // Check if opponent has 3 ions in a row
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dr, dc] of directions) {
            let count = 0;
            let hasSpace = false;
            
            // Check in both directions
            for (const multiplier of [1, -1]) {
                for (let i = 1; i <= 3; i++) {
                    const r = move.row + dr * i * multiplier;
                    const c = move.col + dc * i * multiplier;
                    
                    if (this.isOutOfBounds(r, c)) break;
                    
                    if (board[r][c]?.color === opponentColor) {
                        count++;
                    } else if (board[r][c] === null) {
                        hasSpace = true;
                        break;
                    } else {
                        break;
                    }
                }
            }
            
            // If opponent has 3 in a row and a space, this move would block a potential node
            if (count >= 3 && hasSpace) {
                return true;
            }
        }
        
        return false;
    }
    
    // Helper to check if a move controls key squares
    controlsKeySquares(board, move, playerColor) {
        // Check if move controls center or key diagonal squares
        const keySquares = [
            {row: 3, col: 3}, {row: 3, col: 4},
            {row: 4, col: 3}, {row: 4, col: 4}
        ];
        
        // Check if move is adjacent to any key square
        for (const square of keySquares) {
            if (Math.abs(move.row - square.row) <= 1 && 
                Math.abs(move.col - square.col) <= 1) {
                return true;
            }
        }
        
        return false;
    }
    
    // Helper to check if a move sets up a future vector
    setsUpFutureVector(board, move, playerColor) {
        // Check if move creates a pattern like: Ion-Ion-Empty-Ion
        // or: Ion-Empty-Ion-Ion
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dr, dc] of directions) {
            // Check both patterns
            const pattern1 = this.checkVectorPattern(board, move, dr, dc, playerColor, [1,1,0,1]);
            const pattern2 = this.checkVectorPattern(board, move, dr, dc, playerColor, [1,0,1,1]);
            
            if (pattern1 || pattern2) {
                return true;
            }
        }
        
        return false;
    }
    
    // Helper to check a specific vector pattern
    checkVectorPattern(board, move, dr, dc, playerColor, pattern) {
        let matches = 0;
        
        for (let i = 0; i < pattern.length; i++) {
            const r = move.row + dr * (i - 1);
            const c = move.col + dc * (i - 1);
            
            if (this.isOutOfBounds(r, c)) return false;
            
            if (pattern[i] === 1) {
                if (board[r][c]?.color !== playerColor) return false;
            } else {
                if (board[r][c] !== null) return false;
            }
        }
        
        return true;
    }
    
    // Helper to check if a move blocks opponent's development
    blocksOpponentDevelopment(board, move, playerColor) {
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        
        // Check if opponent has a developing pattern that should be blocked
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dr, dc] of directions) {
            // Check for patterns like: Ion-Ion-Empty or Empty-Ion-Ion
            const pattern1 = this.checkVectorPattern(board, move, dr, dc, opponentColor, [1,1,0]);
            const pattern2 = this.checkVectorPattern(board, move, dr, dc, opponentColor, [0,1,1]);
            
            if (pattern1 || pattern2) {
                return true;
            }
        }
        
        return false;
    }
    
    // Helper to evaluate a strategic move
    evaluateStrategicMove(board, move, playerColor) {
        let score = 0;
        
        // Base score on position value
        score += this.enhancedPositionValues[move.row][move.col] * 10;
        
        // Bonus for controlling key squares
        if (this.controlsKeySquares(board, move, playerColor)) {
            score += 50;
        }
        
        // Bonus for setting up future vectors
        if (this.setsUpFutureVector(board, move, playerColor)) {
            score += 40;
        }
        
        // Bonus for blocking opponent
        if (this.blocksOpponentDevelopment(board, move, playerColor)) {
            score += 60; // Higher weight for blocking
        }
        
        // Penalty for moving too far from center in opening
        const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
        score -= centerDistance * 5;
        
        return score;
    }

    // New helper methods for phase-specific evaluation
    
    evaluateCenterControl(board, color) {
        let score = 0;
        
        // Evaluate control of center squares
        for (let r = 3; r <= 4; r++) {
            for (let c = 3; c <= 4; c++) {
                if (board[r][c]?.color === color) {
                    score += 10;
                }
            }
        }
        
        // Evaluate control of squares adjacent to center
        for (let r = 2; r <= 5; r++) {
            for (let c = 2; c <= 5; c++) {
                if (board[r][c]?.color === color) {
                    score += 5;
                }
            }
        }
        
        return score;
    }
    
    evaluateNodePrevention(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        // Look for potential node formations to block
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        // Check for patterns that could lead to nodes
                        if (this.hasPotentialNodeFormation(board, r, c, dr, dc, color)) {
                            score += 15;
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    hasPotentialNodeFormation(board, startR, startC, dr, dc, color) {
        let count = 1;
        let hasSpace = false;
        
        // Check in both directions
        for (const multiplier of [1, -1]) {
            for (let i = 1; i <= 3; i++) {
                const r = startR + dr * i * multiplier;
                const c = startC + dc * i * multiplier;
                
                if (this.isOutOfBounds(r, c)) break;
                
                if (board[r][c]?.color === color) {
                    count++;
                } else if (board[r][c] === null) {
                    hasSpace = true;
                    break;
                } else {
                    break;
                }
            }
        }
        
        return count >= 3 && hasSpace;
    }
    
    evaluateVectorSetup(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        // Look for patterns that could lead to vectors
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        // Check for patterns like: Ion-Ion-Empty or Empty-Ion-Ion
                        if (this.hasVectorSetupPattern(board, r, c, dr, dc, color)) {
                            score += 10;
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    hasVectorSetupPattern(board, startR, startC, dr, dc, color) {
        // Check for patterns that could lead to vectors
        const patterns = [
            [1,1,0], [0,1,1],  // Two ions with a gap
            [1,0,1], [1,1,0,1], [1,0,1,1]  // More complex patterns
        ];
        
        for (const pattern of patterns) {
            let matches = true;
            
            for (let i = 0; i < pattern.length; i++) {
                const r = startR + dr * (i - 1);
                const c = startC + dc * (i - 1);
                
                if (this.isOutOfBounds(r, c)) {
                    matches = false;
                    break;
                }
                
                if (pattern[i] === 1) {
                    if (board[r][c]?.color !== color) {
                        matches = false;
                        break;
                    }
                } else {
                    if (board[r][c] !== null) {
                        matches = false;
                        break;
                    }
                }
            }
            
            if (matches) return true;
        }
        
        return false;
    }
    
    evaluateBoardControl(board, color) {
        let score = 0;
        
        // Evaluate control of key areas
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    // Add value based on position
                    score += this.enhancedPositionValues[r][c];
                    
                    // Bonus for controlling multiple adjacent squares
                    score += this.countAdjacentControl(board, r, c, color) * 2;
                }
            }
        }
        
        return score;
    }
    
    countAdjacentControl(board, row, col, color) {
        let count = 0;
        
        // Check all 8 directions
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const r = row + dr;
                const c = col + dc;
                
                if (!this.isOutOfBounds(r, c) && board[r][c]?.color === color) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    evaluateVectorOpportunities(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        // Look for opportunities to create vectors
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        // Check for patterns that are one move away from a vector
                        if (this.isNearVectorFormation(board, r, c, dr, dc, color)) {
                            score += 20;
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    isNearVectorFormation(board, startR, startC, dr, dc, color) {
        let count = 1;
        let gaps = 0;
        
        // Check in both directions
        for (const multiplier of [1, -1]) {
            for (let i = 1; i <= 3; i++) {
                const r = startR + dr * i * multiplier;
                const c = startC + dc * i * multiplier;
                
                if (this.isOutOfBounds(r, c)) break;
                
                if (board[r][c]?.color === color) {
                    count++;
                } else if (board[r][c] === null) {
                    gaps++;
                } else {
                    break;
                }
            }
        }
        
        // Consider it a vector opportunity if we have 3 pieces with 1 gap
        return count === 3 && gaps === 1;
    }
    
    evaluateWinningVectors(board, color) {
        let score = 0;
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        // Look for winning vector opportunities
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c]?.color === color) {
                    for (const [dr, dc] of directions) {
                        // Check for patterns that are one move away from a winning vector
                        if (this.isNearWinningVector(board, r, c, dr, dc, color)) {
                            score += 50;
                        }
                    }
                }
            }
        }
        
        return score;
    }
    
    isNearWinningVector(board, startR, startC, dr, dc, color) {
        let count = 1;
        let gaps = 0;
        let hasSpaceAtEnd = false;
        
        // Check in both directions
        for (const multiplier of [1, -1]) {
            for (let i = 1; i <= 3; i++) {
                const r = startR + dr * i * multiplier;
                const c = startC + dc * i * multiplier;
                
                if (this.isOutOfBounds(r, c)) break;
                
                if (board[r][c]?.color === color) {
                    count++;
                } else if (board[r][c] === null) {
                    gaps++;
                    if (i === 1) hasSpaceAtEnd = true;
                } else {
                    break;
                }
            }
        }
        
        // Consider it a winning vector opportunity if:
        // 1. We have 3 pieces
        // 2. There's exactly one gap
        // 3. The gap is at the end (so we can complete the vector)
        return count === 3 && gaps === 1 && hasSpaceAtEnd;
    }

    // New helper method to check if a move would lead to an edge node in the future
    wouldLeadToEdgeNode(board, row, col, playerColor) {
        // Simulate the move
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[row][col] = playerColor;
        
        // Check if this move creates a line that could extend to the edge
        const directions = [
            {dr: -1, dc: 0}, {dr: 1, dc: 0}, {dr: 0, dc: -1}, {dr: 0, dc: 1},
            {dr: -1, dc: -1}, {dr: -1, dc: 1}, {dr: 1, dc: -1}, {dr: 1, dc: 1}
        ];
        
        for (const dir of directions) {
            let r = row;
            let c = col;
            let count = 1;
            
            // Count consecutive pieces in this direction
            while (true) {
                r += dir.dr;
                c += dir.dc;
                
                // Stop if out of bounds
                if (r < 0 || r >= 8 || c < 0 || c >= 8) break;
                
                // Stop if not the same color
                if (newBoard[r][c] !== playerColor) break;
                
                count++;
                
                // If we have 3 or more in a row and we're near the edge, this is dangerous
                if (count >= 3) {
                    // Check if we're near the edge
                    if (r === 0 || r === 7 || c === 0 || c === 7) {
                        return true;
                    }
                    
                    // Check if the line could extend to the edge
                    let nextR = r + dir.dr;
                    let nextC = c + dir.dc;
                    if (nextR >= 0 && nextR < 8 && nextC >= 0 && nextC < 8) {
                        if (newBoard[nextR][nextC] === null) {
                            // If the next cell is empty and near the edge, this is dangerous
                            if (nextR === 0 || nextR === 7 || nextC === 0 || nextC === 7) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }

    evaluatePatterns(board, color) {
        let score = 0;
        
        // Check for common winning patterns
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isSameTypeCell(board, row, col, color)) {
                    // Check for L-shaped patterns
                    score += this.evaluateLPattern(board, row, col, color) * 2;
                    
                    // Check for diagonal patterns
                    score += this.evaluateDiagonalPattern(board, row, col, color) * 1.5;
                    
                    // Check for corner patterns
                    score += this.evaluateCornerPattern(board, row, col, color) * 1.8;
                    
                    // Check for center patterns
                    score += this.evaluateCenterPattern(board, row, col, color) * 2.2;
                }
            }
        }
        
        return score;
    }

    evaluateStrategicFormations(board, color) {
        let score = 0;
        
        // Evaluate potential vector formations
        score += this.evaluateVectorFormations(board, color) * 1.5;
        
        // Evaluate node clusters
        score += this.evaluateNodeClusters(board, color) * 1.2;
        
        // Evaluate control of key squares
        score += this.evaluateKeySquares(board, color) * 1.8;
        
        // Evaluate potential for future vectors
        score += this.evaluateFutureVectorPotential(board, color) * 1.4;
        
        return score;
    }

    evaluateNodeProtection(board, color) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isSameTypeCell(board, row, col, color)) {
                    // Count protecting nodes
                    const protectors = this.countProtectingNodes(board, row, col, color);
                    score += protectors * 0.5;
                    
                    // Evaluate protection quality
                    score += this.evaluateProtectionQuality(board, row, col, color) * 0.8;
                }
            }
        }
        
        return score;
    }

    evaluateVectorThreats(board, color) {
        let score = 0;
        
        // Check for immediate vector threats
        score += this.findImmediateVectorThreats(board, color) * 2;
        
        // Check for potential vector threats
        score += this.findPotentialVectorThreats(board, color) * 1.5;
        
        // Check for blocking opportunities
        score += this.findVectorBlockingOpportunities(board, color) * 1.2;
        
        return score;
    }

    evaluatePositionFlexibility(board, color) {
        let score = 0;
        
        // Evaluate available moves
        const validMoves = this.getValidMoves(board);
        score += validMoves.length * 0.3;
        
        // Evaluate move quality
        for (const move of validMoves) {
            score += this.evaluateMoveQuality(board, move, color) * 0.5;
        }
        
        // Evaluate position control
        score += this.evaluatePositionControl(board, color) * 0.8;
        
        return score;
    }

    evaluateLPattern(board, row, col, color) {
        let score = 0;
        const directions = [
            [[0, 1], [1, 0]], // ┗
            [[0, 1], [-1, 0]], // ┛
            [[0, -1], [1, 0]], // ┏
            [[0, -1], [-1, 0]] // ┓
        ];
        
        for (const [dir1, dir2] of directions) {
            if (this.checkPattern(board, row, col, dir1, dir2, color)) {
                score += 1;
            }
        }
        
        return score;
    }

    evaluateDiagonalPattern(board, row, col, color) {
        let score = 0;
        const directions = [
            [[1, 1], [1, 1]], // \
            [[1, -1], [1, -1]] // /
        ];
        
        for (const [dir1, dir2] of directions) {
            if (this.checkPattern(board, row, col, dir1, dir2, color)) {
                score += 1.5;
            }
        }
        
        return score;
    }

    evaluateCornerPattern(board, row, col, color) {
        let score = 0;
        const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
        
        for (const [cornerRow, cornerCol] of corners) {
            if (row === cornerRow && col === cornerCol && this.isSameTypeCell(board, row, col, color)) {
                score += 2;
            }
        }
        
        return score;
    }

    evaluateCenterPattern(board, row, col, color) {
        let score = 0;
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
        
        for (const [centerRow, centerCol] of centerSquares) {
            if (row === centerRow && col === centerCol && this.isSameTypeCell(board, row, col, color)) {
                score += 2.5;
            }
        }
        
        return score;
    }

    checkPattern(board, row, col, dir1, dir2, color) {
        const [dr1, dc1] = dir1;
        const [dr2, dc2] = dir2;
        
        const r1 = row + dr1;
        const c1 = col + dc1;
        const r2 = row + dr2;
        const c2 = col + dc2;
        
        if (this.isOutOfBounds(r1, c1) || this.isOutOfBounds(r2, c2)) {
            return false;
        }
        
        return this.isSameTypeCell(board, r1, c1, color) && 
               this.isSameTypeCell(board, r2, c2, color);
    }

    evaluateVectorFormations(board, color) {
        let score = 0;
        
        // Check for potential vector formations
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isSameTypeCell(board, row, col, color)) {
                    score += this.evaluateVectorFormation(board, row, col, color);
                }
            }
        }
        
        return score;
    }

    evaluateNodeClusters(board, color) {
        let score = 0;
        const clusters = this.findNodeClusters(board, color);
        
        for (const cluster of clusters) {
            score += cluster.length * 0.8;
            score += this.evaluateClusterQuality(cluster) * 0.5;
        }
        
        return score;
    }

    evaluateKeySquares(board, color) {
        let score = 0;
        const keySquares = [
            [3, 3], [3, 4], [4, 3], [4, 4], // Center
            [2, 2], [2, 5], [5, 2], [5, 5]  // Near center
        ];
        
        for (const [row, col] of keySquares) {
            if (this.isSameTypeCell(board, row, col, color)) {
                score += 1.5;
            }
        }
        
        return score;
    }

    evaluateFutureVectorPotential(board, color) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isSameTypeCell(board, row, col, color)) {
                    score += this.evaluateVectorPotential(board, row, col, color);
                }
            }
        }
        
        return score;
    }

    evaluateProtectionQuality(board, row, col, color) {
        let score = 0;
        
        // Check for diagonal protection
        score += this.checkDiagonalProtection(board, row, col, color) * 0.8;
        
        // Check for orthogonal protection
        score += this.checkOrthogonalProtection(board, row, col, color) * 0.6;
        
        // Check for multiple layers of protection
        score += this.checkMultipleProtection(board, row, col, color) * 1.2;
        
        return score;
    }

    findImmediateVectorThreats(board, color) {
        let score = 0;
        
        // Check for immediate vector completion
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isSameTypeCell(board, row, col, color)) {
                    score += this.checkImmediateVectorThreat(board, row, col, color);
                }
            }
        }
        
        return score;
    }

    findPotentialVectorThreats(board, color) {
        let score = 0;
        
        // Check for potential vector formations
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isSameTypeCell(board, row, col, color)) {
                    score += this.checkPotentialVectorThreat(board, row, col, color);
                }
            }
        }
        
        return score;
    }

    findVectorBlockingOpportunities(board, color) {
        let score = 0;
        
        // Check for opponent vector threats that can be blocked
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isSameTypeCell(board, row, col, color)) {
                    score += this.checkVectorBlockingOpportunity(board, row, col, color);
                }
            }
        }
        
        return score;
    }

    evaluateMoveQuality(board, move, color) {
        let score = 0;
        
        // Evaluate move based on position
        score += this.evaluateMovePosition(board, move, color) * 0.5;
        
        // Evaluate move based on tactical value
        score += this.evaluateMoveTactics(board, move, color) * 0.8;
        
        // Evaluate move based on strategic value
        score += this.evaluateMoveStrategy(board, move, color) * 0.6;
        
        return score;
    }

    evaluatePositionControl(board, color) {
        let score = 0;
        
        // Evaluate center control
        score += this.evaluateCenterControl(board, color) * 1.2;
        
        // Evaluate diagonal control
        score += this.evaluateDiagonalControl(board, color) * 0.8;
        
        // Evaluate edge control
        score += this.evaluateEdgeControl(board, color) * 0.6;
        
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

// Initialize the game when the page loads
window.addEventListener('load', initializeGame);