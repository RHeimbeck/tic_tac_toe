// Tic-Tac-Toe
// All program code lives within this function-scope to avoid polluting the global namespace
//
// The code for the basic Tic-Tac-Toe game was provide by the React Learning Tutorial
// https://reactjs.org/tutorial/tutorial.html
// This code base was greatly enhanced to support a more complete UX along with AI modes of play.
// The use of Promises and callbacks is also new, to fix essential issues not considered by the tutorial.
//
// The code for the MiniMax optimal path algorithm was borrowed from:
// https://medium.freecodecamp.org/how-to-make-your-tic-tac-toe-game-unbeatable-by-using-the-minimax-algorithm-9d690bad4b37
// https://github.com/ahmadabdolsaheb/minimaxarticle
// but required adaptions and a bit of debugging.


(function () {

// Declare all program constants here
    const GAME_SQUARE_COUNT = 9;
    const PLAYER_VS_PLAYER_MODE = 1;
    const PLAYER_VS_AI_EASY_MODE = 2;
    const PLAYER_VS_AI_MEDIUM_MODE = 3;
    const PLAYER_VS_AI_HARD_MODE = 4;


    // Square
    // React Component to create each game square
    // Defined as 'function' because it only needs the render method.
    function Square(props) {
        return (
            <button className="square" onClick={props.onClick}>
                {props.value}
            </button>
        );
    }

    // Board
    // React component to render the tic-tac-toe board of 9 squares
    class Board extends React.Component {
        renderSquare(i) {
            return (
                <Square
                    value={this.props.squares[i]}
                    onClick={() => this.props.onClick(i)}
                />
            );
        }

        render() {
            return (
                <div>
                    <div className="board-row">
                        {this.renderSquare(0)}
                        {this.renderSquare(1)}
                        {this.renderSquare(2)}
                    </div>
                    <div className="board-row">
                        {this.renderSquare(3)}
                        {this.renderSquare(4)}
                        {this.renderSquare(5)}
                    </div>
                    <div className="board-row">
                        {this.renderSquare(6)}
                        {this.renderSquare(7)}
                        {this.renderSquare(8)}
                    </div>
                </div>
            );
        }
    }

    // GameOptions
    // React Component to render the the Game Options
    class GameOptions extends React.Component {
        render() {
            return (
                <div className="game-options info-box">
                    <div className="box-title">Options</div>
                    <button className="game-restart" onClick={this._onRestart.bind(this)}>
                        Next Game
                    </button>
                    <br />
                    Mode:<br />
                    <input type="radio" name="mode" value={PLAYER_VS_PLAYER_MODE}
                           defaultChecked onChange={this._onModeChange.bind(this)}/>Player vs Player<br />
                    <input type="radio" name="mode" value={PLAYER_VS_AI_EASY_MODE}
                           onChange={this._onModeChange.bind(this)}/>Player vs AI(easy)<br />
                    <input type="radio" name="mode" value={PLAYER_VS_AI_MEDIUM_MODE}
                           onChange={this._onModeChange.bind(this)}/>Player vs AI(med.)
                    <input type="radio" name="mode" value={PLAYER_VS_AI_HARD_MODE}
                           onChange={this._onModeChange.bind(this)}/>Player vs AI(hard)
                </div>
            );
        }

        _onRestart() {
            if (typeof this.props.restartGame === 'function') {
                this.props.restartGame();
            }
        }

        _onModeChange(element) {
            let mode = parseInt(element.target.value, 10) || 1;
            if (typeof this.props.changeMode === 'function') {
                this.props.changeMode(mode);
            }
            return false;
        }
    }

    // GameStatus
    // React Component to render the Game status
    // Defined as 'Function' because it only requires the render method
    function GameStatus(props) {
        return (
            <div className="game-info info-box">
                <div className="box-title">Status</div>
                <div>{props.gameStatus}</div>
                <div className="box-title">Score</div>
                <div className="game-score">
                    <table>
                        <thead>
                        <tr>
                            <th>X</th>
                            <th>O</th>
                            <th>Draw</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{props.xWins}</td>
                            <td>{props.oWins}</td>
                            <td>{props.draws}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // Game
    // Primary React Component to render the full game experiene
    // Handles all game logic inside this class.
    class Game extends React.Component {
        constructor() {
            super();
            this.state = {
                gameBoard: {
                    squares: Array(GAME_SQUARE_COUNT).fill(null)
                },
                gameStatus: this._nextPlayerString(true),
                gameOver: false,
                xGoesFirst: true,
                xIsNext: true,
                mode: PLAYER_VS_PLAYER_MODE,
                xWinCount: 0,
                oWinCount: 0,
                drawCount: 0
            };
        }

        render() {
            const board = this.state.gameBoard;
            const gameStatus = this.state.gameStatus;
            const xWins = this.state.xWinCount;
            const oWins = this.state.oWinCount;
            const draws = this.state.drawCount;

            return (
                <div className="game-container">
                    <div className="game-header">
                        Tic-Tac-Toe
                    </div>
                    <div className="game">
                        <GameOptions restartGame={this._resetGame.bind(this)} changeMode={this._setMode.bind(this)}/>
                        <div className="game-board">
                            <Board
                                squares={board.squares}
                                onClick={i => this._handleSquareClick(i)}
                            />
                        </div>
                        <GameStatus gameStatus={gameStatus} xWins={xWins} oWins={oWins} draws={draws}/>
                    </div>
                    <div className="note">* In AI modes, the human plays as 'X', and the computer plays as 'O'. Each
                        game alternates which player goes first.
                    </div>
                </div>
            );
        }

        // !!**!! This is a wrapper around Reacts 'this.setStatus() method, that provides
        // a promise rather than using the native callback method.  This greatly simplifies the
        // program flow.  !!Note - it is very important to wait for the setStatus() method to complete
        // before performing any next logic steps.
        _setStatePromise(state) {
            return new Promise((resolve) => {
                this.setState(state, () => {
                    resolve();
                })
            });
        }

        _handleSquareClick(idx) {
            let currentPlayer = this.state.xIsNext ? "X" : "O";
            this._makeMove(currentPlayer, idx).then((moveSucceeded) => {
                if (moveSucceeded && this.state.mode !== PLAYER_VS_PLAYER_MODE && !this.state.gameOver
                    && currentPlayer === 'X') {
                    this._makeAIMove('O');
                }
            });
        }

        _makeMove(player, idx) {
            const squares = this.state.gameBoard.squares.slice();
            if (squares[idx] || this.state.gameOver) {
                return Promise.resolve(false);
            }
            squares[idx] = player;

            return this._setStatePromise({
                gameBoard: {
                    squares: squares
                },
                xIsNext: !this.state.xIsNext
            }).then(() => {
                return this._announceStatus(squares);
            });
        }

        _setMode(mode) {
            let xGoesFirst = mode === PLAYER_VS_PLAYER_MODE ? this.state.xGoesFirst : false;
            return this._setStatePromise({
                mode,
                xGoesFirst,
                xWinCount: 0,
                oWinCount: 0,
                drawCount: 0
            }).then(() => {
                return this._resetGame();
            });
        }

        _resetGame() {
            // Alternate who goes first for each new game.
            let xGoesFirst = !this.state.xGoesFirst;
            return this._setStatePromise({
                gameBoard: {
                    squares: Array(GAME_SQUARE_COUNT).fill(null)
                },
                gameOver: false,
                gameStatus: this._nextPlayerString(xGoesFirst),
                xGoesFirst: xGoesFirst,
                xIsNext: xGoesFirst
            }).then(() => {
                // If we are in an AI mode, and it is O's turn, make the first move.
                if (this.state.mode !== PLAYER_VS_PLAYER_MODE && !xGoesFirst) {
                    return this._makeAIMove('O');
                }
                return Promise.resolve();
            });
        }

        _announceStatus(squares) {

            let gameOver = false;
            let winner = false;
            let status;
            let xWinCount = this.state.xWinCount;
            let oWinCount = this.state.oWinCount;
            let drawCount = this.state.drawCount;

            if (this._checkForWinner(squares, 'X')) {
                winner = 'X';
                xWinCount++;
            } else if (this._checkForWinner(squares, 'O')) {
                winner = 'O';
                oWinCount++;
            }

            if (winner) {
                status = `Winner: ${winner}`;
                gameOver = true;
            }

            if (!status) {
                if (this._emptyIndeces(squares).length === 0) {
                    status = 'Draw game';
                    drawCount++;
                    gameOver = true;
                } else {
                    status = this._nextPlayerString(this.state.xIsNext);
                }
            }

            return this._setStatePromise({
                gameStatus: status,
                gameOver,
                xWinCount,
                oWinCount,
                drawCount
            }).then(() => true);
        }

        _nextPlayerString(xIsNext) {
            return `Next player ${xIsNext ? 'X' : 'O'}`;
        }

        // returns an array of indeces indicating the available squares on the board
        _emptyIndeces(board) {
            let retArr = [];
            for (let i = 0; i < board.length; i++) {
                let val = board[i];
                if (val !== 'X' && val !== 'O') {
                    retArr.push(i);
                }
            }
            return retArr;
        }

        // winning combinations using the board indeces.
        // For instance the first win could be 3 xes in a row
        _checkForWinner(board, player) {

            const winningCombos = [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8],
                [0, 3, 6],
                [1, 4, 7],
                [2, 5, 8],
                [0, 4, 8],
                [2, 4, 6]
            ];

            for (let i = 0; i < winningCombos.length; i++) {
                const [a, b, c] = winningCombos[i];
                if (player === board[a] && player === board[b] && player === board[c]) {
                    return true;
                }
            }

            return false;
        }

        ////////////////////// AI Methods //////////////////////////////

        _makeAIMove(player) {
            let bestMove;
            let board = this.state.gameBoard.squares.slice();
            switch (this.state.mode) {
                case PLAYER_VS_AI_EASY_MODE:
                    bestMove = this._getWins(board, player);
                    break;
                case PLAYER_VS_AI_MEDIUM_MODE:
                    bestMove = this._getWinsAndBlocks(board, player);
                    break;
                case PLAYER_VS_AI_HARD_MODE:
                    bestMove = this._minimax(board, player).index;
                    break;
                default:
                    console.error("Not a known AI mode");
                    return;
            }

            return this._makeMove(player, bestMove);
        }

        _getRandomAvailableMove(board) {
            let emptyIndeces = this._emptyIndeces(board);
            let idx = this._getRandomNumberIndex(emptyIndeces.length - 1);
            return emptyIndeces[idx];
        }

        _getWins(board, player) {
            let winningMove = this._findTwoInRow(board, player);
            if (winningMove !== null) {
                return winningMove;
            }
            return this._getRandomAvailableMove(board);
        }

        _getWinsAndBlocks(board, player) {
            let opponent = player === 'X'? 'O':'X';
            let winningMove = this._findTwoInRow(board, player);
            if (winningMove !== null) {
                return winningMove;
            }
            let blockingMove = this._findTwoInRow(board, opponent);
            if (blockingMove !== null) {
                return blockingMove;
            }
            // on first move only choose between position 0 and 4
            if (this._emptyIndeces(board).length === GAME_SQUARE_COUNT) {
                let idx = this._getRandomNumberIndex(1);
                return [0,4][idx];
            }
            return this._getRandomAvailableMove(board);
        }

        // For 'easy' AI mode, simply return a random selection of one of the
        // available open squares.
        _getRandomNumberIndex(max) {
            let randomIdx = Math.round(Math.random() * max);
            if (randomIdx > max) {
                randomIdx = max;
            }
            return randomIdx;
        }

        _findTwoInRow(board, player) {
            const possibleCombos = {
                0: [[1,2],[3,6],[4,8]],
                1: [[0,2],[4,7]],
                2: [[0,1],[4,6],[5,8]],
                3: [[0,6],[4,5]],
                4: [[0,8],[2,6],[1,7],[3,5]],
                5: [[3,4],[2,8]],
                6: [[0,3],[2,4],[7,8]],
                7: [[1,4],[6,8]],
                8: [[0,4],[6,7],[2,5]]
            };
            let emptyIndeces = this._emptyIndeces(board);
            for (let i = 0; i < emptyIndeces.length; i++){
                let idx = emptyIndeces[i];
                let combos = possibleCombos[idx];
                for (let j = 0; j < combos.length; j++) {
                    let comboSet = combos[j];
                    if (board[comboSet[0]] === player && board[comboSet[1]] === player) {
                        return idx; // This empty spot is in line with two-in-a-row
                    }
                }
            }

            return null;
        }

        // For 'hard' AI mode, use the well know 'Minimax' method which calculates an optimal move
        // base on scoring each possible available square.  This method is recursive.
        _minimax(newBoard, player) {

            const huPlayer = "X"; // hmman player
            const aiPlayer = "O"; // ai player

            //available spots
            let availSpots = this._emptyIndeces(newBoard);

            // checks for the terminal states such as win, lose, and tie and returning a value accordingly
            if (this._checkForWinner(newBoard, huPlayer)) {
                return {score: -10};
            }
            else if (this._checkForWinner(newBoard, aiPlayer)) {
                return {score: 10};
            }
            else if (availSpots.length === 0) {
                return {score: 0};
            }

            // an array to collect all the objects
            let moves = [];

            // loop through available spots
            for (let i = 0; i < availSpots.length; i++) {
                //create an object for each and store the index of that spot that was stored as a number in the object's index key
                let move = {};
                let moveIdx = availSpots[i];
                move.index = moveIdx;
                let orgValue = newBoard[moveIdx];

                // set the empty spot to the current player
                newBoard[move.index] = player;

                //if collect the score resulted from calling minimax on the opponent of the current player
                if (player == aiPlayer) {
                    let result = this._minimax(newBoard, huPlayer);
                    move.score = result.score;
                }
                else {
                    let result = this._minimax(newBoard, aiPlayer);
                    move.score = result.score;
                }

                //reset the spot to original empty value;
                newBoard[moveIdx] = orgValue;

                // push the object to the array
                moves.push(move);
            }

            // if it is the computer's turn loop over the moves and choose the move with the highest score
            let bestMove;
            if (player === aiPlayer) {
                let bestScore = -10000;
                for (let i = 0; i < moves.length; i++) {
                    let move = moves[i];
                    if (move.score > bestScore) {
                        bestScore = move.score;
                        bestMove = i;
                    }
                }
            } else {

            // else loop over the moves and choose the move with the lowest score
                let bestScore = 10000;
                for (let i = 0; i < moves.length; i++) {
                    let move = moves[i];
                    if (move.score < bestScore) {
                        bestScore = move.score;
                        bestMove = i;
                    }
                }
            }

            // return the chosen move (object) from the array to the higher depth
            return moves[bestMove];
        }
    } // End of Game Class

// ========================================

    // Use React to render the components above
    ReactDOM.render(<Game />, document.getElementById("root"));

    // Attach event listeners to add mouse and keyboard support
    window.addEventListener('mousedown', function (e) {
        document.body.classList.add('mouse-navigation');
        document.body.classList.remove('kbd-navigation');
    });
    window.addEventListener('keydown', function (e) {
        if (e.keyCode === 9) {
            document.body.classList.add('kbd-navigation');
            document.body.classList.remove('mouse-navigation');
        }
    });
    window.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href') === '#') {
            e.preventDefault();
        }
    });
    window.onerror = function (message, source, line, col, error) {
        var text = error ? error.stack || error : message + ' (at ' + source + ':' + line + ':' + col + ')';
        errors.textContent += text + '\n';
        errors.style.display = '';
    };
    console.error = (function (old) {
        return function error() {
            errors.textContent += Array.prototype.slice.call(arguments).join(' ') + '\n';
            errors.style.display = '';
            old.apply(this, arguments);
        }
    })(console.error);

})();  // End of File scope closure.

