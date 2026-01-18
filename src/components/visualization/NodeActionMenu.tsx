"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, X, Check, Trash2, Target, Grid3X3, MousePointer2 } from 'lucide-react';
import { CustomTreeNode, useGameStore } from '@/store/gameStore';
import { TicTacToeBoard } from '../tree-editor/TicTacToeBoard';
import { EightPuzzleBoard } from '../tree-editor/EightPuzzleBoard';
import { cn } from '@/lib/utils';

interface NodeActionMenuProps {
  node: CustomTreeNode | null;
  position: { x: number; y: number };
  onClose: () => void;
  mode?: 'node' | 'edge';
}

const findNodeRecursive = (root: CustomTreeNode, id: string): CustomTreeNode | null => {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeRecursive(child, id);
    if (found) return found;
  }
  return null;
};

export function NodeActionMenu({ node: initialNode, position, onClose, mode = 'node' }: NodeActionMenuProps) {
  const { addNode, updateNodeAttributes, removeNode, algorithm, problemType, tree } = useGameStore();
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editName, setEditName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [boardInput, setBoardInput] = useState("");
  const [ticTacToeTool, setTicTacToeTool] = useState<'X' | 'O' | null>('X');

  const currentNode = useMemo(() => {
    if (!initialNode) return null;
    return findNodeRecursive(tree, initialNode.id) || initialNode;
  }, [tree, initialNode]);

  useEffect(() => {
    if (currentNode) {
      if (initialNode?.id !== currentNode.id) {
        setIsEditingValue(mode === 'edge');
        setIsEditingBoard(false);
        setIsEditingName(false);
        setSelectedTileIndex(null);
      }
      
      if (!isEditingValue) {
        setEditValue(mode === 'edge' 
          ? (currentNode.costToParent?.toString() || "1") 
          : (currentNode.value?.toString() || "0")
        );
      }
      if (!isEditingName) {
        setEditName(currentNode.name);
      }
      if (currentNode.boardState) {
        setBoardInput(currentNode.boardState.join(' '));
      }
    }
  }, [currentNode, mode, initialNode, isEditingValue, isEditingName]);

  if (!currentNode) return null;

  const isRoot = currentNode.id === 'root';
  const hasChildren = currentNode.children && currentNode.children.length > 0;
  const isAdversarial = algorithm === 'minimax' || algorithm === 'alpha-beta' || algorithm === 'mcts';
  const isGameProblem = problemType === 'tictactoe' || problemType === '8puzzle';

  const handleAddChild = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const initialBoard = currentNode.boardState ? [...currentNode.boardState] : undefined;
    
    addNode(currentNode.id, {
      id,
      name: `Node ${id.substr(0, 2)}`,
      value: 0,
      children: [],
      costToParent: 1,
      isGoal: false,
      boardState: initialBoard
    });
    onClose();
  };

  const handleSaveValue = () => {
    if (mode === 'edge') {
      updateNodeAttributes(currentNode.id, { costToParent: Number(editValue) });
    } else {
      updateNodeAttributes(currentNode.id, { value: Number(editValue) });
    }
    setIsEditingValue(false);
    onClose();
  };

  const handleSaveName = () => {
    const isGoalName = editName.toLowerCase().trim() === 'goal';
    updateNodeAttributes(currentNode.id, { 
      name: editName,
      isGoal: (!isAdversarial && isGoalName) ? true : currentNode.isGoal 
    });
    setIsEditingName(false);
    onClose();
  };

  const toggleGoal = () => {
    updateNodeAttributes(currentNode.id, { isGoal: !currentNode.isGoal });
    onClose();
  };

  const handleRemove = () => {
    if (isRoot) return;
    if (hasChildren) {
      if (window.confirm(`Este nó possui filhos. Tem certeza que deseja remover o nó "${currentNode.name}" e todos os seus descendentes?`)) {
        removeNode(currentNode.id);
        onClose();
      }
    } else {
      removeNode(currentNode.id);
      onClose();
    }
  };

  const handleTicTacToeEdit = (index: number) => {
    const currentBoard = currentNode.boardState || Array(9).fill(null);
    const newBoard = [...currentBoard];
    
    if (newBoard[index] === ticTacToeTool) {
      newBoard[index] = null;
    } else {
      newBoard[index] = ticTacToeTool;
    }

    updateNodeAttributes(currentNode.id, { boardState: newBoard });
  };

  const handle8PuzzleEdit = (index: number) => {
    if (selectedTileIndex === null) {
      setSelectedTileIndex(index);
      return;
    }

    if (selectedTileIndex === index) {
      setSelectedTileIndex(null);
      return;
    }

    const currentBoard = currentNode.boardState || [1, 2, 3, 4, 5, 6, 7, 8, 0];
    const newBoard = [...currentBoard];
    
    const temp = newBoard[selectedTileIndex];
    newBoard[selectedTileIndex] = newBoard[index];
    newBoard[index] = temp;
    
    updateNodeAttributes(currentNode.id, { boardState: newBoard });
    setSelectedTileIndex(null);
  };

  const handleBoardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setBoardInput(input);

    if (problemType === '8puzzle') {
      const numbers = input.split(/\s+/).filter(Boolean).map(Number);
      if (numbers.length === 9 && new Set(numbers).size === 9 && numbers.every(n => n >= 0 && n <= 8)) {
        updateNodeAttributes(currentNode.id, { boardState: numbers });
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        style={{ left: position.x - 100, top: position.y + 20 }}
        className="fixed z-50 w-64 bg-popover border shadow-xl rounded-lg p-2 flex flex-col gap-1"
      >
        <div className="flex items-center justify-between px-2 py-1 border-b mb-1">
          {isEditingName ? (
            <div className="flex gap-1 items-center w-full mr-2">
              <input 
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-background border rounded px-1 text-xs h-6"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button onClick={handleSaveName} className="text-primary"><Check size={14}/></button>
            </div>
          ) : (
            <span 
              className="text-xs font-bold truncate cursor-pointer hover:text-primary"
              onClick={() => mode === 'node' && setIsEditingName(true)}
              title="Clique para renomear"
            >
              {mode === 'edge' ? `Custo para ${currentNode.name}` : currentNode.name}
            </span>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <X size={14} />
          </button>
        </div>

        {isEditingBoard ? (
          <div className="p-2 flex flex-col items-center gap-3 bg-muted/30 rounded-md">
            <div className="flex justify-between w-full items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {problemType === '8puzzle' ? 'Trocar Peças' : 'Alterar Células'}
              </span>
              <button onClick={() => setIsEditingBoard(false)} className="text-xs text-primary hover:underline">Concluir</button>
            </div>

            {problemType === 'tictactoe' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center gap-2 bg-muted p-1 rounded-lg border">
                  <button 
                    onClick={() => setTicTacToeTool('X')}
                    className={cn("w-8 h-8 flex items-center justify-center rounded-md font-black text-xl transition-all", 
                      ticTacToeTool === 'X' ? 'bg-blue-500 text-white shadow-sm ring-2 ring-offset-1 ring-blue-500' : 'bg-background text-blue-500'
                    )}
                  >X</button>
                  <button 
                    onClick={() => setTicTacToeTool('O')}
                    className={cn("w-8 h-8 flex items-center justify-center rounded-md font-black text-xl transition-all", 
                      ticTacToeTool === 'O' ? 'bg-red-500 text-white shadow-sm ring-2 ring-offset-1 ring-red-500' : 'bg-background text-red-500'
                    )}
                  >O</button>
                  <button 
                    onClick={() => setTicTacToeTool(null)}
                    className={cn("w-8 h-8 flex items-center justify-center rounded-md transition-all", 
                      ticTacToeTool === null ? 'bg-foreground text-background shadow-sm ring-2 ring-offset-1 ring-foreground' : 'bg-background text-muted-foreground'
                    )}
                  ><MousePointer2 size={16} /></button>
                </div>
                <TicTacToeBoard 
                  board={currentNode.boardState || Array(9).fill(null)} 
                  size="sm" 
                  interactive={true}
                  onCellClick={handleTicTacToeEdit}
                />
              </div>
            )}

            {problemType === '8puzzle' && (
              <div className="flex flex-col items-center gap-2 w-full">
                <EightPuzzleBoard 
                  board={currentNode.boardState || [1,2,3,4,5,6,7,8,0]} 
                  size="sm" 
                  interactive={true}
                  highlightIndex={selectedTileIndex}
                  onTileClick={handle8PuzzleEdit}
                />
                <input
                  type="text"
                  value={boardInput}
                  onChange={handleBoardInputChange}
                  placeholder="Ex: 1 2 3 4 5 6 7 8 0"
                  className="w-full text-center font-mono bg-background border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>
        ) : isEditingValue ? (
          <div className="p-2 space-y-2">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">
              {mode === 'edge' ? 'Custo da Aresta (g)' : 'Valor da Heurística (h)'}
            </label>
            <div className="flex gap-1">
              <input 
                autoFocus
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-background border rounded px-2 py-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveValue()}
              />
              <button 
                onClick={handleSaveValue}
                className="bg-primary text-primary-foreground p-1 rounded hover:bg-primary/90"
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {mode === 'node' && (
              <>
                <button 
                  onClick={handleAddChild}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                >
                  <Plus size={16} className="text-primary" />
                  <span>Adicionar Filho</span>
                </button>
                
                {isGameProblem && (
                  <button 
                    onClick={() => setIsEditingBoard(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  >
                    <Grid3X3 size={16} className="text-primary" />
                    <span>Editar Tabuleiro</span>
                  </button>
                )}

                {problemType === 'custom' && !isAdversarial && (
                  <button 
                    onClick={toggleGoal}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${currentNode.isGoal ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'hover:bg-accent'}`}
                  >
                    <Target size={16} className={currentNode.isGoal ? "text-green-600" : "text-primary"} />
                    <span>{currentNode.isGoal ? 'Remover Objetivo' : 'Marcar como Objetivo'}</span>
                  </button>
                )}
              </>
            )}
            
            {(problemType === 'custom' || isAdversarial) && (
              <button 
                onClick={() => setIsEditingValue(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                <Edit2 size={16} className="text-primary" />
                <span>Editar {mode === 'edge' ? 'Custo' : 'Valor'}</span>
              </button>
            )}

            {!isRoot && mode === 'node' && (
              <button 
                onClick={handleRemove}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-md transition-colors"
              >
                <Trash2 size={16} />
                <span>Apagar Nó</span>
              </button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
