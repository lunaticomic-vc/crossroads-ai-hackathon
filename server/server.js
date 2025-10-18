import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameLogic } from './game-logic.js';
import { validateUserSolution } from './claude-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory game storage (for demo purposes)
// In production, you'd want to use a database
const activeGames = new Map();

// API Routes

// Create a new game
app.post('/api/new-game', async (req, res) => {
    try {
        console.log('Creating new game...');
        const gameState = await GameLogic.createNewGame();
        
        // Generate game ID
        const gameId = Date.now().toString();
        activeGames.set(gameId, gameState);
        
        // Add game ID to response
        gameState.gameId = gameId;
        
        console.log(`Game created successfully with ${gameState.words.length} words`);
        console.log(`Revealed ${gameState.words.filter(w => w.revealed).length} words`);
        
        res.json(gameState);
    } catch (error) {
        console.error('Error creating new game:', error);
        res.status(500).json({ 
            error: 'Failed to create new game', 
            details: error.message 
        });
    }
});

// Validate the user's solution
app.post('/api/validate', async (req, res) => {
    try {
        const { gameState } = req.body;
        
        if (!gameState) {
            return res.status(400).json({ error: 'Game state is required' });
        }
        
        console.log('Validating puzzle...');
        
        // First, check for basic structural issues
        const intersectionIssues = GameLogic.validateIntersections(gameState);
        
        if (intersectionIssues.length > 0) {
            console.log('Intersection issues found:', intersectionIssues);
            return res.json({
                isValid: false,
                feedback: 'Some words do not properly intersect at the connection points.',
                details: intersectionIssues.map(issue => 
                    `${issue.word1} ↔ ${issue.word2}: ${issue.issue}`
                )
            });
        }
        
        // Then use Claude to validate logical connections
        const validation = await validateUserSolution(gameState);
        
        console.log('Validation result:', validation.isValid);
        
        res.json(validation);
    } catch (error) {
        console.error('Error validating puzzle:', error);
        res.status(500).json({ 
            error: 'Failed to validate puzzle', 
            details: error.message 
        });
    }
});

// Get game state (for resume functionality)
app.get('/api/game/:gameId', (req, res) => {
    const { gameId } = req.params;
    const gameState = activeGames.get(gameId);
    
    if (!gameState) {
        return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(gameState);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        activeGames: activeGames.size,
        timestamp: new Date().toISOString()
    });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        details: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎮 Word Crossroads Game Server`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Make sure to set your ANTHROPIC_API_KEY in the .env file`);
    console.log(`\nPress Ctrl+C to stop the server`);
});

// Cleanup old games periodically (every hour)
setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let cleaned = 0;
    
    for (const [gameId, gameState] of activeGames.entries()) {
        if (parseInt(gameId) < oneHourAgo) {
            activeGames.delete(gameId);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} old game(s)`);
    }
}, 60 * 60 * 1000);
