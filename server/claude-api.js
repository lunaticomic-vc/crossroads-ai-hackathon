import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Connection types for the game
export const CONNECTION_TYPES = {
    SEMANTIC: 'Semantic Association',
    PATTERN: 'Letter Pattern Sharing',
    CATEGORY: 'Categorical Membership',
    SEQUENTIAL: 'Sequential/Temporal',
    PHONETIC: 'Phonetic Similarity',
    ETYMOLOGICAL: 'Etymological/Root Connection'
};

export async function generateWordGraph() {
    const prompt = `You are creating a word puzzle game. Generate a connected graph of 9-12 English words that form a crossword-style grid.

Requirements:
1. Words must connect by sharing exactly ONE letter at intersection points (like a crossword)
2. Each word connection must follow one of these 6 connection types:
   - Semantic Association: Related by meaning (ocean → wave → surf)
   - Letter Pattern Sharing: Common letter sequences (CAT → CATCH → CATHEDRAL)
   - Categorical Membership: Same category (apple → banana → mango)
   - Sequential/Temporal: Time/process sequence (seed → sprout → plant)
   - Phonetic Similarity: Similar sounds/rhymes (cat → hat → rat)
   - Etymological/Root Connection: Shared linguistic roots (transport → transfer → transmit)

3. Create a balanced mix of connection types
4. Words should be 3-8 letters long
5. The graph should be fully connected (all words reachable from each other)
6. Words should fit on a grid (horizontal or vertical placement)

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
      "explanation": "Brief explanation of connection"
    }
  ]
}

Where:
- position: grid coordinates (0-indexed)
- direction: "horizontal" or "vertical"
- sharedLetterIndex1/2: index of shared letter in each word (0-indexed)
- Ensure words actually connect at the specified positions with the shared letter

Generate the puzzle now:`;

    try {
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            temperature: 1,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const responseText = message.content[0].text;
        
        // Try to extract JSON from the response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }
        
        const puzzleData = JSON.parse(jsonMatch[0]);
        
        // Validate the structure
        if (!puzzleData.words || !puzzleData.connections) {
            throw new Error('Invalid puzzle structure');
        }
        
        return puzzleData;
    } catch (error) {
        console.error('Error generating word graph:', error);
        throw error;
    }
}

export async function validateUserSolution(gameState) {
    // Build the full puzzle description
    const wordsDescription = gameState.words.map((w, idx) => {
        const displayWord = w.revealed ? w.word : w.userWord;
        return `${idx}: "${displayWord}" at (${w.position.row}, ${w.position.col}) ${w.direction}`;
    }).join('\n');
    
    const connectionsDescription = gameState.connections.map(c => {
        const w1 = gameState.words.find(w => w.id === c.word1);
        const w2 = gameState.words.find(w => w.id === c.word2);
        const word1Text = w1.revealed ? w1.word : w1.userWord;
        const word2Text = w2.revealed ? w2.word : w2.userWord;
        return `"${word1Text}" ↔ "${word2Text}" (Type: ${c.connectionType}, Shared: ${c.sharedLetter})`;
    }).join('\n');

    const prompt = `You are validating a word puzzle solution. The user has filled in a crossword-style word grid where words connect by sharing single letters.

ORIGINAL PUZZLE WORDS AND POSITIONS:
${wordsDescription}

CONNECTIONS (with connection types):
${connectionsDescription}

Your task:
1. Check if the user's filled words form valid logical connections as claimed by the connection types
2. Verify that words actually share the specified letters at intersection points
3. The solution is valid if the connections make logical sense, even if they differ from the original AI intent
4. Be generous - accept creative but reasonable connections

Analyze each connection and provide:
1. A boolean "isValid" (true if all connections are logically sound)
2. A "feedback" string with overall assessment
3. An array "details" with analysis of each connection

Return ONLY valid JSON (no markdown):
{
  "isValid": true/false,
  "feedback": "Overall assessment of the solution",
  "details": [
    "Connection analysis for each word pair"
  ]
}`;

    try {
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const responseText = message.content[0].text;
        
        // Extract JSON
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in validation response');
        }
        
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error validating solution:', error);
        throw error;
    }
}
