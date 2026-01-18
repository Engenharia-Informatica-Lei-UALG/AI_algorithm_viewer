"use client"

import { useGameStore } from "@/store/gameStore"
import { TreeNodeItem } from "./TreeNodeItem"
import { TicTacToeBoard } from "./TicTacToeBoard"
import { EightPuzzleBoard } from "./EightPuzzleBoard"
import { useState } from "react"
import { RotateCcw, Play, MousePointer2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function TreeEditor() {
  const { tree, addNode, removeNode, updateNodeAttributes, problemType, updateTree } = useGameStore()

  // Estados para os editores de jogos
  const [ticTacToeTool, setTicTacToeTool] = useState<'X' | 'O' | null>('X');
  const initialTicTacToe = Array(9).fill(null);
  const initial8Puzzle = [1, 2, 3, 4, 5, 6, 7, 8, 0];

  const handleTicTacToeClick = (index: number) => {
    const newBoard = [...(tree.boardState || initialTicTacToe)];
    // Se a ferramenta for null, limpa a célula. Senão, coloca a peça.
    // Se a célula já tiver a peça da ferramenta, limpa também.
    if (newBoard[index] === ticTacToeTool) {
      newBoard[index] = null;
    } else {
      newBoard[index] = ticTacToeTool;
    }
    updateNodeAttributes('root', { boardState: newBoard });
  };

  const handle8PuzzleClick = (index: number) => {
    const newBoard = [...(tree.boardState || initial8Puzzle)];
    const emptyIndex = newBoard.indexOf(0);
    
    const isAdjacent = (idx1: number, idx2: number) => {
      const r1 = Math.floor(idx1 / 3), c1 = idx1 % 3;
      const r2 = Math.floor(idx2 / 3), c2 = idx2 % 3;
      return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    };

    if (isAdjacent(index, emptyIndex)) {
      [newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]];
      updateNodeAttributes('root', { boardState: newBoard });
    }
  };

  if (problemType === 'tictactoe') {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-black uppercase tracking-widest text-sm">Configurar Tabuleiro Inicial</h3>
          <p className="text-xs text-muted-foreground">1. Selecione a peça (X/O) ou a borracha. 2. Clique na célula.</p>
        </div>
        
        {/* Seletor de Ferramenta */}
        <div className="flex justify-center gap-2 bg-muted p-2 rounded-lg border">
          <button 
            onClick={() => setTicTacToeTool('X')}
            className={cn("w-10 h-10 flex items-center justify-center rounded-md font-black text-2xl transition-all", 
              ticTacToeTool === 'X' ? 'bg-blue-500 text-white shadow-md ring-2 ring-offset-2 ring-blue-500' : 'bg-background text-blue-500'
            )}
          >
            X
          </button>
          <button 
            onClick={() => setTicTacToeTool('O')}
            className={cn("w-10 h-10 flex items-center justify-center rounded-md font-black text-2xl transition-all", 
              ticTacToeTool === 'O' ? 'bg-red-500 text-white shadow-md ring-2 ring-offset-2 ring-red-500' : 'bg-background text-red-500'
            )}
          >
            O
          </button>
          <button 
            onClick={() => setTicTacToeTool(null)}
            className={cn("w-10 h-10 flex items-center justify-center rounded-md transition-all", 
              ticTacToeTool === null ? 'bg-foreground text-background shadow-md ring-2 ring-offset-2 ring-foreground' : 'bg-background text-muted-foreground'
            )}
            title="Limpar Célula"
          >
            <MousePointer2 size={20} />
          </button>
        </div>

        <TicTacToeBoard 
          board={tree.boardState || initialTicTacToe} 
          onCellClick={handleTicTacToeClick}
          size="lg" // Tamanho grande para melhor visualização
          interactive={true}
        />

        <button 
          onClick={() => updateNodeAttributes('root', { boardState: initialTicTacToe })}
          className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg text-xs font-bold hover:bg-accent transition-colors"
        >
          <RotateCcw size={14} /> Limpar Tabuleiro
        </button>
      </div>
    );
  }

  if (problemType === '8puzzle') {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-black uppercase tracking-widest text-sm">Configurar Estado Inicial</h3>
          <p className="text-xs text-muted-foreground">Clique nas peças adjacentes ao vazio para movê-las</p>
        </div>

        <EightPuzzleBoard 
          board={tree.boardState || initial8Puzzle}
          onTileClick={handle8PuzzleClick}
          size="lg"
          interactive={true}
        />

        <button 
          onClick={() => updateNodeAttributes('root', { boardState: initial8Puzzle })}
          className="w-full flex items-center justify-center gap-2 py-2 border rounded-lg text-xs font-bold hover:bg-accent transition-colors"
        >
          <RotateCcw size={14} /> Resetar Posições
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-xl bg-card overflow-auto max-h-[500px]">
      <h3 className="font-semibold mb-4">Editor de Árvore</h3>
      <TreeNodeItem 
        node={tree} 
        onAdd={addNode} 
        onRemove={removeNode} 
        onUpdate={updateNodeAttributes} 
        isRoot={true}
      />
    </div>
  )
}
