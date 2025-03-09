// ai.js - Simplified Flux AI with clear strategic priorities

// ==================== HELPER FUNCTIONS ====================

// Check if a move would create a line longer than 4
function wouldCreateLineTooLong(row, col, player, board) {
    // Temporarily place the ion
    const originalValue = board[row][col];
    board[row][col] = { color: player, protectionLevel: 0 };

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
                board[r][c] && board[r][c].color === player) {
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
                board[r][c] && board[r][c].color === player) {
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

// Get all legal moves
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

// Check if placing a ion would create vectors (lines of 4)
function checkVectorCreation(row, col, player, board) {
    // Temporarily place a ion
    const originalValue = board[row][col];
    board[row][col] = { color: player, protectionLevel: 0 };
    
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];
    
    let vectorsFormed = 0;
    
    // Check each direction
    for (const [dr, dc] of directions) {
        let count = 1;  // Start with the placed piece
        
        // Count in positive direction
        for (let i = 1; i < 4; i++) {
            const r = row + i * dr;
            const c = col + i * dc;
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && 
                board[r][c] && board[r][c].color === player) {
                count++;
            } else {
                break;
            }
        }
        
        // Count in negative direction
        for (let i = 1; i < 4; i++) {
            const r = row - i * dr;
            const c = col - i * dc;
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && 
                board[r][c] && board[r][c].color === player) {
                count++;
            } else {
                break;
            }
        }
        
        // If we have a line of exactly 4
        if (count === 4) {
            vectorsFormed++;
        }
    }
    
    // Restore original value
    board[row][col] = originalValue;
    
    return vectorsFormed;
}

// Find ions that are connected (2 or 3 in a row)
function findConnectedIons(board, player) {
    const connected = {
        pairs: [], // 2 connected ions
        triples: [] // 3 connected ions
    };
    
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];
    
    // Check each cell
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            
            // Skip empty cells or opponent pieces
            if (!piece || piece.color !== player) continue;
            
            // Check each direction
            for (const [dr, dc] of directions) {
                let count = 1;
                let positions = [{row, col}];
                
                // Count consecutive pieces
                for (let i = 1; i < 4; i++) {
                    const r = row + i * dr;
                    const c = col + i * dc;
                    
                    if (r >= 0 && r < 8 && c >= 0 && c < 8 && 
                        board[r][c] && board[r][c].color === player) {
                        count++;
                        positions.push({row: r, col: c});
                    } else {
                        break;
                    }
                }
                
                // Store the connected ions
                if (count === 2) {
                    connected.pairs.push({
                        positions: positions,
                        // Check both ends for potential extension
                        extendPositions: [
                            {row: row - dr, col: col - dc},
                            {row: row + count*dr, col: col + count*dc}
                        ]
                    });
                } 
                else if (count === 3) {
                    connected.triples.push({
                        positions: positions,
                        // Check both ends for potential extension
                        extendPositions: [
                            {row: row - dr, col: col - dc},
                            {row: row + count*dr, col: col + count*dc}
                        ]
                    });
                }
            }
        }
    }
    
    return connected;
}

// Calculate distance from center (higher is worse)
function distanceFromCenter(row, col) {
    return Math.abs(row - 3.5) + Math.abs(col - 3.5);
}

// Check if a move is adjacent to any existing ions of the player
function isAdjacentToOwn(row, col, player, board) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue; // Skip the cell itself
            
            const r = row + dr;
            const c = col + dc;
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && 
                board[r][c] && board[r][c].color === player) {
                return true;
            }
        }
    }
    return false;
}

// Find empty positions that would extend a connected line
function findExtendPositions(connected, board) {
    const extendMoves = [];
    
    // Process pairs
    for (const pair of connected.pairs) {
        for (const pos of pair.extendPositions) {
            if (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8 && 
                board[pos.row][pos.col] === null) {
                extendMoves.push({
                    row: pos.row,
                    col: pos.col,
                    priority: 2 // Medium priority
                });
            }
        }
    }
    
    // Process triples (higher priority)
    for (const triple of connected.triples) {
        for (const pos of triple.extendPositions) {
            if (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8 && 
                board[pos.row][pos.col] === null) {
                extendMoves.push({
                    row: pos.row,
                    col: pos.col,
                    priority: 3 // High priority
                });
            }
        }
    }
    
    return extendMoves;
}

