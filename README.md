# Word Crossroads - AI Word Puzzle Game

An interactive word puzzle game where AI generates connected word graphs and players fill in missing words based on logical relationships.

## 🎮 Game Features

- **AI-Generated Puzzles**: OpenAI GPT-4 creates unique word puzzles with logical connections
- **Google Sign-In**: Log in with your Google account to track your progress and maintain streaks
- **Daily Streaks**: Track consecutive days of playing and completing puzzles
- **Topic Selection**: Choose from preset topics or enter custom themes for personalized puzzles
- **Difficulty Levels**: Easy, Medium, and Hard with varying complexity and word counts
- **6 Connection Types**: Words connect through:
  - 🧠 **Semantic Association** - Related meanings
  - 🔤 **Letter Pattern Sharing** - Common letter sequences
  - 📁 **Categorical Membership** - Same category words
  - 🔄 **Sequential/Temporal** - Time/process sequences
  - 🔊 **Phonetic Similarity** - Similar sounds/rhymes
  - 📚 **Etymological/Root Connection** - Shared linguistic roots
- **Interactive Canvas**: Beautiful grid-based interface with hover effects
- **Smart Validation**: AI validates your solution and accepts creative logical connections
- **Progressive Difficulty**: Different reveal ratios based on difficulty level

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- OpenAI API key
- Google Cloud Project (for Google Sign-In)

### Installation

1. **Get your OpenAI API key**
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Generate an API key

2. **Set up Google OAuth (Optional)**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Set authorized redirect URIs to: `http://localhost:3000/auth/google/callback`
   - Note down the Client ID and Client Secret

3. **Set up the project**
   ```bash
   # The dependencies are already installed
   # Just configure your environment variables
   ```

4. **Configure environment variables**
   
   Create a `.env` file based on `env-template.txt`:
   ```bash
   # Required
   OPENAI_API_KEY=your_actual_api_key_here
   SESSION_SECRET=your_super_secret_session_key_here
   
   # Optional (for Google Sign-In)
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   
   # Optional
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

5. **Start the server**
   ```bash
   npm start
   ```

5. **Open the game**
   
   Navigate to `http://localhost:3000` in your browser

## 🎯 How to Play

1. **Start a New Game**
   - Click "New Game" button
   - AI generates a connected word graph
   - ~1/3 of words are revealed (shown in green)

2. **Fill in Missing Words**
   - Click on empty word slots (shown with underscores)
   - Enter your word guess in the modal
   - Words must:
     - Match the required length
     - Share the correct letter at intersection points
     - Form logical connections with adjacent words

3. **Get Hints**
   - Click "Show Hint" for clues about:
     - Word length
     - Direction (horizontal/vertical)
     - Connection types to adjacent words

4. **Validate Your Solution**
   - Once all words are filled, click "Validate Puzzle"
   - AI analyzes your connections
   - Accepts any valid logical path (not just the original!)

## 📁 Project Structure

```
crossroads-ai-hackathon/
├── public/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── styles.css      # Game styling
│   └── js/
│       └── game.js         # Frontend game logic
├── server/
│   ├── server.js           # Express server
│   ├── claude-api.js       # Claude API integration
│   └── game-logic.js       # Game state management
├── .env                    # Environment variables
├── package.json            # Dependencies
└── README.md              # This file
```

## 🛠️ API Endpoints

- `POST /api/new-game` - Generate a new puzzle
- `POST /api/validate` - Validate user's solution
- `GET /api/game/:gameId` - Get game state
- `GET /api/health` - Server health check

## 🎨 Features in Detail

### Visual Design
- Modern gradient backgrounds
- Smooth animations and transitions
- Hover effects on interactive elements
- Modal dialogs for input
- Loading indicators during AI processing

### Game Mechanics
- Grid-based word placement (crossword style)
- Words connect by sharing single letters
- Strategic word reveal (spread across grid)
- Real-time validation
- Connection visualization

### AI Integration
- Claude Sonnet 4.5 for puzzle generation
- Intelligent validation of logical connections
- Generous acceptance of creative solutions
- Detailed feedback on connections

## 🔧 Development

### Run in development mode
```bash
npm run dev
```

This uses Node's watch mode to auto-restart on file changes.

### Environment Variables
```bash
ANTHROPIC_API_KEY=your_api_key    # Required: Claude API key
PORT=3000                          # Optional: Server port (default: 3000)
```

## 📝 Game Logic

1. **Puzzle Generation**
   - AI creates 9-12 connected words
   - Words arranged in crossword grid
   - Each connection has a specific type
   - Balanced mix of connection categories

2. **Word Revelation**
   - 1/3 of words shown initially
   - Strategic distribution across grid
   - Ensures solvability

3. **Validation Process**
   - Checks letter intersections
   - Validates logical connections
   - AI provides detailed feedback
   - Accepts alternative valid solutions

## 🎯 Tips for Players

- Pay attention to revealed words - they're clues!
- Think about multiple connection types
- Don't just match letters - consider meaning
- Creative connections are accepted!
- Use hints when stuck

## 🐛 Troubleshooting

**Game won't start:**
- Check your ANTHROPIC_API_KEY in .env
- Ensure Node.js is installed
- Verify port 3000 is available

**API errors:**
- Verify API key is valid
- Check internet connection
- Review server console logs

**Validation issues:**
- Ensure all words are filled
- Check letter intersections match
- Consider connection logic

## 🚀 Future Enhancements

- Difficulty levels (more/fewer revealed words)
- Score tracking
- Multiplayer mode
- Puzzle sharing
- Custom word lists
- Timed challenges
- Achievement system

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

Built with:
- Express.js
- Claude Sonnet 4.5 (Anthropic)
- Canvas API
- Modern CSS3

Created for the Crossroads AI Hackathon 2025
