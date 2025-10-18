// Game state management
class WordCrossroadsGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = null;
        this.selectedCell = null;
        this.hoveredCell = null;
        this.selectedDifficulty = null;
        this.selectedTopic = null;
        
        // Canvas settings
        this.cellSize = 50;
        this.padding = 40;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTopicSelection();
        this.setupDifficultySelection();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupEventListeners() {
        // Button listeners
        document.getElementById('new-game-btn').addEventListener('click', () => {
            console.log('New game button clicked');
            this.startNewGame();
        });
        document.getElementById('validate-btn').addEventListener('click', () => {
            console.log('Validate button clicked');
            this.validatePuzzle();
        });
        document.getElementById('hint-btn').addEventListener('click', () => {
            console.log('Hint button clicked');
            this.showHint();
        });
        document.getElementById('back-to-menu').addEventListener('click', () => {
            console.log('Back to menu button clicked');
            this.showTopicScreen();
        });
        document.getElementById('change-topic-btn').addEventListener('click', () => {
            console.log('Change topic button clicked');
            this.showTopicScreen();
        });
        document.getElementById('custom-topic-btn').addEventListener('click', () => {
            console.log('Custom topic button clicked');
            this.handleCustomTopic();
        });
        
        // Canvas listeners
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        
        // Modal listeners
        document.getElementById('submit-word-btn').addEventListener('click', () => this.submitWord());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('close-result-btn').addEventListener('click', () => this.closeResultModal());
        
        // Input listeners
        document.getElementById('word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitWord();
        });
        
        document.getElementById('topic-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleCustomTopic();
        });
        
        // Input listener
        document.getElementById('word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitWord();
        });
    }

    setupDifficultySelection() {
        // Add click listeners to difficulty cards
        const difficultyCards = document.querySelectorAll('.difficulty-card');
        difficultyCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selection
                difficultyCards.forEach(c => c.classList.remove('selected'));
                // Add selection to clicked card
                card.classList.add('selected');
                
                // Store selected difficulty
                this.selectedDifficulty = card.dataset.difficulty;
                
                // Start game after a short delay to show selection
                setTimeout(() => {
                    this.showGameScreen();
                    this.startNewGame();
                }, 800);
            });
        });
    }

    setupTopicSelection() {
        // Add click listeners to preset topic cards
        const topicCards = document.querySelectorAll('.topic-card');
        console.log('Found topic cards:', topicCards.length);
        topicCards.forEach(card => {
            card.addEventListener('click', () => {
                const topic = card.dataset.topic;
                console.log('Topic card clicked:', topic);
                this.selectTopic(topic);
            });
        });
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const maxWidth = container.clientWidth - 40;
        const maxHeight = 700;
        
        if (this.gameState && this.gameState.grid) {
            const gridWidth = this.gameState.gridSize.cols * this.cellSize + this.padding * 2;
            const gridHeight = this.gameState.gridSize.rows * this.cellSize + this.padding * 2;
            
            this.canvas.width = Math.min(gridWidth, maxWidth);
            this.canvas.height = Math.min(gridHeight, maxHeight);
        } else {
            this.canvas.width = maxWidth;
            this.canvas.height = maxHeight;
        }
        
        this.render();
    }

    async startNewGame() {
        this.showLoading(true);
        try {
            const requestBody = {};
            if (this.selectedDifficulty) {
                requestBody.difficulty = this.selectedDifficulty;
            }
            if (this.selectedTopic) {
                requestBody.topic = this.selectedTopic;
            }
            
            const response = await fetch('/api/new-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) throw new Error('Failed to start new game');
            
            this.gameState = await response.json();
            this.resizeCanvas();
            this.updateGameInfo();
            document.getElementById('validate-btn').disabled = false;
            document.getElementById('game-status').textContent = 'In Progress';
        } catch (error) {
            console.error('Error starting new game:', error);
            alert('Failed to start new game. Please check your OpenAI API key in .env file.');
        } finally {
            this.showLoading(false);
        }
    }

    async validatePuzzle() {
        if (!this.gameState) return;
        
        // Check if all words are filled
        const emptyCount = this.gameState.words.filter(w => !w.revealed && !w.userWord).length;
        if (emptyCount > 0) {
            alert(`Please fill in all ${emptyCount} remaining word(s) before validating.`);
            return;
        }
        
        this.showLoading(true);
        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameState: this.gameState })
            });
            
            if (!response.ok) throw new Error('Validation failed');
            
            const result = await response.json();
            this.showValidationResult(result);
        } catch (error) {
            console.error('Error validating puzzle:', error);
            alert('Failed to validate puzzle. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    showValidationResult(result) {
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('result-title');
        const content = document.getElementById('result-content');
        
        if (result.isValid) {
            title.textContent = '🎉 Puzzle Solved!';
            title.className = 'success-text';
        } else {
            title.textContent = '❌ Puzzle Incomplete';
            title.className = 'error-text';
        }
        
        let html = `<p><strong>Overall Result:</strong> <span class="${result.isValid ? 'success-text' : 'error-text'}">${result.isValid ? 'Valid Solution!' : 'Invalid Solution'}</span></p>`;
        html += `<p>${result.feedback}</p>`;
        
        if (result.details && result.details.length > 0) {
            html += '<h4>Connection Analysis:</h4><ul>';
            result.details.forEach(detail => {
                html += `<li>${detail}</li>`;
            });
            html += '</ul>';
        }
        
        content.innerHTML = html;
        modal.classList.add('active');
    }

    showHint() {
        if (!this.gameState || !this.gameState.words) {
            alert('Start a new game first!');
            return;
        }
        
        const emptyWords = this.gameState.words.filter(w => !w.revealed && !w.userWord);
        if (emptyWords.length === 0) {
            alert('All words are filled! Click "Validate Puzzle" to check your solution.');
            return;
        }
        
        const randomWord = emptyWords[Math.floor(Math.random() * emptyWords.length)];
        const connections = this.gameState.connections.filter(c => 
            c.word1 === randomWord.id || c.word2 === randomWord.id
        );
        
        let hint = `Hint for word at position (${randomWord.position.row}, ${randomWord.position.col}):\n\n`;
        hint += `Word length: ${randomWord.word.length} letters\n`;
        hint += `Direction: ${randomWord.direction}\n\n`;
        
        if (connections.length > 0) {
            hint += `Connection types:\n`;
            connections.forEach(conn => {
                hint += `- ${conn.connectionType}\n`;
            });
        }
        
        alert(hint);
    }

    handleCanvasClick(e) {
        if (!this.gameState) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cell = this.getCellAtPosition(x, y);
        if (!cell) return;
        
        const word = this.gameState.words.find(w => 
            this.isPositionInWord(cell.row, cell.col, w)
        );
        
        if (word && !word.revealed && !word.userWord) {
            this.selectedCell = cell;
            this.showWordInputModal(word);
        }
    }

    handleCanvasHover(e) {
        if (!this.gameState) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cell = this.getCellAtPosition(x, y);
        this.hoveredCell = cell;
        this.render();
    }

    getCellAtPosition(x, y) {
        const col = Math.floor((x - this.padding) / this.cellSize);
        const row = Math.floor((y - this.padding) / this.cellSize);
        
        if (row >= 0 && row < this.gameState.gridSize.rows && 
            col >= 0 && col < this.gameState.gridSize.cols) {
            return { row, col };
        }
        return null;
    }

    isPositionInWord(row, col, word) {
        const { position, direction } = word;
        const length = word.word.length;
        
        if (direction === 'horizontal') {
            return row === position.row && 
                   col >= position.col && 
                   col < position.col + length;
        } else {
            return col === position.col && 
                   row >= position.row && 
                   row < position.row + length;
        }
    }

    showWordInputModal(word) {
        const modal = document.getElementById('input-modal');
        const input = document.getElementById('word-input');
        
        document.getElementById('modal-position').textContent = 
            `Row ${word.position.row + 1}, Col ${word.position.col + 1}`;
        document.getElementById('modal-length').textContent = word.word.length;
        
        // Find connecting letter
        const connections = this.gameState.connections.filter(c => 
            c.word1 === word.id || c.word2 === word.id
        );
        
        let connectingInfo = 'None visible yet';
        if (connections.length > 0) {
            const revealedConnections = connections.filter(c => {
                const otherWordId = c.word1 === word.id ? c.word2 : c.word1;
                const otherWord = this.gameState.words.find(w => w.id === otherWordId);
                return otherWord && (otherWord.revealed || otherWord.userWord);
            });
            
            if (revealedConnections.length > 0) {
                const conn = revealedConnections[0];
                connectingInfo = conn.sharedLetter;
            }
        }
        
        document.getElementById('modal-connection').textContent = connectingInfo;
        
        input.value = '';
        input.setAttribute('maxlength', word.word.length);
        modal.classList.add('active');
        input.focus();
        
        this.currentWordToFill = word;
    }

    submitWord() {
        const input = document.getElementById('word-input');
        const word = input.value.trim().toUpperCase();
        
        if (word.length !== this.currentWordToFill.word.length) {
            alert(`Word must be exactly ${this.currentWordToFill.word.length} letters long.`);
            return;
        }
        
        if (!/^[A-Z]+$/.test(word)) {
            alert('Word must contain only letters.');
            return;
        }
        
        this.currentWordToFill.userWord = word;
        this.closeModal();
        this.updateGameInfo();
        this.render();
    }

    closeModal() {
        document.getElementById('input-modal').classList.remove('active');
        this.currentWordToFill = null;
    }

    closeResultModal() {
        document.getElementById('result-modal').classList.remove('active');
    }

    updateGameInfo() {
        if (!this.gameState) return;
        
        const filled = this.gameState.words.filter(w => w.revealed || w.userWord).length;
        const total = this.gameState.words.length;
        
        document.getElementById('words-filled').textContent = filled;
        document.getElementById('total-words').textContent = total;
        
        if (filled === total) {
            document.getElementById('game-status').textContent = 'Ready to Validate';
        }
    }

    showWelcomeScreen() {
        // This method is now replaced by showTopicScreen()
        this.showTopicScreen();
    }

    showGameScreen() {
        document.getElementById('topic-screen').style.display = 'none';
        document.getElementById('difficulty-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        
        // Update difficulty indicator
        if (this.selectedDifficulty) {
            document.getElementById('current-difficulty').textContent = 
                this.selectedDifficulty.charAt(0).toUpperCase() + this.selectedDifficulty.slice(1);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('active');
        } else {
            loading.classList.remove('active');
        }
    }

    render() {
        if (!this.gameState) {
            this.renderWelcomeScreen();
            return;
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawWords();
        this.drawConnections();
    }

    renderWelcomeScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#6366f1';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Click "New Game" to start!', this.canvas.width / 2, this.canvas.height / 2);
    }

    drawGrid() {
        const { rows, cols } = this.gameState.gridSize;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row <= rows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, this.padding + row * this.cellSize);
            this.ctx.lineTo(this.padding + cols * this.cellSize, this.padding + row * this.cellSize);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= cols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding + col * this.cellSize, this.padding);
            this.ctx.lineTo(this.padding + col * this.cellSize, this.padding + rows * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawWords() {
        this.gameState.words.forEach(word => {
            const displayWord = word.revealed ? word.word : (word.userWord || '_'.repeat(word.word.length));
            const { row, col } = word.position;
            
            for (let i = 0; i < displayWord.length; i++) {
                const cellRow = word.direction === 'horizontal' ? row : row + i;
                const cellCol = word.direction === 'horizontal' ? col + i : col;
                
                const x = this.padding + cellCol * this.cellSize;
                const y = this.padding + cellRow * this.cellSize;
                
                // Highlight hovered cell
                if (this.hoveredCell && 
                    this.hoveredCell.row === cellRow && 
                    this.hoveredCell.col === cellCol) {
                    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                }
                
                // Cell background
                if (word.revealed) {
                    this.ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                } else if (word.userWord) {
                    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
                } else {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                }
                this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
                
                // Letter
                this.ctx.fillStyle = word.revealed ? '#10b981' : (word.userWord ? '#6366f1' : '#666');
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    displayWord[i],
                    x + this.cellSize / 2,
                    y + this.cellSize / 2
                );
            }
        });
    }

    drawConnections() {
        this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.gameState.connections.forEach(conn => {
            const word1 = this.gameState.words.find(w => w.id === conn.word1);
            const word2 = this.gameState.words.find(w => w.id === conn.word2);
            
            if (!word1 || !word2) return;
            
            const pos1 = this.getWordCenter(word1);
            const pos2 = this.getWordCenter(word2);
            
            this.ctx.beginPath();
            this.ctx.moveTo(pos1.x, pos1.y);
            this.ctx.lineTo(pos2.x, pos2.y);
            this.ctx.stroke();
        });
        
        this.ctx.setLineDash([]);
    }

    getWordCenter(word) {
        const { row, col } = word.position;
        const length = word.word.length;
        
        let centerRow, centerCol;
        if (word.direction === 'horizontal') {
            centerRow = row;
            centerCol = col + length / 2;
        } else {
            centerRow = row + length / 2;
            centerCol = col;
        }
        
        return {
            x: this.padding + centerCol * this.cellSize,
            y: this.padding + centerRow * this.cellSize
        };
    }

    selectTopic(topic) {
        this.selectedTopic = topic;
        console.log('Selected topic:', topic);
        
        // Update the selected topic display
        document.getElementById('selected-topic').textContent = topic;
        
        // Show difficulty selection screen
        this.showDifficultyScreen();
    }

    handleCustomTopic() {
        const topicInput = document.getElementById('topic-input');
        const customTopic = topicInput.value.trim();
        
        if (!customTopic) {
            alert('Please enter a topic');
            return;
        }
        
        console.log('Custom topic entered:', customTopic);
        this.selectTopic(customTopic);
    }

    showTopicScreen() {
        document.getElementById('topic-screen').style.display = 'block';
        document.getElementById('difficulty-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'none';
        
        // Reset selections
        this.selectedTopic = null;
        this.selectedDifficulty = null;
        
        // Clear topic input
        document.getElementById('topic-input').value = '';
    }

    showDifficultyScreen() {
        document.getElementById('topic-screen').style.display = 'none';
        document.getElementById('difficulty-screen').style.display = 'block';
        document.getElementById('game-screen').style.display = 'none';
        
        // Clear any previous difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new WordCrossroadsGame();
});
