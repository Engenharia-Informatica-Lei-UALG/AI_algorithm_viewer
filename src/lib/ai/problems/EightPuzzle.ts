import { Problem, State, Action } from '../core/types';

/**
 * State representation for the 8-Puzzle game.
 */
export interface PuzzleState extends State {
  /** A 1D array of 9 integers representing the board (0 denotes the empty tile). */
  board: number[];
  /** The current index of the empty tile (0) in the board array. */
  emptyIndex: number;
}

/**
 * Action representation for moving the empty tile in the 8-Puzzle.
 */
export interface PuzzleAction extends Action {
  /** The cardinal direction of the move. */
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  /** The index of the tile that will be swapped with the empty space. */
  targetIndex: number;
}

/**
 * Problem implementation for the classic 8-Puzzle sliding tile game.
 * Uses Manhattan distance as the default heuristic.
 */
export class EightPuzzle implements Problem<PuzzleState, PuzzleAction> {
  /** The starting configuration of the puzzle. */
  public initialState: PuzzleState;
  /** The target configuration to reach. */
  private goalState: number[];

  /**
   * Initializes a new 8-Puzzle problem.
   * @param initialBoard - Optional custom starting board state. Default is [1,2,3,4,5,6,7,8,0].
   * @param goalBoard - Optional custom goal board state. Default is [0,8,7,6,5,4,3,2,1].
   */
  constructor(initialBoard?: number[], goalBoard?: number[]) {
    const board = initialBoard || [1, 2, 3, 4, 5, 6, 7, 8, 0];
    this.goalState = goalBoard || [0, 8, 7, 6, 5, 4, 3, 2, 1];

    this.initialState = {
      key: board.join(','),
      isTerminal: this.isBoardGoal(board),
      board: board,
      emptyIndex: board.indexOf(0)
    };
  }

  /**
   * returns a list of valid moves from the current puzzle state.
   * @param state - Current puzzle state.
   * @returns {PuzzleAction[]} Available moves.
   */
  getActions(state: PuzzleState): PuzzleAction[] {
    const actions: PuzzleAction[] = [];
    const { emptyIndex } = state;
    const size = 3;
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;

    if (row > 0) actions.push({ name: 'Move Up', direction: 'UP', targetIndex: emptyIndex - size });
    if (row < size - 1) actions.push({ name: 'Move Down', direction: 'DOWN', targetIndex: emptyIndex + size });
    if (col > 0) actions.push({ name: 'Move Left', direction: 'LEFT', targetIndex: emptyIndex - 1 });
    if (col < size - 1) actions.push({ name: 'Move Right', direction: 'RIGHT', targetIndex: emptyIndex + 1 });

    return actions;
  }

  /**
   * returns the resulting state after performing a move.
   * @param state - Current puzzle state.
   * @param action - Action to perform.
   * @returns {PuzzleState} The new configuration.
   */
  getResult(state: PuzzleState, action: PuzzleAction): PuzzleState {
    const newBoard = [...state.board];
    [newBoard[state.emptyIndex], newBoard[action.targetIndex]] =
      [newBoard[action.targetIndex], newBoard[state.emptyIndex]];

    return {
      key: newBoard.join(','),
      isTerminal: this.isBoardGoal(newBoard),
      board: newBoard,
      emptyIndex: action.targetIndex
    };
  }

  /**
   * Checks if the state matches the goal configuration.
   * @param state - State to check.
   * @returns {boolean}
   */
  isGoal(state: PuzzleState): boolean {
    return state.key === this.goalState.join(',');
  }

  /**
   * Helper to verify if a board array matches the goal.
   * @param board - Board array to check.
   * @returns {boolean}
   */
  private isBoardGoal(board: number[]): boolean {
    return board.every((val, idx) => val === this.goalState[idx]);
  }

  /**
   * steps always have a cost of 1 in the 8-puzzle.
   * @returns {number}
   */
  getCost(state: PuzzleState, action: PuzzleAction, nextState: PuzzleState): number {
    return 1;
  }

  /**
   * Calculates the Manhattan distance heuristic for the current board.
   * @param state - Current puzzle state.
   * @returns {number} Total Manhattan distance to goal.
   */
  getHeuristic(state: PuzzleState): number {
    let distance = 0;
    const goalPositions: { [key: number]: number } = {};
    this.goalState.forEach((val, idx) => {
      goalPositions[val] = idx;
    });

    for (let i = 0; i < 9; i++) {
      const value = state.board[i];
      if (value !== 0) {
        const currentRow = Math.floor(i / 3);
        const currentCol = i % 3;

        const targetIndex = goalPositions[value];
        const targetRow = Math.floor(targetIndex / 3);
        const targetCol = targetIndex % 3;

        distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
      }
    }
    return distance;
  }
}

