import { generateWordGraph } from './openai-api.js';

export class GameLogic {
    static async createNewGame(difficulty = 'medium', topic = null) {
        try {
            // Generate puzzle from OpenAI with difficulty and topic
            const puzzleData = await generateWordGraph(difficulty, topic);
            
            // Check if data is already in the new chain format
            if (puzzleData.chains) {
                // New chain format - use directly
                this.revealInitialWords(puzzleData, difficulty);
                return puzzleData;
            } else {
                // Old format - process the puzzle data into game state
                const gameState = this.processPuzzleData(puzzleData);
                this.revealInitialWords(gameState, difficulty);
                return gameState;
            }
        } catch (error) {
            console.error('Error creating new game:', error);
            throw error;
        }
    }

    static processPuzzleData(puzzleData) {
        // Convert puzzle data to game state format
        const words = puzzleData.words.map((wordData, index) => ({
            id: `word-${index}`,
            word: wordData.word.toUpperCase(),
            position: wordData.position,
            direction: wordData.direction,
            revealed: false,
            userWord: null
        }));

        // Process connections
        const connections = puzzleData.connections.map(conn => {
            const word1 = words[conn.word1Index];
            const word2 = words[conn.word2Index];
            
            // Get the shared letter
            const sharedLetter = word1.word[conn.sharedLetterIndex1];
            
            return {
                word1: word1.id,
                word2: word2.id,
                connectionType: conn.connectionType,
                sharedLetter: sharedLetter,
                sharedLetterIndex1: conn.sharedLetterIndex1,
                sharedLetterIndex2: conn.sharedLetterIndex2,
                explanation: conn.explanation
            };
        });

        // Calculate grid size
        const gridSize = this.calculateGridSize(words);

        return {
            words,
            connections,
            gridSize,
            grid: this.createGrid(words, gridSize)
        };
    }

    static calculateGridSize(words) {
        let maxRow = 0;
        let maxCol = 0;

        words.forEach(word => {
            const endRow = word.direction === 'vertical' 
                ? word.position.row + word.word.length - 1 
                : word.position.row;
            const endCol = word.direction === 'horizontal' 
                ? word.position.col + word.word.length - 1 
                : word.position.col;

            maxRow = Math.max(maxRow, endRow);
            maxCol = Math.max(maxCol, endCol);
        });

        return {
            rows: maxRow + 1,
            cols: maxCol + 1
        };
    }

    static createGrid(words, gridSize) {
        // Create empty grid
        const grid = Array(gridSize.rows).fill(null).map(() => 
            Array(gridSize.cols).fill(null)
        );

        // Fill grid with word IDs
        words.forEach(word => {
            for (let i = 0; i < word.word.length; i++) {
                const row = word.direction === 'vertical' 
                    ? word.position.row + i 
                    : word.position.row;
                const col = word.direction === 'horizontal' 
                    ? word.position.col + i 
                    : word.position.col;

                if (!grid[row][col]) {
                    grid[row][col] = [];
                }
                grid[row][col].push({
                    wordId: word.id,
                    letterIndex: i
                });
            }
        });

        return grid;
    }

    static revealInitialWords(gameState, difficulty = 'medium') {
        const totalWords = gameState.words.length;
        
        // Determine how many words to reveal based on difficulty
        let revealRatio;
        switch (difficulty) {
            case 'easy':
                revealRatio = 0.5; // Reveal 50% of words
                break;
            case 'medium':
                revealRatio = 0.33; // Reveal 33% of words
                break;
            case 'hard':
                revealRatio = 0.25; // Reveal 25% of words
                break;
            default:
                revealRatio = 0.33;
        }
        
        const wordsToReveal = Math.max(1, Math.ceil(totalWords * revealRatio));
        
        // Shuffle and pick words to reveal
        const shuffled = [...gameState.words].sort(() => Math.random() - 0.5);
        
        // Try to spread revealed words across the grid
        const revealed = [];
        
        // First, try to pick words that are well-distributed
        for (let i = 0; i < shuffled.length && revealed.length < wordsToReveal; i++) {
            const word = shuffled[i];
            
            // Check if this word is connected to already revealed words
            const hasRevealedNeighbor = revealed.some(revealedWord => {
                return gameState.connections.some(conn => 
                    (conn.word1 === word.id && conn.word2 === revealedWord.id) ||
                    (conn.word2 === word.id && conn.word1 === revealedWord.id)
                );
            });
            
            // Prefer words that don't have revealed neighbors for better spread
            if (revealed.length === 0 || !hasRevealedNeighbor || revealed.length >= wordsToReveal - 2) {
                word.revealed = true;
                revealed.push(word);
            }
        }
        
        // If we haven't revealed enough words, just reveal the rest
        if (revealed.length < wordsToReveal) {
            for (let i = 0; i < shuffled.length && revealed.length < wordsToReveal; i++) {
                if (!shuffled[i].revealed) {
                    shuffled[i].revealed = true;
                    revealed.push(shuffled[i]);
                }
            }
        }
    }

    static validateIntersections(gameState) {
        // Check if words correctly intersect at connection points
        const issues = [];

        gameState.connections.forEach(conn => {
            const word1 = gameState.words.find(w => w.id === conn.word1);
            const word2 = gameState.words.find(w => w.id === conn.word2);

            if (!word1 || !word2) return;

            const word1Text = word1.revealed ? word1.word : word1.userWord;
            const word2Text = word2.revealed ? word2.word : word2.userWord;

            if (!word1Text || !word2Text) return;

            // Get letters at connection points
            const letter1 = word1Text[conn.sharedLetterIndex1];
            const letter2 = word2Text[conn.sharedLetterIndex2];

            if (letter1 !== letter2) {
                issues.push({
                    connection: conn,
                    word1: word1Text,
                    word2: word2Text,
                    issue: `Letters don't match: ${letter1} vs ${letter2}`
                });
            }

            // Calculate actual grid positions and verify they match
            let pos1Row, pos1Col, pos2Row, pos2Col;
            
            if (word1.direction === 'horizontal') {
                pos1Row = word1.position.row;
                pos1Col = word1.position.col + conn.sharedLetterIndex1;
            } else {
                pos1Row = word1.position.row + conn.sharedLetterIndex1;
                pos1Col = word1.position.col;
            }

            if (word2.direction === 'horizontal') {
                pos2Row = word2.position.row;
                pos2Col = word2.position.col + conn.sharedLetterIndex2;
            } else {
                pos2Row = word2.position.row + conn.sharedLetterIndex2;
                pos2Col = word2.position.col;
            }

            if (pos1Row !== pos2Row || pos1Col !== pos2Col) {
                issues.push({
                    connection: conn,
                    word1: word1Text,
                    word2: word2Text,
                    issue: `Words don't intersect at specified positions`
                });
            }
        });

        return issues;
    }
}