// Find moves that would block opponent's connected ions
function findBlockingMoves(board, player) {
    const opponent = player === 'white' ? 'black' : 'white';
    const opponentConnected = findConnectedIons(board, opponent);
    const blockingMoves = [];
    
    // Block opponent's triples (highest priority)
    for (const triple of opponentConnected.triples) {
        for (const pos of triple.extendPositions) {
            if (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8 && 
                board[pos.row][pos.col] === null) {
                blockingMoves.push({
                    row: pos.row,
                    col: pos.col,
                    priority: 4 // Critical priority
                });
            }
        }
    }
    
    // Block opponent's pairs (medium priority)
    for (const pair of opponentConnected.pairs) {
        for (const pos of pair.extendPositions) {
            if (pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8 && 
                board[pos.row][pos.col] === null) {
                blockingMoves.push({
                    row: pos.row,
                    col: pos.col,
                    priority: 1 // Lower priority
                });
            }
        }
    }
    
    return blockingMoves;
}

// ==================== LEVEL 1: EASY AI ====================

// Level 1: Easy AI - Basic strategy with few random moves
function getEasyAIMove(board, player) {
    const legalMoves = getLegalMoves(board, player);
    if (legalMoves.length === 0) return null;
    
    // 10% chance for a random move
    if (Math.random() < 0.1) {
        console.log("Easy AI: Making a random move");
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    
    // Find blocking moves
    const blockingMoves = findBlockingMoves(board, player);
    
    // Critical blocks (opponent has 3 in a row) - always block these
    const criticalBlocks = blockingMoves.filter(move => move.priority === 4);
    if (criticalBlocks.length > 0) {
        console.log("Easy AI: Blocking opponent's triple");
        return criticalBlocks[Math.floor(Math.random() * criticalBlocks.length)];
    }
    
    // Find moves adjacent to own ions
    const adjacentMoves = legalMoves.filter(move => 
        isAdjacentToOwn(move.row, move.col, player, board));
    
    if (adjacentMoves.length > 0) {
        console.log("Easy AI: Placing adjacent to own ions");
        return adjacentMoves[Math.floor(Math.random() * adjacentMoves.length)];
    }
    
    // If no adjacent moves, prefer moves toward the center
    const centerMoves = legalMoves.sort((a, b) => 
        distanceFromCenter(a.row, a.col) - distanceFromCenter(b.row, b.col));
    
    return centerMoves[0]; // Return the move closest to center
}

// ==================== LEVEL 2: MEDIUM AI (formerly Hard) ====================

// Level 2: Medium AI (formerly Level 3 Hard)
function getMediumAIMove(board, player) {
    const legalMoves = getLegalMoves(board, player);
    if (legalMoves.length === 0) return null;
    
    const opponent = player === 'white' ? 'black' : 'white';
    
    // Find vector creation moves
    const vectorMoves = [];
    for (const move of legalMoves) {
        const vectorCount = checkVectorCreation(move.row, move.col, player, board);
        if (vectorCount > 0) {
            vectorMoves.push({
                row: move.row,
                col: move.col,
                priority: 5,
                vectorCount: vectorCount
            });
        }
    }
    
    // If we can create vectors, do it (prioritize multiple vectors)
    if (vectorMoves.length > 0) {
        console.log("Medium AI: Creating a vector");
        vectorMoves.sort((a, b) => b.vectorCount - a.vectorCount);
        return vectorMoves[0];
    }
    
    // Find opponent vector creation moves to block
    const opponentVectorMoves = [];
    for (const move of legalMoves) {
        const vectorCount = checkVectorCreation(move.row, move.col, opponent, board);
        if (vectorCount > 0) {
            opponentVectorMoves.push({
                row: move.row,
                col: move.col,
                priority: 5,
                vectorCount: vectorCount
            });
        }
    }
    
    // Block opponent's vector creation
    if (opponentVectorMoves.length > 0) {
        console.log("Medium AI: Blocking opponent's vector creation");
        opponentVectorMoves.sort((a, b) => b.vectorCount - a.vectorCount);
        return opponentVectorMoves[0];
    }
    
    // Find blocking moves
    const blockingMoves = findBlockingMoves(board, player);
    
    // Critical blocks (opponent has 3 in a row)
    const criticalBlocks = blockingMoves.filter(move => move.priority === 4);
    if (criticalBlocks.length > 0) {
        console.log("Medium AI: Blocking opponent's triple");
        return criticalBlocks[Math.floor(Math.random() * criticalBlocks.length)];
    }
    
    // Find connected ions and positions to extend them
    const connected = findConnectedIons(board, player);
    const extendMoves = findExtendPositions(connected, board);
    
    // Extend our own triples
    const extendTriples = extendMoves.filter(move => move.priority === 3);
    if (extendTriples.length > 0) {
        console.log("Medium AI: Extending own triple");
        return extendTriples[Math.floor(Math.random() * extendTriples.length)];
    }
    
    // Block opponent's pairs
    const pairBlocks = blockingMoves.filter(move => move.priority === 1);
    if (pairBlocks.length > 0) {
        console.log("Medium AI: Blocking opponent's pair");
        return pairBlocks[Math.floor(Math.random() * pairBlocks.length)];
    }
    
    // Extend our own pairs
    const extendPairs = extendMoves.filter(move => move.priority === 2);
    if (extendPairs.length > 0) {
        console.log("Medium AI: Extending own pair");
        return extendPairs[Math.floor(Math.random() * extendPairs.length)];
    }
    
    // Calculate score for each remaining move
    const scoredMoves = [];
    
    for (const move of legalMoves) {
        let score = 0;
        
        // Prefer center positions
        score -= distanceFromCenter(move.row, move.col) * 5;
        
        // Prefer positions adjacent to own ions
        if (isAdjacentToOwn(move.row, move.col, player, board)) {
            score += 20;
        }
        
        // Avoid positions adjacent to opponent ions
        if (isAdjacentToOwn(move.row, move.col, opponent, board)) {
            score -= 10;
        }
        
        scoredMoves.push({
            row: move.row,
            col: move.col,
            score: score
        });
    }
    
    // Sort by score
    scoredMoves.sort((a, b) => b.score - a.score);
    
    console.log("Medium AI: Choosing strategically scored move");
    return scoredMoves[0];
}

// ==================== LEVEL 3: HARD AI (formerly Expert) ====================

// Level 3: Hard AI (formerly Level 4 Expert)
function getHardAIMove(board, player) {
    const legalMoves = getLegalMoves(board, player);
    if (legalMoves.length === 0) return null;
    
    const opponent = player === 'white' ? 'black' : 'white';
    
    // Find vector creation moves
    const vectorMoves = [];
    for (const move of legalMoves) {
        const vectorCount = checkVectorCreation(move.row, move.col, player, board);
        if (vectorCount > 0) {
            vectorMoves.push({
                row: move.row,
                col: move.col,
                priority: 5,
                vectorCount: vectorCount
            });
        }
    }
    
    // If we can create vectors, do it (prioritize multiple vectors)
    if (vectorMoves.length > 0) {
        console.log("Hard AI: Creating a vector");
        vectorMoves.sort((a, b) => b.vectorCount - a.vectorCount);
        return vectorMoves[0];
    }
    
    // Find opponent vector creation moves to block
    const opponentVectorMoves = [];
    for (const move of legalMoves) {
        const vectorCount = checkVectorCreation(move.row, move.col, opponent, board);
        if (vectorCount > 0) {
            opponentVectorMoves.push({
                row: move.row,
                col: move.col,
                priority: 5,
                vectorCount: vectorCount
            });
        }
    }
    
    // Block opponent's vector creation
    if (opponentVectorMoves.length > 0) {
        console.log("Hard AI: Blocking opponent's vector creation");
        opponentVectorMoves.sort((a, b) => b.vectorCount - a.vectorCount);
        return opponentVectorMoves[0];
    }
    
    // Find blocking moves
    const blockingMoves = findBlockingMoves(board, player);
    
    // Critical blocks (opponent has 3 in a row)
    const criticalBlocks = blockingMoves.filter(move => move.priority === 4);
    if (criticalBlocks.length > 0) {
        console.log("Hard AI: Blocking opponent's triple");
        return criticalBlocks[Math.floor(Math.random() * criticalBlocks.length)];
    }
    
    // Find connected ions and positions to extend them
    const connected = findConnectedIons(board, player);
    const extendMoves = findExtendPositions(connected, board);
    
    // Extend our own triples
    const extendTriples = extendMoves.filter(move => move.priority === 3);
    if (extendTriples.length > 0) {
        console.log("Hard AI: Extending own triple");
        return extendTriples[Math.floor(Math.random() * extendTriples.length)];
    }
    
    // Block opponent's pairs
    const pairBlocks = blockingMoves.filter(move => move.priority === 1);
    if (pairBlocks.length > 0) {
        console.log("Hard AI: Blocking opponent's pair");
        return pairBlocks[Math.floor(Math.random() * pairBlocks.length)];
    }
    
    // Extend our own pairs
    const extendPairs = extendMoves.filter(move => move.priority === 2);
    if (extendPairs.length > 0) {
        console.log("Hard AI: Extending own pair");
        return extendPairs[Math.floor(Math.random() * extendPairs.length)];
    }
    
    // Calculate score for each remaining move with one-move lookahead
    const scoredMoves = [];
    
    for (const move of legalMoves) {
        // Create a copy of the board with this move
        const newBoard = JSON.parse(JSON.stringify(board));
        newBoard[move.row][move.col] = { color: player, protectionLevel: 0 };
        
        let score = 0;
        
        // Prefer center positions
        score -= distanceFromCenter(move.row, move.col) * 5;
        
        // Prefer positions adjacent to own ions
        if (isAdjacentToOwn(move.row, move.col, player, board)) {
            score += 20;
        }
        
        // Check if this move would block opponent's pairs
        const isPairBlock = blockingMoves.some(block => 
            block.priority === 1 && block.row === move.row && block.col === move.col);
        if (isPairBlock) {
            score += 15;
        }
        
        // Check if this move would extend our pairs
        const isPairExtend = extendMoves.some(extend => 
            extend.priority === 2 && extend.row === move.row && extend.col === move.col);
        if (isPairExtend) {
            score += 15;
        }
        
        // Check opponent's best response
        const opponentMoves = getLegalMoves(newBoard, opponent);
        let maxOpponentThreat = 0;
        
        for (const opMove of opponentMoves) {
            const opVectorCount = checkVectorCreation(opMove.row, opMove.col, opponent, newBoard);
            if (opVectorCount > 0) {
                maxOpponentThreat = Math.max(maxOpponentThreat, opVectorCount * 25);
            }
            
            // Check if opponent can extend a triple
            const opConnected = findConnectedIons(newBoard, opponent);
            const hasTriple = opConnected.triples.some(triple => 
                triple.extendPositions.some(pos => 
                    pos.row === opMove.row && pos.col === opMove.col));
            
            if (hasTriple) {
                maxOpponentThreat = Math.max(maxOpponentThreat, 20);
            }
        }
        
        // Subtract opponent threat from score
        score -= maxOpponentThreat;
        
        scoredMoves.push({
            row: move.row,
            col: move.col,
            score: score
        });
    }
    
    // Sort by score
    scoredMoves.sort((a, b) => b.score - a.score);
    
    console.log("Hard AI: Choosing move with lookahead");
    return scoredMoves[0];
}

// ==================== LEVEL 4: NEW EXPERT AI ====================

// Helper functions for Expert AI
function isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Count pieces on the board
function countPieces(board) {
    let count = 0;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] !== null) count++;
        }
    }
    return count;
}

