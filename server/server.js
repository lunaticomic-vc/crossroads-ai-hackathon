import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { GameLogic } from './game-logic.js';
import { validateUserSolution } from './openai-api.js';
import { AuthService } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize auth service
const authService = new AuthService();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.CLIENT_URL, process.env.PRODUCTION_URL].filter(Boolean)
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));
app.use(express.static(path.join(__dirname, '../public')));

// In-memory game storage (for demo purposes)
// In production, you'd want to use a database
const activeGames = new Map();

// API Routes

// Authentication Routes

// Get client configuration
app.get('/api/config', (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || null,
        authEnabled: !!process.env.GOOGLE_CLIENT_ID
    });
});

// Get Google OAuth URL
app.get('/auth/google', (req, res) => {
    const authUrl = authService.getAuthUrl();
    res.json({ authUrl });
});

// Handle Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect('/?error=auth_failed');
        }
        
        const userInfo = await authService.handleCallback(code);
        
        // Store user ID in session
        req.session.userId = userInfo.id;
        
        // Redirect to game with success
        res.redirect('/?auth=success');
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/?error=auth_failed');
    }
});

// Verify Google ID Token (for frontend login)
app.post('/auth/google/verify', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        
        const userInfo = await authService.verifyGoogleToken(token);
        
        // Store user info and session
        authService.storeUserSession(userInfo);
        req.session.userId = userInfo.id;
        
        res.json({
            success: true,
            user: {
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Get current user info
app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = authService.getUser(req.session.userId);
    const streak = authService.getStreak(req.session.userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture
        },
        streak
    });
});

// Get user streak
app.get('/api/streak', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const streak = authService.getStreak(req.session.userId);
    res.json(streak);
});

// Logout
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true });
    });
});

// Create a new game
app.post('/api/new-game', async (req, res) => {
    try {
        const { difficulty, topic } = req.body;
        console.log(`Creating new game with difficulty: ${difficulty}, topic: ${topic}`);
        const gameState = await GameLogic.createNewGame(difficulty, topic);
        
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
        
        // Update streak if user is logged in and completed the puzzle
        if (req.session.userId && validation.isValid) {
            authService.updateStreak(req.session.userId, true);
        } else if (req.session.userId) {
            authService.updateStreak(req.session.userId, false);
        }
        
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

// Get app configuration
app.get('/api/config', (req, res) => {
    res.json({
        authEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        googleClientId: process.env.GOOGLE_CLIENT_ID || null
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        activeGames: activeGames.size,
        authEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        uptime: process.uptime()
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
    console.log(`🤖 Using OpenAI GPT-4 for puzzle generation`);
    console.log(`📝 Add OPENAI_API_KEY to .env file for full GPT-4 features`);
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
