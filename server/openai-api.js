import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let openai = null;
let demoMode = false;

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not found - running in DEMO mode');
    console.warn('📝 To use OpenAI GPT-4, create a .env file with your API key:');
    console.warn('   OPENAI_API_KEY=your_openai_api_key_here');
    console.warn('🔗 Get your API key from: https://platform.openai.com/');
    demoMode = true;
} else {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI API initialized successfully');
}

// Connection types for the game
export const CONNECTION_TYPES = {
    SEMANTIC: 'Semantic Association',
    PATTERN: 'Letter Pattern Sharing',
    CATEGORY: 'Categorical Membership',
    SEQUENTIAL: 'Sequential/Temporal',
    PHONETIC: 'Phonetic Similarity',
    ETYMOLOGICAL: 'Etymological/Root Connection'
};

const DEMO_PUZZLES = {
    animals: {
        easy: {
            words: [
                { word: "CAT", position: { row: 0, col: 0 }, direction: "horizontal" },
                { word: "DOG", position: { row: 1, col: 1 }, direction: "horizontal" },
                { word: "BAT", position: { row: 2, col: 0 }, direction: "horizontal" },
                { word: "COW", position: { row: 0, col: 2 }, direction: "vertical" },
                { word: "OWL", position: { row: 1, col: 3 }, direction: "vertical" }
            ],
            connections: [
                { word1Index: 0, word2Index: 1, connectionType: "Categorical Membership", sharedLetterIndex1: 2, sharedLetterIndex2: 0, explanation: "Both are common pets" },
                { word1Index: 0, word2Index: 2, connectionType: "Phonetic Similarity", sharedLetterIndex1: 1, sharedLetterIndex2: 1, explanation: "Both have 'AT' sound" },
                { word1Index: 0, word2Index: 3, connectionType: "Categorical Membership", sharedLetterIndex1: 2, sharedLetterIndex2: 0, explanation: "Both are animals" },
                { word1Index: 1, word2Index: 4, connectionType: "Letter Pattern Sharing", sharedLetterIndex1: 2, sharedLetterIndex2: 0, explanation: "Both end with similar sounds" }
            ]
        },
        medium: {
            words: [
                { word: "TIGER", position: { row: 0, col: 0 }, direction: "horizontal" },
                { word: "EAGLE", position: { row: 1, col: 1 }, direction: "horizontal" },
                { word: "SHARK", position: { row: 2, col: 0 }, direction: "horizontal" },
                { word: "WHALE", position: { row: 0, col: 4 }, direction: "vertical" },
                { word: "GECKO", position: { row: 1, col: 2 }, direction: "vertical" },
                { word: "HORSE", position: { row: 3, col: 1 }, direction: "horizontal" },
                { word: "SNAKE", position: { row: 2, col: 3 }, direction: "vertical" }
            ],
            connections: [
                { word1Index: 0, word2Index: 1, connectionType: "Categorical Membership", sharedLetterIndex1: 4, sharedLetterIndex2: 0, explanation: "Both are predators" },
                { word1Index: 0, word2Index: 2, connectionType: "Semantic Association", sharedLetterIndex1: 2, sharedLetterIndex2: 1, explanation: "Both are fierce hunters" },
                { word1Index: 1, word2Index: 4, connectionType: "Letter Pattern Sharing", sharedLetterIndex1: 2, sharedLetterIndex2: 0, explanation: "Both contain 'G'" },
                { word1Index: 2, word2Index: 6, connectionType: "Categorical Membership", sharedLetterIndex1: 0, sharedLetterIndex2: 0, explanation: "Both are reptiles/have scales" },
                { word1Index: 3, word2Index: 5, connectionType: "Sequential/Temporal", sharedLetterIndex1: 1, sharedLetterIndex2: 0, explanation: "Size progression in mammals" }
            ]
        }
    },
    technology: {
        easy: {
            words: [
                { word: "PHONE", position: { row: 0, col: 0 }, direction: "horizontal" },
                { word: "EMAIL", position: { row: 1, col: 1 }, direction: "horizontal" },
                { word: "MOUSE", position: { row: 2, col: 0 }, direction: "horizontal" },
                { word: "SCREEN", position: { row: 0, col: 2 }, direction: "vertical" },
                { word: "LAPTOP", position: { row: 1, col: 3 }, direction: "vertical" }
            ],
            connections: [
                { word1Index: 0, word2Index: 1, connectionType: "Semantic Association", sharedLetterIndex1: 3, sharedLetterIndex2: 0, explanation: "Both are communication tools" },
                { word1Index: 0, word2Index: 3, connectionType: "Categorical Membership", sharedLetterIndex1: 2, sharedLetterIndex2: 2, explanation: "Both are electronic devices" },
                { word1Index: 2, word2Index: 4, connectionType: "Semantic Association", sharedLetterIndex1: 2, sharedLetterIndex2: 2, explanation: "Both are computer peripherals" }
            ]
        }
    }
};