// Simulate making a move on the board
function simulateMove(board, move, player) {
    // Create deep copy of the board
    const newBoard = JSON.parse(JSON.stringify(board));
    
    // Place the ion
    newBoard[move.row][move.col] = { color: player, protectionLevel: 0 };
    
    // Check if this creates vectors
    const vectorCount = checkVectorCreation(move.row, move.col, player, newBoard);
    
    if (vectorCount > 0) {
        // This is a node - set its protection level
        newBoard[move.row][move.col].protectionLevel = vectorCount;
        
        // Find positions to remove
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal down-right
            [1, -1]  // diagonal down-left
        ];
        
        for (const [dr, dc] of directions) {
            let count = 1;
            let positions = [];
            
            // Count in positive direction
            for (let i = 1; i < 4; i++) {
                const r = move.row + i * dr;
                const c = move.col + i * dc;
                
                if (isValidPosition(r, c) && newBoard[r][c] && 
                    newBoard[r][c].color === player) {
                    count++;
                    positions.push({row: r, col: c});
                } else {
                    break;
                }
            }
            
            // Count in negative direction
            for (let i = 1; i < 4; i++) {
                const r = move.row - i * dr;
                const c = move.col - i * dc;
                
                if (isValidPosition(r, c) && newBoard[r][c] && 
                    newBoard[r][c].color === player) {
                    count++;
                    positions.push({row: r, col: c});
                } else {
                    break;
                }
            }
            
            // If we have exactly 4 in a row, remove non-nodes
            if (count === 4) {
                for (const pos of positions) {
                    if (newBoard[pos.row][pos.col].protectionLevel === 0) {
                        newBoard[pos.row][pos.col] = null;
                    }
                }
            }
        }
    }
    
    return newBoard;
}

