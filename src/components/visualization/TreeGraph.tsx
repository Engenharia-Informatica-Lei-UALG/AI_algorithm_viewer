"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Group } from '@visx/group';
import { Tree, hierarchy } from '@visx/hierarchy';
import { LinkVertical } from '@visx/shape';
import { Zoom } from '@visx/zoom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, X, Check, Trash2, Target, Grid3X3, MousePointer2, Repeat, Calculator, GitFork, Trophy, Eye } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { CustomTreeNode, NodeShape } from '@/types/game';
import { cn } from '@/lib/utils';
import { TicTacToeBoard, EightPuzzleBoard } from '../game/Boards';

// --- SUB-COMPONENT: PROBLEM VISUALIZER ---

interface ProblemVisualizerProps {
  problemType: string;
  node: CustomTreeNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onEightPuzzleMove?: (tileIndex: number) => void;
}

const ProblemVisualizer: React.FC<ProblemVisualizerProps> = ({
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
        size={size === 'md' ? 'xs' : size}
        interactive={interactive}
        onTileClick={onEightPuzzleMove}
      />
    );
  }
  return null;
};

// --- SUB-COMPONENT: NODE ACTION MENU ---

interface NodeActionMenuProps {
  node: CustomTreeNode | null;
  position: { x: number; y: number };
  onClose: () => void;
  mode?: 'node' | 'edge';
}

export const findNodeRecursive = (root: CustomTreeNode, id: string): CustomTreeNode | null => {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeRecursive(child, id);
    if (found) return found;
  }
  return null;
};

export const findParentRecursive = (root: CustomTreeNode, targetId: string): CustomTreeNode | null => {
  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentRecursive(child, targetId);
    if (found) return found;
  }
  return null;
};

