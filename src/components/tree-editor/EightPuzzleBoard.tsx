"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface EightPuzzleBoardProps {
  board: number[];
  onTileClick?: (index: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  highlightIndex?: number | null; // Novo: índice para destacar (seleção de troca)
}

export function EightPuzzleBoard({ board, onTileClick, size = 'md', interactive = false, highlightIndex }: EightPuzzleBoardProps) {
  const cellSize = 
    size === 'xs' ? 'w-5 h-5 text-[10px]' : 
    size === 'sm' ? 'w-8 h-8 text-xs' : 
    size === 'md' ? 'w-12 h-12 text-lg' : 
    'w-16 h-16 text-xl';

  const gap = size === 'xs' ? 'gap-0.5' : 'gap-1';
  const padding = size === 'xs' ? 'p-0.5' : 'p-1';

  return (
    <div className={cn("grid grid-cols-3 bg-muted rounded-lg border shadow-sm w-fit mx-auto", gap, padding)}>
      {board.map((tile, i) => (
        <button
          key={i}
          disabled={!interactive}
          onClick={() => onTileClick?.(i)}
          className={cn(
            cellSize,
            "flex items-center justify-center rounded-md font-bold transition-all leading-none",
            // Lógica de cores
            tile === 0 
              ? "bg-muted-foreground/20 text-transparent" 
              : highlightIndex === i 
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 z-10" // Destaque de seleção
                : "bg-background text-foreground shadow-sm border",
            
            interactive && tile !== 0 ? "hover:bg-accent cursor-pointer" : "",
            interactive && tile === 0 ? "cursor-pointer hover:bg-muted-foreground/30" : "" // Permite clicar no vazio para troca
          )}
        >
          {tile !== 0 ? tile : ''}
        </button>
      ))}
    </div>
  );
}