// Check for NExus (4 nodes in a line)
function checkForNexus(board, player) {
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            
            // Skip empty cells and non-nodes and opponent pieces
            if (!piece || piece.color !== player || piece.protectionLevel === 0) continue;
            
            // Check each direction
            for (const [dr, dc] of directions) {
                let count = 1;
                
                // Count nodes in this direction
                for (let i = 1; i < 4; i++) {
                    const r = row + i * dr;
                    const c = col + i * dc;
                    
                    if (isValidPosition(r, c) && board[r][c] && 
                        board[r][c].color === player && 
                        board[r][c].protectionLevel > 0) {
                        count++;
                    } else {
                        break;
                    }
                }
                
                if (count === 4) {
                    return true; // Nexus found
                }
            }
        }
    }
    
    return false;
}

// Check if a position is extending a connected line
function isExtendingConnected(board, move, player) {
    const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal down-right
        [1, -1]  // diagonal down-left
    ];
    
    for (const [dr, dc] of directions) {
        let count = 0;
        
        // Count in positive direction
        for (let i = 1; i < 4; i++) {
            const r = move.row + i * dr;
            const c = move.col + i * dc;
            
            if (isValidPosition(r, c) && board[r][c] && 
                board[r][c].color === player) {
                count++;
            } else {
                break;
            }
        }
        
        // Count in negative direction
        for (let i = 1; i < 4; i++) {
            const r = move.row - i * dr;
            const c = move.col - i * dc;
            
            if (isValidPosition(r, c) && board[r][c] && 
                board[r][c].color === player) {
                count++;
            } else {
                break;
            }
        }
        
        if (count >= 1) {
            return true; // Extending a line
        }
    }
    
    return false;
}

