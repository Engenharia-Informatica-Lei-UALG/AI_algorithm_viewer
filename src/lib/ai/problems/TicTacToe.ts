// src/lib/ai/problems/TicTacToe.ts
import { Problem, State, Action } from '../core/types';

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

export type WinnerInfo = {
  winner: 'X' | 'O';
  line: number[];
} | null;

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

export interface TicTacToeState extends State {
  board: (string | null)[];
  playerTurn: 'X' | 'O';
}

export interface TicTacToeAction extends Action {
  index: number;
}

export class TicTacToe implements Problem<TicTacToeState, TicTacToeAction> {
  public initialState: TicTacToeState;
  public maxPlayer: 'X' | 'O';

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

  getUtility(state: TicTacToeState): number {
    const winnerInfo = getWinnerInfo(state.board);
    if (!winnerInfo) return 0;
    return winnerInfo.winner === this.maxPlayer ? 1 : -1;
  }

  getHeuristic(state: TicTacToeState): number { return 0; }

  private boardToString(board: (string | null)[]): string {
    return board.map(c => c || '-').join('');
  }
}