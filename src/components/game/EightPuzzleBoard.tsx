import React from 'react';
import { cn } from '@/lib/utils';

interface EightPuzzleBoardProps {
  board: number[] | any;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onTileClick?: (index: number) => void;
  interactive?: boolean;
  highlightIndex?: number | null;
}

export const EightPuzzleBoard: React.FC<EightPuzzleBoardProps> = ({
  board,
  className,
  size = 'sm',
  onTileClick,
  interactive = false,
  highlightIndex
}) => {
  // Robust data extraction
  const getBoardData = (): number[] => {
    if (Array.isArray(board) && board.length === 9) return board;
    if (board && typeof board === 'object' && 'boardState' in board && Array.isArray((board as any).boardState) && (board as any).boardState.length === 9) {
      return (board as any).boardState;
    }
    return [1, 2, 3, 4, 5, 6, 7, 8, 0]; // Default aligned state
  };

  const safeBoard = getBoardData();

  const styles = {
    // xs (Tree Mode): Ocupa bem os 100px. Célula de 28px.
    xs: { cellSize: 'w-[28px] h-[28px] text-sm', gap: 'gap-1', p: 'p-1' },
    // sm: Célula de 36px.
    sm: { cellSize: 'w-9 h-9 text-lg', gap: 'gap-1', p: 'p-1.5' },
    // md: Célula de 48px.
    md: { cellSize: 'w-12 h-12 text-2xl', gap: 'gap-1.5', p: 'p-2' },
    // lg: Célula de 64px.
    lg: { cellSize: 'w-16 h-16 text-4xl', gap: 'gap-2', p: 'p-3' },
  };

  const { cellSize, gap, p } = styles[size] || styles.sm;
  const isTreeMode = size === 'xs';

  return (
    <div className={cn(
      "relative grid grid-cols-3 select-none transition-all duration-300 w-fit h-fit mx-auto",
      gap,
      isTreeMode ? `bg-transparent ${p}` : `bg-background/40 backdrop-blur-md rounded-xl border border-border/20 shadow-2xl ${p}`,
      className
    )}>
      {safeBoard.map((cell, i) => (
        <button
          key={i}
          disabled={!interactive}
          onClick={(e) => {
            if (interactive && onTileClick) {
              e.preventDefault();
              onTileClick(i);
            }
          }}
          className={cn(
            cellSize,
            "relative flex items-center justify-center rounded-lg font-black transition-all duration-300 leading-none overflow-hidden",
            cell === 0
              ? isTreeMode
                ? "bg-muted/10 border border-dashed border-border/20"
                : "bg-muted/20 border-2 border-dashed border-border/30"
              : highlightIndex === i
                ? "bg-primary/20 text-primary border-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                : isTreeMode
                  ? "bg-slate-900 border border-border/40 text-blue-400"
                  : "bg-slate-900 border-2 border-border/60 text-blue-400 shadow-inner",

            interactive && cell !== 0 ? "hover:scale-105 hover:bg-slate-800 hover:border-blue-400/80 cursor-pointer active:scale-95 shadow-lg" : "cursor-default",
          )}
        >
          <span className={cn(
            "relative z-10 animate-in zoom-in-50 duration-500",
            cell !== 0 && "drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]"
          )}>
            {cell !== 0 ? cell : ""}
          </span>
          {/* Neon secondary glow effect for the cell */}
          {cell !== 0 && (
            <div className="absolute inset-0 bg-blue-500/5 opacity-50 pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
};