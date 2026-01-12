// Chinese Character Stroke Learning App

class StrokeLearningApp {
    constructor() {
        this.writer = null;
        this.currentChar = '你';
        this.currentLevel = 1;
        this.isQuizMode = false;
        this.strokeCount = 0;
        this.mistakeCount = 0;
        this.outlineVisible = false;

        this.initElements();
        this.initEventListeners();
        this.loadHSKLevel(1);
        this.loadCharacter('你');
    }

    initElements() {
        // Input elements
        this.characterInput = document.getElementById('character-input');
        this.searchBtn = document.getElementById('search-btn');

        // HSK elements
        this.hskTabs = document.querySelectorAll('.hsk-tab');
        this.characterGrid = document.getElementById('character-grid');

        // Display elements
        this.currentCharDisplay = document.getElementById('current-char-display');
        this.currentCharPinyin = document.getElementById('current-char-pinyin');
        this.currentCharMeaning = document.getElementById('current-char-meaning');
        this.writerTarget = document.getElementById('character-target');

        // Mode buttons
        this.viewModeBtn = document.getElementById('view-mode-btn');
        this.practiceModeBtn = document.getElementById('practice-mode-btn');

        // Control buttons
        this.animateBtn = document.getElementById('animate-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.resetBtn = document.getElementById('reset-btn');

        // Feedback elements
        this.feedback = document.getElementById('feedback');
        this.strokeCountDisplay = document.getElementById('stroke-count');
    }

    initEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.searchCharacter());
        this.characterInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCharacter();
        });

        // HSK tabs
        this.hskTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const level = parseInt(tab.dataset.level);
                this.loadHSKLevel(level);
            });
        });

        // Mode buttons
        this.viewModeBtn.addEventListener('click', () => this.setViewMode());
        this.practiceModeBtn.addEventListener('click', () => this.setPracticeMode());

        // Control buttons
        this.animateBtn.addEventListener('click', () => this.animate());
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.resetBtn.addEventListener('click', () => this.reset());
    }

    loadHSKLevel(level) {
        this.currentLevel = level;

        // Update active tab
        this.hskTabs.forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.level) === level);
        });

        // Load characters into grid
        const characters = HSK_DATA[level] || [];
        this.characterGrid.innerHTML = '';

        characters.forEach(charData => {
            const btn = document.createElement('button');
            btn.className = 'char-btn';
            btn.textContent = charData.char;
            btn.title = `${charData.pinyin} - ${charData.meaning}`;
            btn.addEventListener('click', () => {
                this.loadCharacter(charData.char);
                // Update active state
                this.characterGrid.querySelectorAll('.char-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            this.characterGrid.appendChild(btn);
        });
    }

    searchCharacter() {
        const char = this.characterInput.value.trim();
        if (char && this.isChinese(char)) {
            this.loadCharacter(char.charAt(0));
            this.characterInput.value = '';
        } else {
            this.showFeedback('Please enter a valid Chinese character', 'error');
        }
    }

    isChinese(str) {
        return /[\u4e00-\u9fff]/.test(str);
    }

    findCharacterInfo(char) {
        for (const level in HSK_DATA) {
            const found = HSK_DATA[level].find(c => c.char === char);
            if (found) return found;
        }
        return null;
    }

    loadCharacter(char) {
        this.currentChar = char;
        this.mistakeCount = 0;

        // Update display
        this.currentCharDisplay.textContent = char;

        // Find character info
        const charInfo = this.findCharacterInfo(char);
        if (charInfo) {
            this.currentCharPinyin.textContent = charInfo.pinyin;
            this.currentCharMeaning.textContent = charInfo.meaning;
        } else {
            this.currentCharPinyin.textContent = '';
            this.currentCharMeaning.textContent = '(Custom character)';
        }

        // Clear previous writer
        this.writerTarget.innerHTML = '';
        this.feedback.textContent = '';
        this.feedback.className = 'feedback';

        // Create new writer
        try {
            this.writer = HanziWriter.create(this.writerTarget, char, {
                width: 280,
                height: 280,
                padding: 10,
                showOutline: !this.isQuizMode,
                showCharacter: !this.isQuizMode,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 200,
                strokeColor: '#333',
                outlineColor: '#ddd',
                drawingColor: '#667eea',
                drawingWidth: 6,
                showHintAfterMisses: 3,
                highlightOnComplete: true,
                highlightColor: '#4CAF50',
                onLoadCharDataSuccess: (data) => {
                    this.strokeCount = data.strokes.length;
                    this.strokeCountDisplay.textContent = `Total strokes: ${this.strokeCount}`;
                },
                onLoadCharDataError: () => {
                    this.showFeedback('Character stroke data not available', 'error');
                    this.strokeCountDisplay.textContent = '';
                }
            });

            // If in quiz mode, start quiz
            if (this.isQuizMode) {
                this.startQuiz();
            }
        } catch (error) {
            this.showFeedback('Error loading character', 'error');
        }
    }

    setViewMode() {
        this.isQuizMode = false;
        this.viewModeBtn.classList.add('active');
        this.practiceModeBtn.classList.remove('active');
        this.animateBtn.disabled = false;
        this.hintBtn.disabled = true;
        this.animateBtn.textContent = 'Play Animation';
        this.feedback.textContent = '';
        this.feedback.className = 'feedback';

        // Reload character in view mode
        this.loadCharacter(this.currentChar);
    }

    setPracticeMode() {
        this.isQuizMode = true;
        this.outlineVisible = false;
        this.practiceModeBtn.classList.add('active');
        this.viewModeBtn.classList.remove('active');
        this.animateBtn.disabled = true;
        this.hintBtn.disabled = false;
        this.hintBtn.textContent = 'Show Hint';
        this.animateBtn.textContent = 'Play Animation';

        this.showFeedback('Draw the character stroke by stroke', 'info');

        // Reload character in practice mode
        this.loadCharacter(this.currentChar);
    }

    startQuiz() {
        if (!this.writer) return;

        this.writer.quiz({
            onMistake: (strokeData) => {
                this.mistakeCount++;
                this.showFeedback(`Try again! Stroke ${strokeData.strokeNum + 1}/${this.strokeCount}`, 'error');
            },
            onCorrectStroke: (strokeData) => {
                const remaining = this.strokeCount - strokeData.strokeNum - 1;
                if (remaining > 0) {
                    this.showFeedback(`Correct! ${remaining} stroke${remaining > 1 ? 's' : ''} remaining`, 'success');
                }
            },
            onComplete: (summaryData) => {
                const accuracy = Math.round((this.strokeCount / (this.strokeCount + this.mistakeCount)) * 100);
                this.showFeedback(`Excellent! Completed with ${accuracy}% accuracy`, 'success');
            }
        });
    }

    animate() {
        if (!this.writer || this.isQuizMode) return;

        this.animateBtn.disabled = true;
        this.animateBtn.textContent = 'Playing...';

        this.writer.animateCharacter({
            onComplete: () => {
                this.animateBtn.disabled = false;
                this.animateBtn.textContent = 'Play Animation';
            }
        });
    }

    showHint() {
        if (!this.writer || !this.isQuizMode) return;

        // Toggle outline visibility
        if (this.outlineVisible) {
            this.writer.hideOutline();
            this.outlineVisible = false;
            this.hintBtn.textContent = 'Show Hint';
            this.showFeedback('Outline hidden', 'info');
        } else {
            this.writer.showOutline();
            this.outlineVisible = true;
            this.hintBtn.textContent = 'Hide Hint';
            this.showFeedback('Outline shown - trace the character!', 'info');
        }
    }

    reset() {
        this.mistakeCount = 0;
        this.outlineVisible = false;
        this.hintBtn.textContent = 'Show Hint';
        this.feedback.textContent = '';
        this.feedback.className = 'feedback';

        if (this.isQuizMode) {
            this.loadCharacter(this.currentChar);
            this.showFeedback('Draw the character stroke by stroke', 'info');
        } else {
            this.loadCharacter(this.currentChar);
        }
    }

    showFeedback(message, type = 'info') {
        this.feedback.textContent = message;
        this.feedback.className = `feedback ${type}`;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StrokeLearningApp();
});