function getDemoPuzzle(difficulty = 'medium', topic = null) {
    // Select appropriate demo puzzle based on topic and difficulty
    const topicKey = topic?.toLowerCase() || 'animals';
    const availableTopics = Object.keys(DEMO_PUZZLES);
    const selectedTopic = availableTopics.includes(topicKey) ? topicKey : 'animals';
    
    const topicPuzzles = DEMO_PUZZLES[selectedTopic];
    const availableDifficulties = Object.keys(topicPuzzles);
    const selectedDifficulty = availableDifficulties.includes(difficulty) ? difficulty : 'easy';
    
    console.log(`🎮 Using demo puzzle: ${selectedTopic} - ${selectedDifficulty}`);
    return DEMO_PUZZLES[selectedTopic][selectedDifficulty];
}

export async function generateWordGraph(difficulty = 'medium', topic = null) {
    if (demoMode) {
        // In demo mode, return a predefined puzzle
        const demoPuzzle = getDemoPuzzle(difficulty, topic);
        return demoPuzzle;
    }

    // Define difficulty parameters
    const difficultyConfig = {
        easy: {
            wordCount: '5-7',
            wordLength: '3-6',
            complexity: 'simple and common',
            connectionTypes: 'primarily semantic and categorical',
            description: 'Use basic vocabulary and clear, direct relationships. Focus on obvious connections.'
        },
        medium: {
            wordCount: '8-10',
            wordLength: '4-7',
            complexity: 'moderate',
            connectionTypes: 'balanced mix of all types',
            description: 'Mix of common and moderately advanced vocabulary. Include various connection types.'
        },
        hard: {
            wordCount: '11-15',
            wordLength: '4-8',
            complexity: 'challenging and sophisticated',
            connectionTypes: 'heavy emphasis on etymological, phonetic, and pattern connections',
            description: 'Use advanced vocabulary and complex relationships. Prioritize subtle and intellectual connections.'
        }
    };

    const config = difficultyConfig[difficulty] || difficultyConfig.medium;

    // Build topic instruction
    const topicInstruction = topic 
        ? `TOPIC REQUIREMENT: All words must be related to the theme "${topic}". Choose words that fit naturally within this topic while maintaining the required connections and difficulty level.`
        : 'Choose words from any general categories to create interesting and varied connections.';

    const prompt = `You are creating a word puzzle game. Generate a connected graph of ${config.wordCount} English words that form a crossword-style grid.

${topicInstruction}

Difficulty Level: ${difficulty.toUpperCase()}
${config.description}

Requirements:
1. Words must connect by sharing exactly ONE letter at intersection points (like a crossword)
2. Each word connection must follow one of these 6 connection types:
   - Semantic Association: Related by meaning (ocean → wave → surf)
   - Letter Pattern Sharing: Common letter sequences (CAT → CATCH → CATHEDRAL)
   - Categorical Membership: Same category (apple → banana → mango)
   - Sequential/Temporal: Time/process sequence (seed → sprout → plant)
   - Phonetic Similarity: Similar sounds/rhymes (cat → hat → rat)
   - Etymological/Root Connection: Shared linguistic roots (transport → transfer → transmit)

3. Connection types: ${config.connectionTypes}
4. Words should be ${config.wordLength} letters long
5. Vocabulary should be ${config.complexity}
6. The graph should be fully connected (all words reachable from each other)
7. Words should fit on a grid (horizontal or vertical placement)

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "words": [
    {
      "word": "WORD",
      "position": {"row": 0, "col": 0},
      "direction": "horizontal"
    }
  ],
  "connections": [
    {
      "word1Index": 0,
      "word2Index": 1,
      "connectionType": "Semantic Association",
      "sharedLetterIndex1": 2,
      "sharedLetterIndex2": 0,
      "explanation": "Both words relate to water"
    }
  ]
}

Ensure:
- All words intersect properly with shared letters
- Positions create a valid crossword grid
- Each connection has proper indices and explanations
- No word appears twice
- Grid is compact and aesthetically pleasing`;

    try {
        console.log('Generating puzzle with OpenAI GPT-4...');
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert puzzle designer. Always respond with valid JSON only, no additional text or markdown formatting."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        const content = response.choices[0].message.content.trim();
        console.log('Raw OpenAI response:', content);

        // Clean the response to ensure it's valid JSON
        let cleanedContent = content;
        
        // Remove markdown code blocks if present
        if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        try {
            const puzzleData = JSON.parse(cleanedContent);
            
            // Validate the structure
            if (!puzzleData.words || !puzzleData.connections) {
                throw new Error('Invalid puzzle structure: missing words or connections');
            }

            console.log(`Generated puzzle with ${puzzleData.words.length} words and ${puzzleData.connections.length} connections`);
            return puzzleData;

        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            console.error('Cleaned content:', cleanedContent);
            throw new Error('Failed to parse puzzle data from OpenAI response');
        }

    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error(`Failed to generate puzzle: ${error.message}`);
    }
}