// Quick evaluation for move ordering
function quickEvaluateMove(board, move, player) {
    const opponent = player === 'white' ? 'black' : 'white';
    let score = 0;
    
    // Check for vector creation
    const vectorCount = checkVectorCreation(move.row, move.col, player, board);
    if (vectorCount > 0) {
        score += vectorCount * 100;
    }
    
    // Check for blocking opponent vectors
    const opponentVectorCount = checkVectorCreation(move.row, move.col, opponent, board);
    if (opponentVectorCount > 0) {
        score += opponentVectorCount * 80;
    }
    
    // Check for extending connected pieces
    if (isExtendingConnected(board, move, player)) {
        score += 50;
    }
    
    // Center control bonus
    score -= distanceFromCenter(move.row, move.col) * 5;
    
    return score;
}

// Count nodes with additional analysis of their values
function countNodesWithValue(board, player) {
    let simpleNodes = 0;
    let doubleNodes = 0;
    let tripleNodes = 0;
    let quadNodes = 0;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === player && piece.protectionLevel > 0) {
                switch(piece.protectionLevel) {
                    case 1: simpleNodes++; break;
                    case 2: doubleNodes++; break;
                    case 3: tripleNodes++; break;
                    case 4: quadNodes++; break;
                }
            }
        }
    }
    
    // Calculate total value, weighting higher-level nodes more
    const total = simpleNodes + (doubleNodes * 2) + (tripleNodes * 3) + (quadNodes * 4);
    
    return {
        simpleNodes,
        doubleNodes,
        tripleNodes,
        quadNodes,
        total
    };
}

// Evaluate center control
function evaluateCenterControl(board, player) {
    let control = 0;
    
    // Value increases toward center
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] && board[row][col].color === player) {
                // Calculate distance from center (0-7 scale, lower is better)
                const centerDistance = distanceFromCenter(row, col);
                // Award points inverse to distance (7-centerDistance gives 0-7, higher for center)
                control += (7 - centerDistance);
                
                // Extra points for nodes in central area
                if (board[row][col].protectionLevel > 0 && centerDistance <= 3) {
                    control += 5;
                }
            }
        }
    }
    
    return control;
}

