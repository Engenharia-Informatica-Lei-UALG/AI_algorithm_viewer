import React from 'react';
import { cn } from '@/lib/utils';
import { getWinnerInfo, WINNING_LINES } from '@/lib/ai/problems/ticTacToeUtils';

interface TicTacToeBoardProps {
  board: (string | null)[] | any;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onCellClick?: (index: number) => void;
  interactive?: boolean;
}

export const TicTacToeBoard: React.FC<TicTacToeBoardProps> = ({
  board,
  className,
  size = 'md',
  onCellClick,
  interactive = false
}) => {
  const getBoardData = (): (string | null)[] => {
    if (Array.isArray(board) && board.length === 9) return board;
    if (board && typeof board === 'object' && 'boardState' in board && Array.isArray((board as any).boardState) && (board as any).boardState.length === 9) {
      return (board as any).boardState;
    }
    return Array(9).fill(null);
  };

  const safeBoard = getBoardData();
  const winnerInfo = getWinnerInfo(safeBoard);

  // AJUSTE CRÍTICO: Reduzi os tamanhos e forcei tamanhos de fonte fixos (px) para garantir que cabem na caixa.
  const styles = {
    // xs (Tree Mode): Caixa de 32px (w-8), texto de 16px. Equilíbrio para os 130px da TreeGraph.
    xs: { cellSize: 'w-8 h-8 text-base', gap: 'gap-1', stroke: '2px', p: 'p-1' },
    // sm: Caixa de 32px (w-8), texto de 16px.
    sm: { cellSize: 'w-8 h-8 text-base', gap: 'gap-1', stroke: '2px', p: 'p-1.5' },
    // md: Padrão
    md: { cellSize: 'w-12 h-12 text-2xl', gap: 'gap-1.5', stroke: '4px', p: 'p-2' },
    // lg: Grande
    lg: { cellSize: 'w-20 h-20 text-4xl', gap: 'gap-2', stroke: '6px', p: 'p-3' },
  };

  const { cellSize, gap, stroke, p } = styles[size] || styles.md;
  const isTreeMode = size === 'xs';

  const getLinePosition = (line: number[]) => {
    const lineIndex = WINNING_LINES.findIndex(l => l.every((v, i) => v === line[i]));
    switch (lineIndex) {
      case 0: return { top: '16.66%', left: '5%', width: '90%', height: stroke, transform: 'none' };
      case 1: return { top: '50%', left: '5%', width: '90%', height: stroke, transform: 'translateY(-50%)' };
      case 2: return { top: '83.33%', left: '5%', width: '90%', height: stroke, transform: 'none' };
      case 3: return { top: '5%', left: '16.66%', width: stroke, height: '90%', transform: 'none' };
      case 4: return { top: '5%', left: '50%', width: stroke, height: '90%', transform: 'translateX(-50%)' };
      case 5: return { top: '5%', left: '83.33%', width: stroke, height: '90%', transform: 'none' };
      case 6: return { top: '50%', left: '50%', width: '100%', height: stroke, transform: 'translate(-50%, -50%) rotate(45deg)' };
      case 7: return { top: '50%', left: '50%', width: '100%', height: stroke, transform: 'translate(-50%, -50%) rotate(-45deg)' };
      default: return {};
    }
  };

  return (
    // Adicionei 'w-fit h-fit' para forçar o container a abraçar o conteúdo e não esticar/cortar
    // Adicionei 'inline-grid' para garantir que se comporta como um bloco sólido
    <div className={cn(
      "relative inline-grid grid-cols-3 select-none transition-all duration-300 w-fit h-fit",
      gap,
      isTreeMode ? `bg-transparent ${p}` : `bg-muted/30 backdrop-blur-md rounded-xl border border-border/20 shadow-xl ${p}`,
      className
    )}>
      {safeBoard.map((cell, i) => (
        <div
          key={i}
          className={cn(
            cellSize,
            "flex items-center justify-center rounded-[2px] font-black transition-all duration-300 leading-none", // leading-none voltou mas com flex center
            cell === null
              ? isTreeMode ? "bg-muted/10" : "bg-background/20"
              : "bg-background/90 shadow-sm border border-border/10",
            interactive ? "hover:scale-105 hover:bg-accent hover:border-primary/50 cursor-pointer active:scale-95" : "cursor-default",
            cell === 'X' ? "text-blue-500" : "text-rose-500"
          )}
          onClick={(e) => {
            if (interactive && onCellClick) {
              e.preventDefault();
              onCellClick(i);
            }
          }}
        >
          {/* O span interno garante centralização absoluta e previne corte da fonte */}
          <span className={cn(
            "flex items-center justify-center w-full h-full",
            isTreeMode ? '' : 'scale-110'
          )}>
            {cell || (interactive && <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />)}
          </span>
        </div>
      ))}
      {winnerInfo && (
        <div
          className="absolute bg-emerald-500/90 shadow-sm rounded-full z-10 pointer-events-none"
          style={getLinePosition(winnerInfo.line)}
        />
      )}
    </div>
  );
};