import { Problem, State, Action } from '../core/types';
import { getWinnerInfo } from './ticTacToeUtils';

export interface TicTacToeState extends State {
  board: (string | null)[];
  playerTurn: 'X' | 'O';
}

export interface TicTacToeAction extends Action {
  index: number;
}

export class TicTacToe implements Problem<TicTacToeState, TicTacToeAction> {
  public initialState: TicTacToeState;
  private maxPlayer: 'X' | 'O';

  constructor(initialBoard?: (string | null)[], maxPlayer: 'X' | 'O' = 'X') {
    const board = initialBoard || Array(9).fill(null);
    const turnCount = board.filter(c => c !== null).length;
    
    this.initialState = {
      key: this.boardToString(board),
      isTerminal: getWinnerInfo(board) !== null || turnCount === 9,
      board: board,
      playerTurn: turnCount % 2 === 0 ? 'X' : 'O'
    };
    this.maxPlayer = maxPlayer;
  }

  getActions(state: TicTacToeState): TicTacToeAction[] {
    if (state.isTerminal) return [];
    
    const actions: TicTacToeAction[] = [];
    for (let i = 0; i < 9; i++) {
      if (state.board[i] === null) {
        actions.push({ name: `Place ${state.playerTurn} at ${i}`, index: i });
      }
    }
    return actions;
  }

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

  isGoal(state: TicTacToeState): boolean {
    return state.isTerminal;
  }

  getCost(state: TicTacToeState, action: TicTacToeAction, nextState: TicTacToeState): number {
    return 1;
  }

  getHeuristic(state: TicTacToeState): number {
    return 0;
  }

  getUtility(state: TicTacToeState): number {
    const winnerInfo = getWinnerInfo(state.board);
    if (!winnerInfo) return 0; // Empate
    return winnerInfo.winner === this.maxPlayer ? 1 : -1;
  }

  private boardToString(board: (string | null)[]): string {
    return board.map(c => c || '-').join('');
  }
}
