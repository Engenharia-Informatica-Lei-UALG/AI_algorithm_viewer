"use client"

import React from 'react';
import { ProblemType, CustomTreeNode } from '@/store/gameStore';
import { TicTacToeBoard } from '../game/TicTacToeBoard';
import { EightPuzzleBoard } from '../game/EightPuzzleBoard';

interface ProblemVisualizerProps {
    problemType: ProblemType;
    node: CustomTreeNode;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onEightPuzzleMove?: (tileIndex: number) => void;
}

export const ProblemVisualizer: React.FC<ProblemVisualizerProps> = ({
    problemType,
    node,
    size = 'md',
    interactive = false,
    onEightPuzzleMove
}) => {
    if (problemType === 'tictactoe') {
        return <TicTacToeBoard board={node.boardState} size={size} interactive={interactive} />;
    }

    if (problemType === '8puzzle') {
        return (
            <EightPuzzleBoard
                board={node.boardState}
                size={size === 'md' ? 'xs' : size} // Adjusting for tree node scale
                interactive={interactive}
                onTileClick={onEightPuzzleMove}
            />
        );
    }

    return null;
};
