import { OAuth2Client } from 'google-auth-library';
import { createHash } from 'crypto';

class AuthService {
    constructor() {
        this.client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
        );
        
        // In-memory user storage (in production, use a database)
        this.users = new Map();
        this.userStreaks = new Map();
    }

    // Generate Google OAuth URL
    getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];

        return this.client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            include_granted_scopes: true
        });
    }

    // Verify Google token and get user info
    async verifyGoogleToken(token) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            
            const payload = ticket.getPayload();
            return {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                verified: payload.email_verified
            };
        } catch (error) {
            console.error('Error verifying Google token:', error);
            throw new Error('Invalid token');
        }
    }

    // Handle OAuth callback
    async handleCallback(code) {
        try {
            const { tokens } = await this.client.getToken(code);
            
            if (tokens.id_token) {
                const userInfo = await this.verifyGoogleToken(tokens.id_token);
                this.storeUserSession(userInfo);
                return userInfo;
            }
            
            throw new Error('No ID token received');
        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            throw error;
        }
    }

    // Store user session
    storeUserSession(userInfo) {
        this.users.set(userInfo.id, {
            ...userInfo,
            lastLogin: new Date(),
            createdAt: this.users.has(userInfo.id) ? this.users.get(userInfo.id).createdAt : new Date()
        });
    }

    // Get user by ID
    getUser(userId) {
        return this.users.get(userId);
    }

    // Streak management
    updateStreak(userId, completed = false) {
        const today = new Date().toDateString();
        let streak = this.userStreaks.get(userId) || {
            current: 0,
            longest: 0,
            lastPlayed: null,
            gamesPlayed: 0,
            gamesCompleted: 0
        };

        // Check if this is a new day
        if (streak.lastPlayed !== today) {
            const lastPlayedDate = streak.lastPlayed ? new Date(streak.lastPlayed) : null;
            const todayDate = new Date(today);
            
            if (lastPlayedDate) {
                const daysDiff = Math.floor((todayDate - lastPlayedDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 1) {
                    // Consecutive day - continue streak
                    streak.current++;
                } else if (daysDiff > 1) {
                    // Streak broken
                    streak.current = 1;
                } else {
                    // Same day - don't change streak but update other stats
                }
            } else {
                // First time playing
                streak.current = 1;
            }
            
            streak.lastPlayed = today;
        }

        // Update game stats
        streak.gamesPlayed++;
        if (completed) {
            streak.gamesCompleted++;
        }

        // Update longest streak
        if (streak.current > streak.longest) {
            streak.longest = streak.current;
        }

        this.userStreaks.set(userId, streak);
        return streak;
    }

    // Get user streak
    getStreak(userId) {
        return this.userStreaks.get(userId) || {
            current: 0,
            longest: 0,
            lastPlayed: null,
            gamesPlayed: 0,
            gamesCompleted: 0
        };
    }

    // Generate session token
    generateSessionToken(userId) {
        const hash = createHash('sha256');
        hash.update(userId + Date.now() + Math.random());
        return hash.digest('hex');
    }
}

export { AuthService };