// Evaluate potential for forming a Nexus
function evaluateNexusPotential(board, player) {
    let potential = 0;
    
    // Find all nodes
    const nodes = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] && board[row][col].color === player && 
                board[row][col].protectionLevel > 0) {
                nodes.push({row, col, level: board[row][col].protectionLevel});
            }
        }
    }
    
    // Not enough nodes for a Nexus
    if (nodes.length < 2) return 0;
    
    // Check each pair of nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const node1 = nodes[i];
            const node2 = nodes[j];
            
            // Calculate distance and direction
            const rowDiff = Math.abs(node1.row - node2.row);
            const colDiff = Math.abs(node1.col - node2.col);
            
            // Check if they're in line with each other (same row, column, or diagonal)
            if ((rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) && 
                Math.max(rowDiff, colDiff) <= 3) {
                
                // Nodes are aligned and within distance to form a Nexus
                // Add more value for closer nodes
                const distance = Math.max(rowDiff, colDiff);
                potential += (4 - distance) * 10;
                
                // Add value for higher quality nodes
                potential += (node1.level + node2.level) * 5;
                
                // Check if path between nodes is clear or can be made clear
                const pathValue = evaluatePathBetweenNodes(board, node1, node2, player);
                potential += pathValue;
            }
        }
    }
    
    return potential;
}

// Evaluate path between two nodes for Nexus potential
function evaluatePathBetweenNodes(board, node1, node2, player) {
    const rowStep = node1.row === node2.row ? 0 : 
                   (node2.row > node1.row ? 1 : -1);
    const colStep = node1.col === node2.col ? 0 : 
                   (node2.col > node1.col ? 1 : -1);
    
    let pathScore = 0;
    let distance = 0;
    
    // Start one step from first node
    let row = node1.row + rowStep;
    let col = node1.col + colStep;
    
    // Check each position in the path
    while (row !== node2.row || col !== node2.col) {
        distance++;
        
        // Check what's in this position
        const cell = board[row][col];
        
        if (!cell) {
            // Empty space - good for placing a future node
            pathScore += 10;
        } else if (cell.color === player) {
            // Our piece - this could become a node
            if (cell.protectionLevel > 0) {
                // Already a node - excellent!
                pathScore += 40;
            } else {
                // Regular piece that could become a node
                pathScore += 15;
            }
        } else {
            // Opponent piece - obstacle
            if (cell.protectionLevel > 0) {
                // Opponent node - major obstacle
                pathScore -= 30;
            } else {
                // Regular opponent piece - minor obstacle
                pathScore -= 10;
            }
        }
        
        // Move to next position
        row += rowStep;
        col += colStep;
    }
    
    // Return score, scaling down for longer paths
    return pathScore * (4 - distance);
}

// Analyze connected pieces (pairs and triples)
function analyzeConnections(board, player) {
    const connected = findConnectedIons(board, player);
    
    // Improve analysis by checking extendability
    let viablePairs = 0;
    let viableTriples = 0;
    
    // Analyze pairs for extendability
    for (const pair of connected.pairs) {
        // Check if either extension position is available
        for (const pos of pair.extendPositions) {
            if (isValidPosition(pos.row, pos.col) && 
                board[pos.row][pos.col] === null && 
                !wouldCreateLineTooLong(pos.row, pos.col, player, board)) {
                viablePairs++;
                break;
            }
        }
    }
    
    // Analyze triples for vector potential
    for (const triple of connected.triples) {
        // Check if either extension position is available
        for (const pos of triple.extendPositions) {
            if (isValidPosition(pos.row, pos.col) && 
                board[pos.row][pos.col] === null && 
                !wouldCreateLineTooLong(pos.row, pos.col, player, board)) {
                viableTriples++;
                break;
            }
        }
    }
    
    return {
        pairs: viablePairs,
        triples: viableTriples
    };
}

// Evaluate control of strategic board areas
function evaluatePositionalControl(board, player, opponent) {
    let score = 0;
    
    // Center control (4x4 center)
    let centerControl = 0;
    for (let row = 2; row <= 5; row++) {
        for (let col = 2; col <= 5; col++) {
            const cell = board[row][col];
            if (cell) {
                if (cell.color === player) {
                    centerControl++;
                    if (cell.protectionLevel > 0) centerControl++;
                } else {
                    centerControl--;
                    if (cell.protectionLevel > 0) centerControl--;
                }
            }
        }
    }
    score += centerControl * 10;
    
    // Strategic quadrants control
    const quadrants = [
        {startRow: 0, endRow: 3, startCol: 0, endCol: 3}, // Top-left
        {startRow: 0, endRow: 3, startCol: 4, endCol: 7}, // Top-right
        {startRow: 4, endRow: 7, startCol: 0, endCol: 3}, // Bottom-left
        {startRow: 4, endRow: 7, startCol: 4, endCol: 7}  // Bottom-right
    ];
    
    for (const q of quadrants) {
        let quadrantControl = 0;
        for (let row = q.startRow; row <= q.endRow; row++) {
            for (let col = q.startCol; col <= q.endCol; col++) {
                const cell = board[row][col];
                if (cell) {
                    if (cell.color === player) {
                        quadrantControl++;
                    } else {
                        quadrantControl--;
                    }
                }
            }
        }
        
        // Value balanced distribution across quadrants
        if (quadrantControl > 0) {
            score += 5;
        }
    }
    
    return score;
}

