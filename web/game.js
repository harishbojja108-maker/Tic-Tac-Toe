/**
 * Tic-Tac-Toe Web Game with Adaptive AI Difficulty
 * Features Easy, Medium, and Hard difficulty levels
 */

class TicTacToeGame {
    constructor() {
        this.board = Array(3).fill().map(() => Array(3).fill(''));
        this.currentPlayer = 'X'; // Human player
        this.aiPlayer = 'O';
        this.difficulty = 'medium';
        this.gameActive = false;
        this.scores = { player: 0, ai: 0, draws: 0 };
        this.thinkingStartTime = 0;
        this.searchDepth = 0;
        
        this.initializeEventListeners();
        this.loadScores();
    }
    
    initializeEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.currentTarget.dataset.level;
                this.startGame(level);
            });
        });
        
        // Game board cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const row = parseInt(e.currentTarget.dataset.row);
                const col = parseInt(e.currentTarget.dataset.col);
                this.handleCellClick(row, col);
            });
        });
        
        // Control buttons
        document.getElementById('newGame').addEventListener('click', () => this.resetGame());
        document.getElementById('resetScores').addEventListener('click', () => this.resetScores());
        document.getElementById('backToMenu').addEventListener('click', () => this.showDifficultyScreen());
        
        // Modal buttons
        document.getElementById('playAgain').addEventListener('click', () => {
            this.hideModal();
            this.resetGame();
        });
        
        document.getElementById('changeDifficulty').addEventListener('click', () => {
            this.hideModal();
            this.showDifficultyScreen();
        });
    }
    
    startGame(difficulty) {
        this.difficulty = difficulty;
        this.gameActive = true;
        this.resetBoard();
        this.currentPlayer = 'X'; // Ensure player starts
        this.setBoardEnabled(true); // Ensure board is enabled
        
        // Update UI
        document.getElementById('currentDifficulty').textContent = 
            difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
        // Switch screens
        document.getElementById('difficultyScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        
        this.updateTurnIndicator();
    }
    
    showDifficultyScreen() {
        document.getElementById('gameScreen').classList.remove('active');
        document.getElementById('difficultyScreen').classList.add('active');
        this.gameActive = false;
    }
    
    handleCellClick(row, col) {
        console.log('Cell clicked:', row, col, 'gameActive:', this.gameActive, 'currentPlayer:', this.currentPlayer, 'board cell:', this.board[row][col]);
        
        if (!this.gameActive || this.currentPlayer !== 'X' || this.board[row][col] !== '') {
            console.log('Click blocked - conditions not met');
            return;
        }
        
        // Disable board during AI thinking
        this.setBoardEnabled(false);
        
        this.makeMove(row, col, 'X');
        
        if (this.gameActive) {
            this.currentPlayer = 'O';
            this.updateTurnIndicator();
            setTimeout(() => this.makeAIMove(), 200); // Reduced delay
        }
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.updateCell(row, col, player);
        
        const winner = this.checkWinner();
        if (winner) {
            this.endGame(winner);
        } else if (this.isBoardFull()) {
            this.endGame('draw');
        }
    }
    
    updateCell(row, col, player) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const content = cell.querySelector('.cell-content');
        
        cell.classList.add('occupied', player.toLowerCase());
        content.textContent = player;
    }
    
    makeAIMove() {
        if (!this.gameActive) return;
        
        this.showAIThinking();
        this.thinkingStartTime = performance.now();
        
        // Calculate AI move immediately without delay
        setTimeout(() => {
            const move = this.getAIMove();
            this.hideAIThinking();
            
            if (move) {
                this.makeMove(move.row, move.col, 'O');
                this.currentPlayer = 'X';
                this.updateTurnIndicator();
                this.setBoardEnabled(true); // Re-enable board
            }
        }, 200); // Further reduced delay
    }
    
    setBoardEnabled(enabled) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.style.pointerEvents = enabled ? 'auto' : 'none';
            cell.style.opacity = enabled ? '1' : '0.7';
        });
    }
    
    getAIMove() {
        switch (this.difficulty) {
            case 'easy':
                return this.getRandomMove();
            case 'medium':
                return this.getMediumMove();
            case 'hard':
                return this.getHardMove();
            default:
                return this.getMediumMove();
        }
    }
    
    getRandomMove() {
        const emptyCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.board[row][col] === '') {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (emptyCells.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        this.searchDepth = 1;
        return emptyCells[randomIndex];
    }
    
    getMediumMove() {
        // 70% chance of making optimal move, 30% random
        if (Math.random() < 0.7) {
            return this.getSmartMove(2); // Limited depth
        } else {
            return this.getRandomMove();
        }
    }
    
    getHardMove() {
        // Use depth 6 instead of 9 for better performance while still being very strong
        return this.getSmartMove(6);
    }
    
    getSmartMove(maxDepth) {
        let bestScore = -Infinity;
        let bestMove = null;
        let currentDepth = 0;
        
        const emptyCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.board[row][col] === '') {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        // If no empty cells, return null
        if (emptyCells.length === 0) return null;
        
        // For performance, limit the number of moves to evaluate
        const maxMovesToEvaluate = Math.min(emptyCells.length, 8);
        const cellsToEvaluate = emptyCells.slice(0, maxMovesToEvaluate);
        
        // Add timeout to prevent hanging
        const startTime = performance.now();
        const maxThinkingTime = 2000; // 2 seconds max
        
        for (const cell of cellsToEvaluate) {
            // Check if we're taking too long
            if (performance.now() - startTime > maxThinkingTime) {
                break;
            }
            
            this.board[cell.row][cell.col] = 'O';
            const score = this.minimax(this.board, 0, false, -Infinity, Infinity, maxDepth);
            this.board[cell.row][cell.col] = '';
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = cell;
            }
        }
        
        // If no move found (timeout), return a random valid move
        if (!bestMove && emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            bestMove = emptyCells[randomIndex];
        }
        
        this.searchDepth = maxDepth;
        return bestMove;
    }
    
    minimax(board, depth, isMaximizing, alpha, beta, maxDepth) {
        const winner = this.checkWinnerForBoard(board);
        
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (this.isBoardFullForBoard(board)) return 0;
        if (depth >= maxDepth) return 0; // Depth limit
        
        // Optimize: get empty cells once instead of nested loops
        const emptyCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (board[row][col] === '') {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const cell of emptyCells) {
                board[cell.row][cell.col] = 'O';
                const score = this.minimax(board, depth + 1, false, alpha, beta, maxDepth);
                board[cell.row][cell.col] = '';
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            
            for (const cell of emptyCells) {
                board[cell.row][cell.col] = 'X';
                const score = this.minimax(board, depth + 1, true, alpha, beta, maxDepth);
                board[cell.row][cell.col] = '';
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minScore;
        }
    }
    
    checkWinner() {
        return this.checkWinnerForBoard(this.board);
    }
    
    checkWinnerForBoard(board) {
        // Check rows
        for (let row = 0; row < 3; row++) {
            if (board[row][0] && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
                return board[row][0];
            }
        }
        
        // Check columns
        for (let col = 0; col < 3; col++) {
            if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
                return board[0][col];
            }
        }
        
        // Check diagonals
        if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return board[0][0];
        }
        if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            return board[0][2];
        }
        
        return null;
    }
    
    isBoardFull() {
        return this.isBoardFullForBoard(this.board);
    }
    
    isBoardFullForBoard(board) {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (board[row][col] === '') {
                    return false;
                }
            }
        }
        return true;
    }
    
    endGame(result) {
        this.gameActive = false;
        this.setBoardEnabled(false); // Disable board when game ends
        const thinkingTime = Math.round(performance.now() - this.thinkingStartTime);
        
        // Update scores
        if (result === 'X') {
            this.scores.player++;
        } else if (result === 'O') {
            this.scores.ai++;
        } else {
            this.scores.draws++;
        }
        
        this.saveScores();
        this.updateScoreDisplay();
        
        // Show winning line
        if (result !== 'draw') {
            this.highlightWinningLine();
        }
        
        // Show result modal
        setTimeout(() => {
            this.showResultModal(result, thinkingTime);
        }, 1000);
    }
    
    highlightWinningLine() {
        const winningCells = this.getWinningCells();
        if (winningCells) {
            winningCells.forEach(({row, col}) => {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('winning');
            });
        }
    }
    
    getWinningCells() {
        // Check rows
        for (let row = 0; row < 3; row++) {
            if (this.board[row][0] && this.board[row][0] === this.board[row][1] && this.board[row][1] === this.board[row][2]) {
                return [{row, col: 0}, {row, col: 1}, {row, col: 2}];
            }
        }
        
        // Check columns
        for (let col = 0; col < 3; col++) {
            if (this.board[0][col] && this.board[0][col] === this.board[1][col] && this.board[1][col] === this.board[2][col]) {
                return [{row: 0, col}, {row: 1, col}, {row: 2, col}];
            }
        }
        
        // Check diagonals
        if (this.board[0][0] && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) {
            return [{row: 0, col: 0}, {row: 1, col: 1}, {row: 2, col: 2}];
        }
        if (this.board[0][2] && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) {
            return [{row: 0, col: 2}, {row: 1, col: 1}, {row: 2, col: 0}];
        }
        
        return null;
    }
    
    showResultModal(result, thinkingTime) {
        const modal = document.getElementById('gameOverModal');
        const icon = document.getElementById('resultIcon');
        const title = document.getElementById('resultTitle');
        const message = document.getElementById('resultMessage');
        
        if (result === 'X') {
            icon.className = 'fas fa-trophy';
            icon.style.color = '#4CAF50';
            title.textContent = 'Victory!';
            message.textContent = 'Congratulations! You defeated the AI!';
        } else if (result === 'O') {
            icon.className = 'fas fa-robot';
            icon.style.color = '#f44336';
            title.textContent = 'Defeat!';
            message.textContent = 'The AI won this round. Try again!';
        } else {
            icon.className = 'fas fa-handshake';
            icon.style.color = '#FF9800';
            title.textContent = 'Draw!';
            message.textContent = 'Well played! It\'s a draw!';
        }
        
        document.getElementById('thinkingTime').textContent = `${thinkingTime}ms`;
        document.getElementById('searchDepth').textContent = this.searchDepth;
        
        modal.classList.add('active');
    }
    
    hideModal() {
        document.getElementById('gameOverModal').classList.remove('active');
        // Clear any winning highlights
        document.querySelectorAll('.cell.winning').forEach(cell => {
            cell.classList.remove('winning');
        });
    }
    
    showAIThinking() {
        document.getElementById('aiThinking').classList.add('active');
    }
    
    hideAIThinking() {
        document.getElementById('aiThinking').classList.remove('active');
    }
    
    updateTurnIndicator() {
        const playerTurn = document.getElementById('playerTurn');
        const aiTurn = document.getElementById('aiTurn');
        
        if (this.currentPlayer === 'X') {
            playerTurn.classList.add('active');
            aiTurn.classList.remove('active');
        } else {
            playerTurn.classList.remove('active');
            aiTurn.classList.add('active');
        }
    }
    
    updateScoreDisplay() {
        document.getElementById('playerScore').textContent = this.scores.player;
        document.getElementById('aiScore').textContent = this.scores.ai;
        document.getElementById('drawScore').textContent = this.scores.draws;
    }
    
    resetGame() {
        console.log('resetGame called');
        this.gameActive = true; // ✅ Ensure game is active
        this.resetBoard();
        this.currentPlayer = 'X';
        this.updateTurnIndicator();
        this.hideModal();
        this.setBoardEnabled(true); // Ensure board is enabled
        this.thinkingStartTime = 0; // Reset thinking timer
        this.searchDepth = 0; // Reset search depth
        console.log('resetGame complete - gameActive:', this.gameActive, 'currentPlayer:', this.currentPlayer);
    }
    
    resetBoard() {
        this.board = Array(3).fill().map(() => Array(3).fill(''));
        
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('occupied', 'x', 'o', 'winning');
            cell.querySelector('.cell-content').textContent = '';
            // Reset cell styles
            cell.style.pointerEvents = 'auto';
            cell.style.opacity = '1';
        });
    }
    
    resetScores() {
        this.scores = { player: 0, ai: 0, draws: 0 };
        this.saveScores();
        this.updateScoreDisplay();
    }
    
    saveScores() {
        localStorage.setItem('tictactoe_scores', JSON.stringify(this.scores));
    }
    
    loadScores() {
        const saved = localStorage.getItem('tictactoe_scores');
        if (saved) {
            this.scores = JSON.parse(saved);
            this.updateScoreDisplay();
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToeGame();
});
