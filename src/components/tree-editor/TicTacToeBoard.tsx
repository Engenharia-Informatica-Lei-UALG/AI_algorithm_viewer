"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { getWinnerInfo, WINNING_LINES } from '@/lib/ai/problems/ticTacToeUtils';

interface TicTacToeBoardProps {
  board: (string | null)[];
  onCellClick?: (index: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function TicTacToeBoard({ board, onCellClick, size = 'md', interactive = false }: TicTacToeBoardProps) {
  const styles = {
    xs: { cellSize: 'w-6 h-6 text-lg', gap: 'gap-0.5', padding: 'p-0.5', stroke: '2px' },
    sm: { cellSize: 'w-8 h-8 text-xl', gap: 'gap-1', padding: 'p-1', stroke: '3px' },
    // Novo tamanho 'md' para o visualizador
    md: { cellSize: 'w-10 h-10 text-3xl', gap: 'gap-1', padding: 'p-1', stroke: '4px' },
    lg: { cellSize: 'w-16 h-16 text-4xl', gap: 'gap-1.5', padding: 'p-1.5', stroke: '5px' },
  };

  const { cellSize, gap, padding, stroke } = styles[size] || styles.md;
  const winnerInfo = getWinnerInfo(board);

  const getLinePosition = (line: number[]) => {
    const lineIndex = WINNING_LINES.findIndex(l => l.every((v, i) => v === line[i]));
    switch (lineIndex) {
      case 0: return { top: '16.66%', left: '5%', width: '90%', height: stroke, transform: 'none' };
      case 1: return { top: '50%', left: '5%', width: '90%', height: stroke, transform: 'translateY(-50%)' };
      case 2: return { top: '83.33%', left: '5%', width: '90%', height: stroke, transform: 'none' };
      case 3: return { top: '5%', left: '16.66%', width: stroke, height: '90%', transform: 'none' };
      case 4: return { top: '5%', left: '50%', width: stroke, height: '90%', transform: 'translateX(-50%)' };
      case 5: return { top: '5%', left: '83.33%', width: stroke, height: '90%', transform: 'none' };
      case 6: return { top: '50%', left: '50%', width: '120%', height: stroke, transform: 'translate(-50%, -50%) rotate(45deg)' };
      case 7: return { top: '50%', left: '50%', width: '120%', height: stroke, transform: 'translate(-50%, -50%) rotate(-45deg)' };
      default: return {};
    }
  };

  return (
    <div className={cn("relative grid grid-cols-3 bg-muted rounded-lg border shadow-sm w-fit mx-auto", gap, padding)}>
      {board.map((cell, i) => (
        <button
          key={i}
          disabled={!interactive}
          onClick={() => onCellClick?.(i)}
          className={cn(
            cellSize,
            "flex items-center justify-center bg-background rounded-md font-black transition-all leading-none",
            interactive && !cell ? "hover:bg-accent cursor-pointer" : "cursor-default",
            cell === 'X' ? "text-blue-500" : "text-red-500"
          )}
        >
          {cell}
        </button>
      ))}
      {winnerInfo && (
        <div 
          className="absolute bg-destructive rounded-full"
          style={getLinePosition(winnerInfo.line)}
        />
      )}
    </div>
  );
}
