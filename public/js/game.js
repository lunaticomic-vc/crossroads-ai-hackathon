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
        
        // Zoom and pan settings
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
        this.minZoom = 0.5;
        this.maxZoom = 3;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
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
        
        // Zoom control listeners
        document.getElementById('zoom-in-btn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-view-btn').addEventListener('click', () => this.resetView());
        
        // Canvas listeners
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Initialize hover state
        this.hoveredNode = null;
        
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
        const maxHeight = 600;
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        // Reset word positions so they get recalculated
        this.wordPositions = null;
        
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
        if (!this.gameState || this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panX) / this.zoomLevel;
        const y = (e.clientY - rect.top - this.panY) / this.zoomLevel;
        
        const nodeIndex = this.getNodeAtPosition(x, y);
        if (nodeIndex !== null) {
            const word = this.gameState.words[nodeIndex];
            if (!word.revealed && !word.userWord) {
                this.showWordInputModal(word);
            }
        }
    }

    handleCanvasHover(e) {
        if (!this.gameState) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panX) / this.zoomLevel;
        const y = (e.clientY - rect.top - this.panY) / this.zoomLevel;
        
        if (this.isDragging) {
            // Pan the view
            this.panX += e.clientX - this.lastMousePos.x;
            this.panY += e.clientY - this.lastMousePos.y;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.render();
            return;
        }
        
        const nodeIndex = this.getNodeAtPosition(x, y);
        this.hoveredNode = nodeIndex;
        this.render();
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel * zoomFactor));
        
        // Zoom towards mouse position
        const zoomChange = newZoom / this.zoomLevel;
        this.panX = mouseX - (mouseX - this.panX) * zoomChange;
        this.panY = mouseY - (mouseY - this.panY) * zoomChange;
        
        this.zoomLevel = newZoom;
        this.render();
    }

    getNodeAtPosition(x, y) {
        if (!this.wordPositions) return null;
        
        for (let i = 0; i < this.wordPositions.length; i++) {
            const pos = this.wordPositions[i];
            const word = this.gameState.words[i];
            const isSharedWord = pos.isShared || (word.chainIds && word.chainIds.length > 1);
            const nodeRadius = isSharedWord ? 45 : 35;
            
            const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            if (distance <= nodeRadius) {
                return i;
            }
        }
        return null;
    }

    showWordInputModal(word) {
        const modal = document.getElementById('input-modal');
        const input = document.getElementById('word-input');
        
        // Find the word index for display
        const wordIndex = this.gameState.words.findIndex(w => w.id === word.id);
        document.getElementById('modal-position').textContent = `Node ${wordIndex + 1}`;
        document.getElementById('modal-length').textContent = word.word.length;
        
        // Find connections to revealed words
        const connections = this.gameState.connections.filter(c => 
            c.word1 === word.id || c.word2 === word.id
        );
        
        let connectingInfo = 'Discover the connections!';
        if (connections.length > 0) {
            const revealedConnections = connections.filter(c => {
                const otherWordId = c.word1 === word.id ? c.word2 : c.word1;
                const otherWord = this.gameState.words.find(w => w.id === otherWordId);
                return otherWord && (otherWord.revealed || otherWord.userWord);
            });
            
            if (revealedConnections.length > 0) {
                const conn = revealedConnections[0];
                const otherWordId = conn.word1 === word.id ? conn.word2 : conn.word1;
                const otherWord = this.gameState.words.find(w => w.id === otherWordId);
                const otherWordText = otherWord.revealed ? otherWord.word : otherWord.userWord;
                connectingInfo = `Connected to "${otherWordText}" by ${conn.connectionType}`;
            }
        }
        
        document.getElementById('modal-connection').textContent = connectingInfo;
        
        input.value = word.userWord || '';
        input.focus();
        modal.style.display = 'block';
        
        this.currentEditingWord = word;
    }

    submitWord() {
        const input = document.getElementById('word-input');
        const word = input.value.trim().toUpperCase();
        
        if (!this.currentEditingWord) return;
        
        if (word.length !== this.currentEditingWord.word.length) {
            alert(`Word must be exactly ${this.currentEditingWord.word.length} letters long.`);
            return;
        }
        
        if (!/^[A-Z]+$/.test(word)) {
            alert('Word must contain only letters.');
            return;
        }
        
        this.currentEditingWord.userWord = word;
        this.closeModal();
        this.updateGameInfo();
        this.render();
    }

    closeModal() {
        document.getElementById('input-modal').style.display = 'none';
        this.currentEditingWord = null;
    }

    closeResultModal() {
        document.getElementById('result-modal').style.display = 'none';
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
        
        // Apply zoom and pan transformations
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoomLevel, this.zoomLevel);
        
        this.drawGrid();
        this.drawConnections();
        this.drawWords();
        this.drawChainLabels();
        
        this.ctx.restore();
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
        // No grid needed for graph visualization
        // Draw a subtle background pattern instead
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Draw a subtle dot pattern
        for (let x = 50; x < this.canvas.width; x += 50) {
            for (let y = 50; y < this.canvas.height; y += 50) {
                this.ctx.beginPath();
                this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fill();
            }
        }
    }

    drawWords() {
        if (!this.wordPositions) {
            this.calculateWordPositions();
        }

        this.gameState.words.forEach((word, index) => {
            const pos = this.wordPositions[index];
            const isRevealed = word.revealed || word.userWord;
            const displayText = word.revealed ? word.word : (word.userWord || '?'.repeat(word.word.length));
            const isSharedWord = pos.isShared || (word.chainIds && word.chainIds.length > 1);
            
            // Node size - larger for shared words
            const nodeRadius = isSharedWord ? 45 : 35;
            
            // Draw node circle
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
            
            // Node background color based on state
            if (word.revealed) {
                this.ctx.fillStyle = isSharedWord ? 'rgba(16, 185, 129, 0.9)' : 'rgba(16, 185, 129, 0.8)';
            } else if (word.userWord) {
                this.ctx.fillStyle = isSharedWord ? 'rgba(99, 102, 241, 0.9)' : 'rgba(99, 102, 241, 0.8)';
            } else {
                this.ctx.fillStyle = isSharedWord ? 'rgba(75, 85, 99, 0.9)' : 'rgba(75, 85, 99, 0.8)';
            }
            
            this.ctx.fill();
            
            // Special border for shared words
            if (isSharedWord) {
                this.ctx.strokeStyle = '#fbbf24';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            // Node border
            this.ctx.strokeStyle = isRevealed ? '#10b981' : '#374151';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Hover effect
            if (this.hoveredNode === index) {
                this.ctx.strokeStyle = '#f59e0b';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();
            }
            
            // Word text
            this.ctx.fillStyle = '#ffffff';
            const fontSize = isSharedWord ? 11 : 10;
            this.ctx.font = `bold ${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Split long words into multiple lines
            if (displayText.length > 8) {
                const midPoint = Math.floor(displayText.length / 2);
                const line1 = displayText.substring(0, midPoint);
                const line2 = displayText.substring(midPoint);
                this.ctx.fillText(line1, pos.x, pos.y - 6);
                this.ctx.fillText(line2, pos.x, pos.y + 6);
            } else {
                this.ctx.fillText(displayText, pos.x, pos.y);
            }
            
            // Chain indicator for shared words
            if (isSharedWord && word.chainIds) {
                this.ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
                this.ctx.font = '8px Arial';
                this.ctx.fillText(`${word.chainIds.length} chains`, pos.x, pos.y + nodeRadius + 15);
            }
        });
    }

    calculateWordPositions() {
        if (!this.gameState.chains) {
            // Fallback to circular layout for old format
            this.calculateCircularLayout();
            return;
        }

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.wordPositions = new Array(this.gameState.words.length);
        
        // Position each chain in a different area
        this.gameState.chains.forEach((chain, chainIndex) => {
            const chainAngle = (2 * Math.PI * chainIndex) / this.gameState.chains.length;
            const chainRadius = Math.min(this.canvas.width, this.canvas.height) * 0.25;
            
            // Calculate chain center
            const chainCenterX = centerX + chainRadius * Math.cos(chainAngle);
            const chainCenterY = centerY + chainRadius * Math.sin(chainAngle);
            
            // Position words in the chain sequentially
            chain.wordIds.forEach((wordId, wordIndex) => {
                const globalWordIndex = this.gameState.words.findIndex(w => w.id === wordId);
                if (globalWordIndex === -1) return;
                
                // Create a line of words for each chain
                const wordSpacing = 80;
                const chainLength = (chain.wordIds.length - 1) * wordSpacing;
                const startX = chainCenterX - chainLength / 2;
                
                const x = startX + wordIndex * wordSpacing;
                const y = chainCenterY + (chainIndex % 2 === 0 ? 0 : 40); // Offset alternate chains
                
                this.wordPositions[globalWordIndex] = { x, y, chainId: chain.id };
            });
        });
        
        // Handle shared words - position them at intersection points
        this.positionSharedWords();
    }

    calculateCircularLayout() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
        const wordCount = this.gameState.words.length;
        
        this.wordPositions = [];
        
        for (let i = 0; i < wordCount; i++) {
            const angle = (2 * Math.PI * i) / wordCount;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.wordPositions.push({ x, y });
        }
    }

    positionSharedWords() {
        // Find words that appear in multiple chains
        this.gameState.words.forEach((word, wordIndex) => {
            if (word.chainIds && word.chainIds.length > 1) {
                // This word connects multiple chains - position it at their intersection
                const chainPositions = word.chainIds.map(chainId => {
                    const chain = this.gameState.chains.find(c => c.id === chainId);
                    const chainIndex = this.gameState.chains.indexOf(chain);
                    const chainAngle = (2 * Math.PI * chainIndex) / this.gameState.chains.length;
                    const chainRadius = Math.min(this.canvas.width, this.canvas.height) * 0.25;
                    
                    return {
                        x: this.canvas.width / 2 + chainRadius * Math.cos(chainAngle),
                        y: this.canvas.height / 2 + chainRadius * Math.sin(chainAngle)
                    };
                });
                
                // Average the positions of connected chains
                const avgX = chainPositions.reduce((sum, pos) => sum + pos.x, 0) / chainPositions.length;
                const avgY = chainPositions.reduce((sum, pos) => sum + pos.y, 0) / chainPositions.length;
                
                this.wordPositions[wordIndex] = { 
                    x: avgX, 
                    y: avgY, 
                    isShared: true,
                    chainIds: word.chainIds 
                };
            }
        });
    }

    drawConnections() {
        if (!this.wordPositions) return;
        
        // Define connection type colors and styles
        const connectionStyles = {
            'Sequential': { color: '#3b82f6', dash: [], width: 4 },
            'Chain Bridge': { color: '#f59e0b', dash: [10, 10], width: 3 },
            'Semantic Association': { color: '#10b981', dash: [5, 5], width: 3 },
            'Categorical Membership': { color: '#8b5cf6', dash: [], width: 2 },
            'Letter Pattern Sharing': { color: '#ef4444', dash: [2, 8], width: 2 }
        };
        
        this.gameState.connections.forEach(conn => {
            const word1Index = this.gameState.words.findIndex(w => w.id === conn.word1);
            const word2Index = this.gameState.words.findIndex(w => w.id === conn.word2);
            
            if (word1Index === -1 || word2Index === -1) return;
            
            // Skip self-references (chain bridges are handled differently)
            if (word1Index === word2Index) return;
            
            const pos1 = this.wordPositions[word1Index];
            const pos2 = this.wordPositions[word2Index];
            
            const style = connectionStyles[conn.connectionType] || { color: '#6b7280', dash: [], width: 2 };
            
            // Draw connection line
            this.ctx.strokeStyle = style.color;
            this.ctx.lineWidth = style.width;
            this.ctx.setLineDash(style.dash);
            
            // Calculate line endpoints (edge of circles, not center)
            const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
            const nodeRadius = 35;
            const startX = pos1.x + nodeRadius * Math.cos(angle);
            const startY = pos1.y + nodeRadius * Math.sin(angle);
            const endX = pos2.x - nodeRadius * Math.cos(angle);
            const endY = pos2.y - nodeRadius * Math.sin(angle);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // Draw arrow head for sequential connections
            if (conn.connectionType === 'Sequential') {
                const arrowLength = 12;
                const arrowAngle = Math.PI / 6;
                
                this.ctx.beginPath();
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(
                    endX - arrowLength * Math.cos(angle - arrowAngle),
                    endY - arrowLength * Math.sin(angle - arrowAngle)
                );
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(
                    endX - arrowLength * Math.cos(angle + arrowAngle),
                    endY - arrowLength * Math.sin(angle + arrowAngle)
                );
                this.ctx.stroke();
            }
            
            // Draw step number for sequential connections
            if (conn.connectionType === 'Sequential' && conn.step) {
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
                this.ctx.fill();
                
                this.ctx.strokeStyle = style.color;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                this.ctx.fillStyle = style.color;
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(conn.step.toString(), midX, midY);
            }
        });
        
        this.ctx.setLineDash([]);
    }

    drawChainLabels() {
        if (!this.gameState.chains) return;
        
        this.gameState.chains.forEach((chain, chainIndex) => {
            // Find the center of the chain
            const chainWordPositions = chain.wordIds.map(wordId => {
                const wordIndex = this.gameState.words.findIndex(w => w.id === wordId);
                return this.wordPositions[wordIndex];
            }).filter(pos => pos);
            
            if (chainWordPositions.length === 0) return;
            
            const centerX = chainWordPositions.reduce((sum, pos) => sum + pos.x, 0) / chainWordPositions.length;
            const centerY = chainWordPositions.reduce((sum, pos) => sum + pos.y, 0) / chainWordPositions.length;
            
            // Draw chain theme label
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(centerX - 80, centerY - 80, 160, 30);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`Chain ${chainIndex + 1}`, centerX, centerY - 70);
            
            this.ctx.fillStyle = '#cccccc';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(chain.theme, centerX, centerY - 55);
        });
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

    zoomIn() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const zoomFactor = 1.2;
        const newZoom = Math.min(this.maxZoom, this.zoomLevel * zoomFactor);
        
        const zoomChange = newZoom / this.zoomLevel;
        this.panX = centerX - (centerX - this.panX) * zoomChange;
        this.panY = centerY - (centerY - this.panY) * zoomChange;
        
        this.zoomLevel = newZoom;
        this.render();
    }

    zoomOut() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const zoomFactor = 0.8;
        const newZoom = Math.max(this.minZoom, this.zoomLevel * zoomFactor);
        
        const zoomChange = newZoom / this.zoomLevel;
        this.panX = centerX - (centerX - this.panX) * zoomChange;
        this.panY = centerY - (centerY - this.panY) * zoomChange;
        
        this.zoomLevel = newZoom;
        this.render();
    }

    resetView() {
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
        this.render();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new WordCrossroadsGame();
});