// Advanced board evaluation function
function evaluateBoardAdvanced(board, player, opponent) {
    let score = 0;
    
    // 1. Node count and quality
    const playerNodes = countNodesWithValue(board, player);
    const opponentNodes = countNodesWithValue(board, opponent);
    
    score += playerNodes.total * 150;
    score -= opponentNodes.total * 130;
    
    // Value higher level nodes even more
    score += playerNodes.doubleNodes * 50;
    score += playerNodes.tripleNodes * 120;
    score += playerNodes.quadNodes * 200;
    
    score -= opponentNodes.doubleNodes * 40;
    score -= opponentNodes.tripleNodes * 100;
    score -= opponentNodes.quadNodes * 180;
    
    // 2. Nexus potential (nodes that could form a Nexus)
    const playerNexusPotential = evaluateNexusPotential(board, player);
    const opponentNexusPotential = evaluateNexusPotential(board, opponent);
    
    score += playerNexusPotential * 70;
    score -= opponentNexusPotential * 80;
    
    // 3. Connected pieces analysis
    const playerConnections = analyzeConnections(board, player);
    const opponentConnections = analyzeConnections(board, opponent);
    
    score += playerConnections.pairs * 15;
    score += playerConnections.triples * 40;
    score -= opponentConnections.pairs * 10;
    score -= opponentConnections.triples * 50;
    
    // 4. Control of strategic areas
    score += evaluatePositionalControl(board, player, opponent);
    
    // 5. Mobility (available moves)
    const playerMobility = getLegalMoves(board, player).length;
    const opponentMobility = getLegalMoves(board, opponent).length;
    
    score += playerMobility * 3;
    score -= opponentMobility * 2;
    
    // 6. Board development stage adjustments
    const totalPieces = countPieces(board);
    if (totalPieces < 15) {
        // Early game: emphasize development and center control
        score += evaluateCenterControl(board, player) * 2;
        score -= evaluateCenterControl(board, opponent) * 1.5;
    } else if (totalPieces > 30) {
        // Late game: emphasize node connections and Nexus potential
        score += playerNexusPotential * 40;
        score -= opponentNexusPotential * 50;
    }
    
    return score;
}

// Order moves for more efficient alpha-beta pruning
function orderMoves(board, moves, player) {
    const scoredMoves = moves.map(move => {
        const score = quickEvaluateMove(board, move, player);
        return {...move, score};
    });
    
    return scoredMoves.sort((a, b) => b.score - a.score);
}