export function NodeActionMenu({ node: initialNode, position, onClose, mode = 'node' }: NodeActionMenuProps) {
  const { addNode, updateNodeAttributes, removeNode, algorithm, problemType, tree, searchSettings } = useGameStore();
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

  const parentNode = useMemo(() => {
    if (!currentNode) return null;
    return findParentRecursive(tree, currentNode.id);
  }, [tree, currentNode]);

  useEffect(() => {
    if (currentNode) {
      if (initialNode?.id !== currentNode.id) {
        setIsEditingValue(mode === 'edge');
        setIsEditingBoard(false);
        setIsEditingName(false);
        setSelectedTileIndex(null);
      }
      if (!isEditingValue) {
        setEditValue(mode === 'edge' ? (currentNode.costToParent?.toString() || "1") : (currentNode.value?.toString() || "0"));
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
  const isMCTS = algorithm === 'mcts';

  const handleAddChild = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const initialBoard = currentNode.boardState ? [...currentNode.boardState] : undefined;
    addNode(currentNode.id, { id, name: `Node ${id.substr(0, 2)}`, value: 0, children: [], costToParent: 1, isGoal: false, boardState: initialBoard });
    onClose();
  };

  const handleSaveValue = () => {
    if (mode === 'edge') updateNodeAttributes(currentNode.id, { costToParent: Number(editValue) });
    else updateNodeAttributes(currentNode.id, { value: Number(editValue) });
    setIsEditingValue(false);
    onClose();
  };

  const handleSaveName = () => {
    const isGoalName = editName.toLowerCase().trim() === 'goal';
    updateNodeAttributes(currentNode.id, { name: editName, isGoal: (!isAdversarial && isGoalName) ? true : currentNode.isGoal });
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

  // Cálculos MCTS
  let mctsStats = null;
  if (isMCTS && currentNode) {
    const N = (parentNode as any)?.visits || 0; // Visitas do pai
    const n = (currentNode as any).visits || 0; // Visitas do nó
    const v = currentNode.value || 0;  // Valor médio (Q/n) já calculado pelo algoritmo
    const C = searchSettings.mctsExploration;
    
    // Evita divisão por zero e logs inválidos
    const explorationTerm = (n > 0 && N > 0) ? C * Math.sqrt(Math.log(N) / n) : 0;
    const ucbScore = v + explorationTerm; // Simplificado (assume Max player para visualização)

    mctsStats = { N, n, v, explorationTerm, ucbScore };
  }

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
              <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-background border rounded px-1 text-xs h-6" onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
              <button onClick={handleSaveName} className="text-primary"><Check size={14} /></button>
            </div>
          ) : (
            <span className="text-xs font-bold truncate cursor-pointer hover:text-primary" onClick={() => mode === 'node' && setIsEditingName(true)} title="Clique para renomear">
              {mode === 'edge' ? `Custo para ${currentNode.name}` : currentNode.name}
            </span>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0"><X size={14} /></button>
        </div>

        {/* SEÇÃO DE ESPECIFICAÇÕES MCTS */}
        {isMCTS && mctsStats && mode === 'node' && (
          <div className="p-2 bg-primary/5 rounded-md border border-primary/10 mb-1 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
              <Calculator size={12} /> Especificações MCTS
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background p-1.5 rounded border flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <Eye size={9} /> Visitas (n)
                </span>
                <span className="font-mono font-bold">{mctsStats.n}</span>
              </div>
              <div className="bg-background p-1.5 rounded border flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <GitFork size={9} /> Filhos
                </span>
                <span className="font-mono font-bold">{currentNode.children.length}</span>
              </div>
              <div className="bg-background p-1.5 rounded border flex flex-col col-span-2">
                <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <Trophy size={9} /> Pontuação UCB1
                </span>
                <div className="flex justify-between items-end">
                  <span className="font-mono font-bold text-primary">{mctsStats.ucbScore.toFixed(4)}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {mctsStats.v.toFixed(2)} (Q) + {mctsStats.explorationTerm.toFixed(2)} (Expl)
                  </span>
                </div>
              </div>
            </div>
            
            {parentNode && (
              <div className="text-[9px] text-muted-foreground text-center border-t border-primary/10 pt-1">
                Visitas do Pai (N): <span className="font-mono font-bold">{mctsStats.N}</span>
              </div>
            )}
          </div>
        )}

        {isEditingBoard ? (
          <div className="p-2 flex flex-col items-center gap-3 bg-muted/30 rounded-md">
            <div className="flex justify-between w-full items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">{problemType === '8puzzle' ? 'Trocar Peças' : 'Alterar Células'}</span>
              <button onClick={() => setIsEditingBoard(false)} className="text-xs text-primary hover:underline">Concluir</button>
            </div>
            {problemType === 'tictactoe' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center gap-2 bg-muted p-1 rounded-lg border">
                  <button onClick={() => setTicTacToeTool('X')} className={cn("w-8 h-8 flex items-center justify-center rounded-md font-black text-xl transition-all", ticTacToeTool === 'X' ? 'bg-blue-500 text-white shadow-sm ring-2 ring-offset-1 ring-blue-500' : 'bg-background text-blue-500')}>X</button>
                  <button onClick={() => setTicTacToeTool('O')} className={cn("w-8 h-8 flex items-center justify-center rounded-md font-black text-xl transition-all", ticTacToeTool === 'O' ? 'bg-red-500 text-white shadow-sm ring-2 ring-offset-1 ring-red-500' : 'bg-background text-red-500')}>O</button>
                  <button onClick={() => setTicTacToeTool(null)} className={cn("w-8 h-8 flex items-center justify-center rounded-md transition-all", ticTacToeTool === null ? 'bg-foreground text-background shadow-sm ring-2 ring-offset-1 ring-foreground' : 'bg-background text-muted-foreground')}><MousePointer2 size={16} /></button>
                </div>
                <TicTacToeBoard board={currentNode.boardState || Array(9).fill(null)} size="sm" interactive={true} onCellClick={(idx) => {
                  const currentBoard = currentNode.boardState || Array(9).fill(null);
                  const newBoard = [...currentBoard];
                  if (newBoard[idx] === ticTacToeTool) newBoard[idx] = null;
                  else newBoard[idx] = ticTacToeTool;
                  updateNodeAttributes(currentNode.id, { boardState: newBoard });
                }} />
              </div>
            )}
            {problemType === '8puzzle' && (
              <div className="flex flex-col items-center gap-2 w-full">
                <EightPuzzleBoard board={currentNode.boardState || [1, 2, 3, 4, 5, 6, 7, 8, 0]} size="sm" interactive={true} highlightIndex={selectedTileIndex} onTileClick={(idx) => {
                  if (selectedTileIndex === null) { setSelectedTileIndex(idx); return; }
                  if (selectedTileIndex === idx) { setSelectedTileIndex(null); return; }
                  const currentBoard = currentNode.boardState || [1, 2, 3, 4, 5, 6, 7, 8, 0];
                  const newBoard = [...currentBoard];
                  const temp = newBoard[selectedTileIndex];
                  newBoard[selectedTileIndex] = newBoard[idx];
                  newBoard[idx] = temp;
                  updateNodeAttributes(currentNode.id, { boardState: newBoard });
                  setSelectedTileIndex(null);
                }} />
              </div>
            )}
          </div>
        ) : isEditingValue ? (
          <div className="p-2 space-y-2">
            <label className="text-[10px] uppercase text-muted-foreground font-bold">{mode === 'edge' ? 'Custo da Aresta (g)' : 'Valor da Heurística (h)'}</label>
            <div className="flex gap-1">
              <input autoFocus type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-background border rounded px-2 py-1 text-sm" onKeyDown={(e) => e.key === 'Enter' && handleSaveValue()} />
              <button onClick={handleSaveValue} className="bg-primary text-primary-foreground p-1 rounded hover:bg-primary/90"><Check size={16} /></button>
            </div>
          </div>
        ) : (
          <>
            {mode === 'node' && (
              <>
                <button onClick={handleAddChild} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors">
                  <Plus size={16} className="text-primary" /> <span>Adicionar Filho</span>
                </button>
                {isGameProblem && (
                  <button onClick={() => setIsEditingBoard(true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors">
                    <Grid3X3 size={16} className="text-primary" /> <span>Editar Tabuleiro</span>
                  </button>
                )}
                {problemType === 'custom' && !isAdversarial && (
                  <button onClick={toggleGoal} className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${currentNode.isGoal ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'hover:bg-accent'}`}>
                    <Target size={16} className={currentNode.isGoal ? "text-green-600" : "text-primary"} /> <span>{currentNode.isGoal ? 'Remover Objetivo' : 'Marcar como Objetivo'}</span>
                  </button>
                )}
              </>
            )}
            {(problemType === 'custom' || isAdversarial) && (
              <button onClick={() => setIsEditingValue(true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors">
                <Edit2 size={16} className="text-primary" /> <span>Editar {mode === 'edge' ? 'Custo' : 'Valor'}</span>
              </button>
            )}
            {!isRoot && mode === 'node' && (
              <button onClick={handleRemove} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-md transition-colors">
                <Trash2 size={16} /> <span>Apagar Nó</span>
              </button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// --- MAIN TREE GRAPH COMPONENT ---

interface TreeGraphProps {
  data: CustomTreeNode & { isCurrent?: boolean };
  width: number;
  height: number;
  zoomResetTrigger?: number;
}

export default function TreeGraph({ data, width, height, zoomResetTrigger }: TreeGraphProps) {
  const { algorithm, maxNodeShape, minNodeShape, admissibilityViolations, nodeViewMode, problemType, updateNodeAttributes } = useGameStore();

  const [selectedNode, setSelectedNode] = useState<CustomTreeNode | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuMode, setMenuMode] = useState<'node' | 'edge'>('node');
  const zoomRef = useRef<any>(null);

  const root = useMemo(() => hierarchy(data), [data]);

  const isGameMode = nodeViewMode === 'game' && problemType !== 'custom';
  const minNodeWidth = problemType === 'tictactoe' ? 160 : 120;
  const minNodeHeight = problemType === 'tictactoe' ? 200 : 160;
  const treeWidth = Math.max(root.leaves().length * minNodeWidth, minNodeWidth);
  const treeHeight = Math.max(root.height * minNodeHeight, minNodeHeight);

  useEffect(() => {
    if (zoomRef.current) {
      // Lógica de centralização inteligente
      // O layout da árvore coloca a raiz em (treeWidth / 2)
      // O Group tem um offset de left={50}
      // Queremos que o ponto (treeWidth/2 + 50) esteja no centro do ecrã (width/2)
      
      const rootX = treeWidth / 2;
      const screenCenter = width / 2;
      const screenCenterY = height / 2;

      // dx é o quanto precisamos mover para alinhar os centros
      const dx = screenCenter - (rootX + 50);
      const dy = screenCenterY - (treeHeight / 2 + 50);

      zoomRef.current.translateTo({ x: dx, y: dy });
      zoomRef.current.scale({ scaleX: 1, scaleY: 1 });
    }
  }, [zoomResetTrigger, width, height, treeWidth, treeHeight]); // Recalcula se a largura mudar

  const handleNodeClick = (e: React.MouseEvent, node: CustomTreeNode) => {
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuMode('node');
    setSelectedNode(node);
  };

  const handleEdgeClick = (e: React.MouseEvent, node: CustomTreeNode) => {
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuMode('edge');
    setSelectedNode(node);
  };

  const handle8PuzzleMove = (nodeHierarchy: any, tileIndex: number) => {
    const currentNode = nodeHierarchy.data as CustomTreeNode;
    const parentNode = nodeHierarchy.parent?.data as CustomTreeNode;
    const currentBoard = currentNode.boardState || [1, 2, 3, 4, 5, 6, 7, 8, 0];
    const emptyIndex = currentBoard.indexOf(0);
    const r1 = Math.floor(tileIndex / 3), c1 = tileIndex % 3;
    const r2 = Math.floor(emptyIndex / 3), c2 = emptyIndex % 3;
    const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

    if (!isAdjacent) return;
    const newBoard = [...currentBoard];
    [newBoard[tileIndex], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[tileIndex]];

    if (parentNode) {
      const parentBoard = parentNode.boardState || [1, 2, 3, 4, 5, 6, 7, 8, 0];
      const diffCount = parentBoard.reduce((acc: number, val: number, idx: number) => acc + (val !== newBoard[idx] ? 1 : 0), 0);
      if (diffCount !== 2) {
        alert("Movimento Inválido! O estado do filho deve ser alcançável com apenas 1 movimento a partir do estado do pai.");
        return;
      }
    }
    updateNodeAttributes(currentNode.id, { boardState: newBoard });
  };

  const showHeuristic = algorithm && !['bfs', 'dfs', 'ids', 'ucs'].includes(algorithm);
  const isAlphaBeta = algorithm === 'alpha-beta';
  const isMCTS = algorithm === 'mcts';

  const isRepeatedNode = (node: any) => {
    let current = node.parent;
    while (current) {
      if (current.data.name === node.data.name) return true;
      current = current.parent;
    }
    return false;
  };

  const renderNodeShape = (node: any, isSelected: boolean, isVisited: boolean, isGoal: boolean, isCurrent: boolean, isPruned: boolean, isRepeated: boolean) => {
    const nodeData = node.data as CustomTreeNode;
    const isViolation = admissibilityViolations.includes(nodeData.id);

    if (isGameMode) {
      const boardSize = problemType === 'tictactoe' ? 120 : 100;
      return (
        <Group opacity={isPruned ? 0.4 : 1}>
          <foreignObject x={-boardSize / 2} y={-boardSize / 2} width={boardSize} height={boardSize}>
            <div className={cn(
              "w-full h-full flex items-center justify-center rounded-xl border-2 transition-all duration-300 shadow-md p-1",
              isCurrent ? "border-purple-500 bg-purple-500/5 ring-4 ring-purple-500/20" :
                isGoal ? "border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/20" :
                  isSelected ? "border-orange-500 bg-orange-500/5 shadow-orange-500/20" :
                    "border-border/60 bg-slate-50/50 dark:bg-slate-900/50",
              isPruned && "grayscale border-dashed",
              isRepeated && "border-yellow-500/50 bg-yellow-500/5"
            )}>
              <ProblemVisualizer problemType={problemType} node={nodeData} size="xs" interactive={problemType === '8puzzle'} onEightPuzzleMove={(idx) => handle8PuzzleMove(node, idx)} />
            </div>
          </foreignObject>
          {isPruned && <text y={10} textAnchor="middle" fontSize={40} fill="red" fontWeight="bold" style={{ pointerEvents: 'none' }}>✕</text>}
          {isRepeated && !isPruned && <Group x={boardSize / 2 - 10} y={-boardSize / 2 + 10}><circle r={12} fill="orange" /><Repeat size={14} color="white" x={-7} y={-7} /></Group>}
        </Group>
      );
    }

    let shape: NodeShape = 'circle';
    if (algorithm === 'minimax' || algorithm === 'alpha-beta') shape = node.depth % 2 === 0 ? maxNodeShape : minNodeShape;

    const commonProps = {
      initial: { scale: 0 },
      animate: { scale: 1, scaleX: isCurrent ? [1, 1.05, 1] : 1, scaleY: isCurrent ? [1, 1.05, 1] : 1 },
      transition: { duration: 0.3, scaleX: { duration: 1.5, repeat: Infinity }, scaleY: { duration: 1.5, repeat: Infinity } },
      whileHover: { scale: 1.1 },
      className: cn("cursor-pointer transition-colors duration-300", isViolation ? "text-destructive stroke-destructive-foreground" : isCurrent ? "text-purple-600 stroke-purple-900" : isGoal ? "text-green-500 stroke-green-700" : isVisited ? "text-primary/60" : isSelected ? "text-card stroke-orange-500" : "text-card stroke-foreground", isPruned && "text-muted-foreground/30 stroke-muted-foreground/30", isRepeated && !isPruned && "stroke-yellow-500"),
      strokeWidth: isSelected || isCurrent || isViolation ? 6 : (isGoal ? 5 : 3),
      fill: "currentColor", stroke: "currentColor", strokeDasharray: isPruned ? "5,5" : (isRepeated ? "2,2" : "none")
    };

    if (shape === 'triangle') return <motion.polygon points="-30,20 30,20 0,-32" {...commonProps} />;
    if (shape === 'square') return <motion.rect x={-26} y={-26} width={52} height={52} rx={4} {...commonProps} />;
    return <motion.circle r={28} {...commonProps} />;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background rounded-xl border-2 border-border shadow-inner transition-colors duration-300">
      <Zoom width={width} height={height} scaleXMin={1 / 4} scaleXMax={4} scaleYMin={1 / 4} scaleYMax={4}>
        {(zoom) => (
          <div className="relative w-full h-full overflow-hidden" ref={(node) => { 
            if (zoom.containerRef) (zoom.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            zoomRef.current = zoom; 
          }} style={{ touchAction: 'none' }}>
            <svg width={width} height={height} className={cn("w-full h-full", zoom.isDragging ? "cursor-grabbing" : "cursor-grab")} onClick={() => setSelectedNode(null)}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted/10" /></pattern>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="2" /><feOffset dx="1" dy="1" result="offsetblur" /><feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <rect width={width} height={height} fill="url(#grid)" />
              <Group transform={zoom.toString()}>
                <Tree root={root} size={[treeWidth, treeHeight]} separation={(a, b) => (a.parent === b.parent ? 1 : 1.5)}>
                  {tree => (
                    <Group top={50} left={50}>
                      {tree.links().map((link, i) => {
                        const targetData = link.target.data as CustomTreeNode;
                        const cost = targetData.costToParent;
                        const isPruned = targetData.isPruned;
                        return (
                          <Group key={`link-group-${i}`} opacity={isPruned ? 0.3 : 1}>
                            <LinkVertical data={link} stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray={isPruned ? "5,5" : "none"} className="text-muted-foreground/30" />
                            {cost !== undefined && (
                              <Group className="cursor-pointer" onClick={(e) => handleEdgeClick(e, targetData)}>
                                <rect x={(link.source.x + link.target.x) / 2 - 14} y={(link.source.y + link.target.y) / 2 - 14} width={28} height={28} rx={14} fill="currentColor" className="text-muted hover:text-accent transition-colors border border-border" />
                                <text x={(link.source.x + link.target.x) / 2} y={(link.source.y + link.target.y) / 2} dy=".33em" fontSize={11} fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-muted-foreground select-none pointer-events-none">{cost}</text>
                              </Group>
                            )}
                          </Group>
                        );
                      })}
                      {tree.descendants().map((node, i) => {
                        const nodeData = node.data as CustomTreeNode & { isCurrent?: boolean };
                        const isSelected = selectedNode?.id === nodeData.id && menuMode === 'node';
                        const isVisited = nodeData.isVisited, isGoal = nodeData.isGoal, isCurrent = nodeData.isCurrent, isPruned = nodeData.isPruned, isRepeated = isRepeatedNode(node);
                        return (
                          <Group key={`node-${i}`} top={node.y} left={node.x} onClick={(e) => handleNodeClick(e, nodeData)} className="cursor-pointer" filter={isPruned ? undefined : "url(#shadow)"}>
                            {isGoal && !isPruned && <motion.circle r={36} fill="none" stroke="#22c55e" strokeWidth={3} strokeDasharray="4 4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, rotate: 360 }} transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, default: { duration: 0.3 } }} />}
                            {isCurrent && <motion.circle r={34} fill="none" stroke="#a855f7" strokeWidth={4} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                            {renderNodeShape(node, !!isSelected, !!isVisited, !!isGoal, !!isCurrent, !!isPruned, isRepeated)}
                            
                            {/* Nome do Nó */}
                            <text
                              dy={isGameMode ? (problemType === 'tictactoe' ? -75 : -65) : ".33em"}
                              fontSize={isGameMode ? 10 : 11}
                              fontWeight="bold"
                              textAnchor="middle"
                              style={{ pointerEvents: 'none' }}
                              fill="currentColor"
                              className={cn(
                                isGameMode ? "text-muted-foreground" : (isCurrent || isGoal || admissibilityViolations.includes(nodeData.id) ? "text-white" : "text-foreground"),
                                isPruned && "opacity-30"
                              )}
                            >
                              {nodeData.name}
                            </text>
                            
                            {/* Visualização Padrão de Heurística */}
                            {showHeuristic && !isMCTS && nodeData.value !== undefined && !isPruned && (
                              <Group y={nodeViewMode === 'game' ? 85 : 40} x={0}>
                                <rect x={-18} y={-12} width={36} height={20} rx={10} fill="currentColor" className="text-foreground" />
                                <text dy=".33em" fontSize={10} fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-background">{nodeViewMode === 'game' ? 'v' : 'h'}:{nodeData.value}</text>
                              </Group>
                            )}

                            {/* Visualização Específica MCTS (Q/N) */}
                            {isMCTS && !isPruned && (
                              <Group y={nodeViewMode === 'game' ? 85 : 40} x={0}>
                                <rect x={-25} y={-12} width={50} height={20} rx={10} fill="currentColor" className="text-foreground" />
                                <text dy=".33em" fontSize={9} fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-background">
                                  {nodeData.value?.toFixed(1)} / {(nodeData as any).visits || 0}
                                </text>
                              </Group>
                            )}
                            {isAlphaBeta && !isPruned && (nodeData.alpha !== undefined || nodeData.beta !== undefined) && (
                              <Group y={nodeViewMode === 'game' ? -85 : -50} x={0}>
                                <rect x={-35} y={-10} width={70} height={20} rx={4} fill="currentColor" className="text-muted/90 border border-border" />
                                <text dy=".33em" fontSize={9} fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-foreground">α:{nodeData.alpha === -Infinity ? '-∞' : nodeData.alpha} β:{nodeData.beta === Infinity ? '∞' : nodeData.beta}</text>
                              </Group>
                            )}
                          </Group>
                        );
                      })}
                    </Group>
                  )}
                </Tree>
              </Group>
            </svg>
          </div>
        )}
      </Zoom>
      <NodeActionMenu node={selectedNode} position={menuPos} mode={menuMode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