export async function validateUserSolution(gameState, userWords) {
    // Use demo validation if no API key
    if (demoMode) {
        console.log('🎮 Using demo validation (no OpenAI API key provided)');
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        // Simple demo validation - just check if words are filled
        const totalWords = gameState.words.length;
        const filledWords = userWords.filter(w => w && w.trim()).length;
        const score = Math.round((filledWords / totalWords) * 100);
        
        return {
            isValid: score >= 70,
            score: score,
            feedback: {
                correct: userWords.slice(0, Math.floor(filledWords * 0.8)),
                incorrect: userWords.slice(Math.floor(filledWords * 0.8)),
                connections: gameState.connections.map(conn => ({
                    word1: gameState.words[conn.word1Index]?.word || 'Unknown',
                    word2: gameState.words[conn.word2Index]?.word || 'Unknown',
                    connectionType: conn.connectionType,
                    isValid: true,
                    explanation: conn.explanation
                }))
            },
            overallFeedback: score >= 70 
                ? "Great job! Your solution shows good understanding of the word relationships." 
                : "Good attempt! Try to think about how the words might be connected thematically."
        };
    }

    try {
        console.log('Validating solution with OpenAI GPT-4...');
        
        // Prepare the data for validation
        const solutionData = {
            originalWords: gameState.words.map(w => ({
                word: w.word,
                position: w.position,
                direction: w.direction,
                revealed: w.revealed
            })),
            userWords: userWords,
            connections: gameState.connections
        };

        const prompt = `You are validating a word puzzle solution. Analyze whether the user's words fit the crossword grid and maintain the logical connections.

Original puzzle data:
${JSON.stringify(solutionData, null, 2)}

Validation criteria:
1. Each user word must fit in the correct grid position and direction
2. Shared letters at intersections must match exactly
3. Each connection between words must be logically valid based on the connection type
4. Words should be real English words
5. Words should maintain the thematic consistency if there's a topic

For each user word, check:
- Is it a valid English word?
- Does it fit the grid position/direction?
- Do the shared letters match at intersections?
- Does it maintain logical connections with connected words?

Return ONLY a valid JSON object with this structure:
{
  "isValid": true/false,
  "score": 0-100,
  "feedback": {
    "correct": ["list of correct words"],
    "incorrect": [
      {
        "word": "user's word",
        "position": "position identifier",
        "issues": ["issue1", "issue2"],
        "suggestion": "suggested correct word or hint"
      }
    ],
    "connections": [
      {
        "word1": "word1",
        "word2": "word2",
        "connectionType": "type",
        "isValid": true/false,
        "explanation": "why this connection works or doesn't work"
      }
    ]
  },
  "overallFeedback": "General feedback about the solution"
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert word puzzle validator. Always respond with valid JSON only, no additional text or markdown formatting."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.3,
        });

        const content = response.choices[0].message.content.trim();
        
        // Clean the response
        let cleanedContent = content;
        if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        try {
            const validationResult = JSON.parse(cleanedContent);
            console.log('Validation completed successfully');
            return validationResult;

        } catch (parseError) {
            console.error('JSON parsing error in validation:', parseError);
            console.error('Cleaned content:', cleanedContent);
            
            // Return a fallback validation result
            return {
                isValid: false,
                score: 0,
                feedback: {
                    correct: [],
                    incorrect: [],
                    connections: []
                },
                overallFeedback: "Validation service encountered an error. Please try again."
            };
        }

    } catch (error) {
        console.error('OpenAI validation error:', error);
        
        // Return a fallback validation result
        return {
            isValid: false,
            score: 0,
            feedback: {
                correct: [],
                incorrect: [],
                connections: []
            },
            overallFeedback: "Validation service is currently unavailable. Please try again later."
        };
    }
}
