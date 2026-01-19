import React from 'react';
import { cn } from '@/lib/utils';
import { getWinnerInfo, WINNING_LINES } from '@/lib/ai/problems/TicTacToe';

// --- TIC TAC TOE BOARD ---

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

    const styles = {
        xs: { cellSize: 'w-8 h-8 text-base', gap: 'gap-1', stroke: '2px', p: 'p-1' },
        sm: { cellSize: 'w-8 h-8 text-base', gap: 'gap-1', stroke: '2px', p: 'p-1.5' },
        md: { cellSize: 'w-12 h-12 text-2xl', gap: 'gap-1.5', stroke: '4px', p: 'p-2' },
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
                        "flex items-center justify-center rounded-[2px] font-black transition-all duration-300 leading-none",
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

// --- EIGHT PUZZLE BOARD ---

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
    const getBoardData = (): number[] => {
        if (Array.isArray(board) && board.length === 9) return board;
        if (board && typeof board === 'object' && 'boardState' in board && Array.isArray((board as any).boardState) && (board as any).boardState.length === 9) {
            return (board as any).boardState;
        }
        return [1, 2, 3, 4, 5, 6, 7, 8, 0];
    };

    const safeBoard = getBoardData();

    const styles = {
        xs: { cellSize: 'w-[28px] h-[28px] text-sm', gap: 'gap-1', p: 'p-1' },
        sm: { cellSize: 'w-9 h-9 text-lg', gap: 'gap-1', p: 'p-1.5' },
        md: { cellSize: 'w-12 h-12 text-2xl', gap: 'gap-1.5', p: 'p-2' },
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
                    {cell !== 0 && (
                        <div className="absolute inset-0 bg-blue-500/5 opacity-50 pointer-events-none" />
                    )}
                </button>
            ))}
        </div>
    );
};
