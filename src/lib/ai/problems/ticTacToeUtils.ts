// src/lib/ai/problems/ticTacToeUtils.ts

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
  [0, 4, 8], [2, 4, 6]             // Diagonais
];

/**
 * Verifica se há um vencedor no tabuleiro.
 * @returns Um objeto com o vencedor ('X' ou 'O') e a linha vencedora, ou null se não houver vencedor.
 */
export function getWinnerInfo(board: (string | null)[]): { winner: 'X' | 'O', line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line };
    }
  }
  return null;
}
