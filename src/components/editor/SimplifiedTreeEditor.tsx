import React, { useState } from 'react';
import { useGameStore, CustomTreeNode } from '@/store/gameStore';
import { TicTacToeBoard } from '../game/TicTacToeBoard';
import { EightPuzzleBoard } from '../game/EightPuzzleBoard';
import { ChevronRight, ChevronDown, Plus, Trash2, Target, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TreeItem: React.FC<{ node: CustomTreeNode; depth: number }> = ({ node, depth }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { 
    problemType, algorithm, addNode, removeNode, updateNodeAttributes, 
    isSimulating, nodesExplored 
  } = useGameStore();

  const isLocked = isSimulating || nodesExplored > 0;

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    addNode(node.id, {
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
      name: `Move ${node.children.length + 1}`,
      children: [],
      boardState: node.boardState ? [...node.boardState] : undefined,
      value: 0
    });
    setIsExpanded(true);
  };

  const handleCellClick = (index: number) => {
    if (isLocked || problemType !== 'tictactoe') return;
    const newBoard = [...node.boardState];
    // Ciclo: null -> X -> O -> null
    const current = newBoard[index];
    newBoard[index] = current === null ? 'X' : current === 'X' ? 'O' : null;
    updateNodeAttributes(node.id, { boardState: newBoard });
  };

  const isAdversarial = algorithm === 'minimax' || algorithm === 'alpha-beta' || algorithm === 'mcts';
  const valueLabel = isAdversarial ? 'Utility' : 'Heuristic';

  return (
    <div className="flex flex-col border-l border-border/30 ml-2">
      <div className={cn(
        "flex items-center gap-3 p-2 hover:bg-accent/40 rounded-r-md transition-colors group",
        node.isGoal && "bg-yellow-500/10 border-r-2 border-yellow-500"
      )}>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-muted-foreground">
          {node.children.length > 0 ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <Circle size={4} className="mx-1.5" />}
        </button>

        {/* Visualização do Estado */}
        <div className="shrink-0">
          {problemType === 'tictactoe' && node.boardState && (
            <TicTacToeBoard board={node.boardState} size="sm" onCellClick={handleCellClick} />
          )}
          {problemType === '8puzzle' && node.boardState && (
            <EightPuzzleBoard board={node.boardState} size="sm" />
          )}
          {problemType === 'custom' && (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
              {node.name[0]}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <input 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 w-full"
            value={node.name}
            onChange={(e) => updateNodeAttributes(node.id, { name: e.target.value })}
            disabled={isLocked}
          />
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{valueLabel}:</span>
            <input 
              type="number"
              className="bg-transparent border-b border-border/50 w-12 text-center focus:outline-none text-foreground"
              value={node.value ?? 0}
              onChange={(e) => updateNodeAttributes(node.id, { value: Number(e.target.value) })}
              disabled={isLocked}
            />
            {node.costToParent && <span>Custo: {node.costToParent}</span>}
          </div>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => updateNodeAttributes(node.id, { isGoal: !node.isGoal })}
              className={cn("p-1 rounded hover:bg-background", node.isGoal ? "text-yellow-500" : "text-muted-foreground")}
              title="Marcar como Objetivo"
            >
              <Target size={14} />
            </button>
            <button onClick={handleAddChild} className="p-1 rounded hover:bg-background text-green-500" title="Adicionar Filho">
              <Plus size={14} />
            </button>
            {node.id !== 'root' && (
              <button onClick={() => removeNode(node.id)} className="p-1 rounded hover:bg-background text-destructive" title="Remover">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {isExpanded && node.children.map(child => (
        <TreeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

export const SimplifiedTreeEditor: React.FC = () => {
  const tree = useGameStore(state => state.tree);
  
  return (
    <div className="h-full flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="text-sm font-semibold">Estrutura da Busca</h3>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
          Editor
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <TreeItem node={tree} depth={0} />
      </div>
      <div className="p-3 bg-muted/10 border-t text-[10px] text-muted-foreground italic">
        Dica: No Tic-Tac-Toe, clique nas células do mini-tabuleiro para alternar entre X e O.
      </div>
    </div>
  );
};