import { Problem, State, Action } from '../core/types';

/**
 * Constant representing all possible lines that result in a win in Tic-Tac-Toe.
 */
export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

/**
 * Information about a game winner, including the player and the winning line.
 */
export type WinnerInfo = {
  /** The player who won ('X' or 'O'). */
  winner: 'X' | 'O';
  /** The indices of the winning line on the board. */
  line: number[];
} | null;

/**
 * Checks the board for a winner and returns winning information.
 * @param board - Current board state.
 * @returns {WinnerInfo} Winner data or null.
 */
export function getWinnerInfo(board: (string | null)[]): WinnerInfo {
  if (!board || !Array.isArray(board)) return null;

  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line };
    }
  }
  return null;
}

/**
 * State representation for a Tic-Tac-Toe game.
 */
export interface TicTacToeState extends State {
  /** A 1D array of 9 elements representing the board cells. */
  board: (string | null)[];
  /** The player whose turn it is to move. */
  playerTurn: 'X' | 'O';
}

/**
 * Action representation for making a move in Tic-Tac-Toe.
 */
export interface TicTacToeAction extends Action {
  /** The index (0-8) where the player wants to place their mark. */
  index: number;
}

/**
 * Problem implementation for the classic Tic-Tac-Toe game.
 * Used for demonstrating adversarial search algorithms like Minimax.
 */
export class TicTacToe implements Problem<TicTacToeState, TicTacToeAction> {
  /** The initial state of the game. */
  public initialState: TicTacToeState;
  /** The player considered 'max' (usually X) for utility calculation. */
  public maxPlayer: 'X' | 'O';

  /**
   * Initializes a new Tic-Tac-Toe game.
   * @param initialBoard - Optional custom starting board.
   * @param maxPlayer - The player whose perspective the AI optimizes for.
   */
  constructor(initialBoard?: (string | null)[], maxPlayer: 'X' | 'O' = 'X') {
    const board = initialBoard || Array(9).fill(null);
    const xCount = board.filter(c => c === 'X').length;
    const oCount = board.filter(c => c === 'O').length;
    const playerTurn = xCount === oCount ? 'X' : 'O';

    this.initialState = {
      key: this.boardToString(board),
      isTerminal: getWinnerInfo(board) !== null || board.every(c => c !== null),
      board: board,
      playerTurn: playerTurn
    };
    this.maxPlayer = maxPlayer;
  }

  /**
   * returns valid moves (indices of empty cells) from the current state.
   * @param state - Current game state.
   * @returns {TicTacToeAction[]} Available moves.
   */
  getActions(state: TicTacToeState): TicTacToeAction[] {
    if (state.isTerminal) return [];
    const actions: TicTacToeAction[] = [];
    for (let i = 0; i < 9; i++) {
      if (state.board[i] === null) {
        actions.push({ name: `${i}`, index: i });
      }
    }
    return actions;
  }

  /**
   * returns the resulting game state after a player move.
   * @param state - Current game state.
   * @param action - Move to perform.
   * @returns {TicTacToeState} The updated state.
   */
  getResult(state: TicTacToeState, action: TicTacToeAction): TicTacToeState {
    const newBoard = [...state.board];
    newBoard[action.index] = state.playerTurn;
    const nextPlayer = state.playerTurn === 'X' ? 'O' : 'X';
    const winnerInfo = getWinnerInfo(newBoard);
    const isFull = !newBoard.includes(null);

    return {
      key: this.boardToString(newBoard),
      isTerminal: winnerInfo !== null || isFull,
      board: newBoard,
      playerTurn: nextPlayer
    };
  }

  /**
   * Tic-Tac-Toe is considered 'goal reached' when the state is terminal.
   * @param state - Current state.
   * @returns {boolean}
   */
  isGoal(state: TicTacToeState): boolean {
    return state.isTerminal;
  }

  /**
   * returns the cost of a move, constant at 1.
   * @returns {number}
   */
  getCost(state: TicTacToeState, action: TicTacToeAction, nextState: TicTacToeState): number {
    return 1;
  }

  /**
   * Calculates the utility of a terminal state.
   * @param state - Current game state.
   * @returns {number} 1 if maxPlayer won, -1 if they lost, 0 for draw.
   */
  getUtility(state: TicTacToeState): number {
    const winnerInfo = getWinnerInfo(state.board);
    if (!winnerInfo) return 0;
    return winnerInfo.winner === this.maxPlayer ? 1 : -1;
  }

  /**
   * returns a constant 0 heuristic as Minimax usually uses exhaustive search on small boards.
   * @returns {number}
   */
  getHeuristic(state: TicTacToeState): number { return 0; }

  /**
   * Serializes the board into a string key.
   * @param board - Board state.
   * @returns {string} String representation.
   */
  private boardToString(board: (string | null)[]): string {
    return board.map(c => c || '-').join('');
  }
}