// Alpha-beta minimax algorithm for multi-turn lookahead
function alphaBetaMinimax(board, depth, alpha, beta, isMaximizing, player, opponent) {
    // Terminal conditions
    if (depth === 0) {
        return evaluateBoardAdvanced(board, player, opponent);
    }
    
    // Check for Nexus (game over)
    if (checkForNexus(board, player)) {
        return 10000; // Player wins
    }
    
    if (checkForNexus(board, opponent)) {
        return -10000; // Opponent wins
    }
    
    const currentPlayer = isMaximizing ? player : opponent;
    const legalMoves = getLegalMoves(board, currentPlayer);
    
    if (legalMoves.length === 0) {
        // No legal moves, evaluate final position
        return evaluateBoardAdvanced(board, player, opponent);
    }
    
    // Order moves to improve pruning
    const orderedMoves = orderMoves(board, legalMoves, currentPlayer);
    
    if (isMaximizing) {
        let maxEval = Number.NEGATIVE_INFINITY;
        for (const move of orderedMoves) {
            const newBoard = simulateMove(board, move, currentPlayer);
            const eval = alphaBetaMinimax(newBoard, depth - 1, alpha, beta, false, player, opponent);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return maxEval;
    } else {
        let minEval = Number.POSITIVE_INFINITY;
        for (const move of orderedMoves) {
            const newBoard = simulateMove(board, move, currentPlayer);
            const eval = alphaBetaMinimax(newBoard, depth - 1, alpha, beta, true, player, opponent);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return minEval;
    }
}

// Level 4: Expert AI - Highly sophisticated strategy with deeper lookahead
function getExpertAIMove(board, player) {
    const legalMoves = getLegalMoves(board, player);
    if (legalMoves.length === 0) return null;
    
    const opponent = player === 'white' ? 'black' : 'white';
    
    // 1. Instant win detection - always take a winning move
    for (const move of legalMoves) {
        const vectorCount = checkVectorCreation(move.row, move.col, player, board);
        if (vectorCount > 0) {
            // Check if this creates a Nexus
            const simulatedBoard = simulateMove(board, move, player);
            if (checkForNexus(simulatedBoard, player)) {
                console.log("Expert AI: Taking winning move");
                return move;
            }
        }
    }
    
    // 2. Prevent opponent instant win - always block
    for (const move of legalMoves) {
        const vectorCount = checkVectorCreation(move.row, move.col, opponent, board);
        if (vectorCount > 0) {
            // Check if this would create a Nexus for opponent
            const simulatedBoard = simulateMove(board, move, opponent);
            if (checkForNexus(simulatedBoard, opponent)) {
                console.log("Expert AI: Blocking opponent's winning move");
                return move;
            }
        }
    }
    
    // 3. Multi-turn lookahead analysis with alpha-beta pruning
    // Determine search depth based on game phase
    const pieceCount = countPieces(board);
    // Deeper search in early/mid-game, shallower in complex positions
    const searchDepth = pieceCount < 20 ? 3 : (pieceCount < 35 ? 2 : 1);
    
    console.log(`Expert AI: Using search depth ${searchDepth}`);
    
    // First get a quick preliminary score for each move to improve pruning
    const scoredMoves = [];
    for (const move of legalMoves) {
        const score = quickEvaluateMove(board, move, player);
        scoredMoves.push({...move, score});
    }
    
    // Sort moves by preliminary score to improve pruning efficiency
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Limit analysis to most promising moves to stay within time constraints
    const movesToAnalyze = Math.min(scoredMoves.length, 12); // Analyze at most 12 top moves
    
    let bestMove = scoredMoves[0]; // Default to highest preliminary score
    let bestScore = Number.NEGATIVE_INFINITY;
    
    // Use iterative deepening to ensure we get a result within time limit
    const startTime = Date.now();
    const timeLimit = 7000; // 7 seconds max (leaving buffer for other operations)
    
    for (let depth = 1; depth <= searchDepth; depth++) {
        let currentBestMove = null;
        let currentBestScore = Number.NEGATIVE_INFINITY;
        let timeOut = false;
        
        for (let i = 0; i < movesToAnalyze; i++) {
            if (Date.now() - startTime > timeLimit) {
                timeOut = true;
                break;
            }
            
            const move = scoredMoves[i];
            const newBoard = simulateMove(board, move, player);
            const score = alphaBetaMinimax(newBoard, depth, Number.NEGATIVE_INFINITY, 
                                        Number.POSITIVE_INFINITY, false, player, opponent);
            
            if (score > currentBestScore) {
                currentBestScore = score;
                currentBestMove = move;
            }
        }
        
        if (!timeOut && currentBestMove) {
            bestMove = currentBestMove;
            bestScore = currentBestScore;
        }
        
        if (timeOut) {
            console.log(`Expert AI: Time limit reached at depth ${depth-1}`);
            break;
        }
    }
    
    console.log(`Expert AI: Selected move with score ${bestScore}`);
    return bestMove;
}

// ==================== MAIN AI FUNCTION ====================

// Main AI function to select a move based on difficulty
function getAIMove(board, player, difficulty) {
    try {
        console.log(`AI thinking at difficulty level ${difficulty}...`);
        
        const legalMoves = getLegalMoves(board, player);
        if (legalMoves.length === 0) {
            console.log("No legal moves available");
            return null;
        }
        
        switch(difficulty) {
            case 1:
                return getEasyAIMove(board, player);
            case 2:
                return getMediumAIMove(board, player);
            case 3:
                return getHardAIMove(board, player);
            case 4:
                return getExpertAIMove(board, player);
            default:
                return getMediumAIMove(board, player);
        }
    } catch (error) {
        console.error("AI Move Error:", error);
        // Fallback to random move
        const legalMoves = getLegalMoves(board, player);
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
}