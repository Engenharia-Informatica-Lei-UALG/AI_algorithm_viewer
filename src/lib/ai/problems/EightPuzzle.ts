import { Problem, State, Action } from '../core/types';

export interface PuzzleState extends State {
  board: number[]; // Array de 9 números (0 representa o espaço vazio)
  emptyIndex: number;
}

export interface PuzzleAction extends Action {
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  targetIndex: number;
}

export class EightPuzzle implements Problem<PuzzleState, PuzzleAction> {
  public initialState: PuzzleState;
  private goalState: number[];

  constructor(initialBoard?: number[], goalBoard?: number[]) {
    const board = initialBoard || [1, 2, 3, 4, 5, 6, 7, 8, 0];
    this.goalState = goalBoard || [0,8,7,6,5,4,3,2,1];
    
    this.initialState = {
      key: board.join(','),
      isTerminal: this.isBoardGoal(board),
      board: board,
      emptyIndex: board.indexOf(0)
    };
  }

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

  isGoal(state: PuzzleState): boolean {
    return state.key === this.goalState.join(',');
  }

  private isBoardGoal(board: number[]): boolean {
    return board.every((val, idx) => val === this.goalState[idx]);
  }

  getCost(state: PuzzleState, action: PuzzleAction, nextState: PuzzleState): number {
    return 1;
  }

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
