"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Group } from '@visx/group';
import * as d3 from 'd3';
import { Tree, hierarchy } from '@visx/hierarchy';
import { LinkVertical } from '@visx/shape';
import { Zoom } from '@visx/zoom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, X, Check, Trash2, Target, Grid3X3, MousePointer2, Repeat, Calculator, GitFork, Trophy, Eye, Zap } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { CustomTreeNode, NodeShape } from '@/types/game';
import { cn } from '@/lib/utils';
import { TicTacToeBoard, EightPuzzleBoard } from '../game/Boards';
import { useTranslation } from 'react-i18next';

// --- SUB-COMPONENT: PROBLEM VISUALIZER ---

/**
 * Properties for the ProblemVisualizer component.
 */
interface ProblemVisualizerProps {
  /** The domain type of the problem instance. */
  problemType: string;
  /** The current state node containing the board data. */
  node: CustomTreeNode;
  /** Visual scale of the board rendering. */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether the user can interact with the board cells. */
  interactive?: boolean;
  /** Callback triggered when a tile is moved in 8-puzzle mode. */
  onEightPuzzleMove?: (tileIndex: number) => void;
}

/**
 * Helper component that renders the appropriate board visualization 
 * based on the current problem type (Tic-Tac-Toe or 8-Puzzle).
 * 
 * @param problemType - Type of problem ('tictactoe', '8puzzle').
 * @param node - The state node with board data.
 * @param size - Visual scale factor.
 */
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

/**
 * Properties for the NodeActionMenu component.
 */
interface NodeActionMenuProps {
  /** The node for which the menu is being displayed. */
  node: CustomTreeNode | null;
  /** Screen coordinates where the menu should appear. */
  position: { x: number; y: number };
  /** Callback to close the menu. */
  onClose: () => void;
  /** Context of the interaction: editing the node itself or its incoming edge. */
  mode?: 'node' | 'edge';
}

/**
 * Searches for a node by ID within a recursive tree structure.
 * @param root The root of the sub-tree to search.
 * @param id The target node ID.
 * @returns {CustomTreeNode | null} The found node or null.
 */
export const findNodeRecursive = (root: CustomTreeNode, id: string): CustomTreeNode | null => {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeRecursive(child, id);
    if (found) return found;
  }
  return null;
};

/**
 * Searches for the parent of a node with the given ID.
 * @param root The current root of exploration.
 * @param targetId The ID of the child node.
 * @returns {CustomTreeNode | null} The parent node or null if not found/root.
 */
export const findParentRecursive = (root: CustomTreeNode, targetId: string): CustomTreeNode | null => {
  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentRecursive(child, targetId);
    if (found) return found;
  }
  return null;
};

/**
 * Interactive context menu for managing node properties, adding children, and editing game states.
 * Adapts its features based on the active algorithm (Search, Minimax, MCTS).
 */
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
  const { t } = useTranslation();

  /** Ensures we always reference the most up-to-date node data from the global store. */
  const currentNode = useMemo(() => {
    if (!initialNode) return null;
    return findNodeRecursive(tree, initialNode.id) || initialNode;
  }, [tree, initialNode]);

  /** references the parent node to calculate metrics like UCB1. */
  const parentNode = useMemo(() => {
    if (!currentNode) return null;
    return findParentRecursive(tree, currentNode.id);
  }, [tree, currentNode]);

  /** Synchronizes local edit state with node data when selection changes. */
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
    if (mode === 'edge') updateNodeAttributes(currentNode.id, { costToParent: Number(editValue) });
    else updateNodeAttributes(currentNode.id, { value: Number(editValue) });
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
      if (window.confirm(t('editor.confirm_delete', { name: currentNode.name }))) {
        removeNode(currentNode.id);
        onClose();
      }
    } else {
      removeNode(currentNode.id);
      onClose();
    }
  };

  /** Calculation of node-specific MCTS metrics for UI debugging. */
  let mctsStats = null;
  if (isMCTS && currentNode) {
    const N = (parentNode as any)?.visits || 0;
    const n = (currentNode as any).visits || 0;
    const v = currentNode.value || 0;
    const C = searchSettings.mctsExploration;

    const explorationTerm = (n > 0 && N > 0) ? C * Math.sqrt(Math.log(N) / n) : 0;
    const ucbScore = v + explorationTerm;

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
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-background border rounded px-1 text-xs h-6"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button onClick={handleSaveName} className="text-primary"><Check size={14} /></button>
            </div>
          ) : (
            <span
              className="text-xs font-bold truncate cursor-pointer hover:text-primary"
              onClick={() => mode === 'node' && setIsEditingName(true)}
              title="Click to rename"
            >
              {mode === 'edge' ? `Cost to ${currentNode.name}` : currentNode.name}
            </span>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0"><X size={14} /></button>
        </div>

        {/* ALPHA-BETA SPECIFIC METRICS */}
        {algorithm === 'alpha-beta' && mode === 'node' && (
          <div className="p-2 bg-orange-500/5 rounded-md border border-orange-500/10 mb-1 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600">
              <Zap size={12} /> Alpha-Beta Metrics
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background p-1.5 rounded border flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Alpha (α)</span>
                <span className="font-mono font-bold text-blue-600">{currentNode.alpha === -Infinity ? '-∞' : currentNode.alpha}</span>
              </div>
              <div className="bg-background p-1.5 rounded border flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Beta (β)</span>
                <span className="font-mono font-bold text-red-600">{currentNode.beta === Infinity ? '∞' : currentNode.beta}</span>
              </div>
            </div>
          </div>
        )}

        {/* MCTS SPECIFIC METRICS */}
        {isMCTS && mctsStats && mode === 'node' && (
          <div className="p-2 bg-primary/5 rounded-md border border-primary/10 mb-1 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
              <Calculator size={12} /> MCTS Metrics
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background p-1.5 rounded border flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <Eye size={9} /> Visits (n)
                </span>
                <span className="font-mono font-bold">{mctsStats.n}</span>
              </div>
              <div className="bg-background p-1.5 rounded border flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <GitFork size={9} /> Children
                </span>
                <span className="font-mono font-bold">{currentNode.children.length}</span>
              </div>
              <div className="bg-background p-1.5 rounded border flex flex-col col-span-2">
                <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <Trophy size={9} /> UCB1 Score
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
                Parent Visits (N): <span className="font-mono font-bold">{mctsStats.N}</span>
              </div>
            )}
          </div>
        )}

        {isEditingBoard ? (
          <div className="p-2 flex flex-col items-center gap-3 bg-muted/30 rounded-md">
            <div className="flex justify-between w-full items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                {problemType === '8puzzle' ? t('editor.swap_tiles') : t('editor.change_cells')}
              </span>
              <button onClick={() => setIsEditingBoard(false)} className="text-xs text-primary hover:underline">{t('editor.finish')}</button>
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
            <label className="text-[10px] uppercase text-muted-foreground font-bold">{mode === 'edge' ? t('editor.edit_cost') : t('editor.edit_value')}</label>
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
                  <Plus size={16} className="text-primary" /> <span>{t('editor.add_child')}</span>
                </button>
                {isGameProblem && (
                  <button onClick={() => setIsEditingBoard(true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors">
                    <Grid3X3 size={16} className="text-primary" /> <span>{t('editor.edit_board')}</span>
                  </button>
                )}
                {problemType === 'custom' && !isAdversarial && (
                  <button onClick={toggleGoal} className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${currentNode.isGoal ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'hover:bg-accent'}`}>
                    <Target size={16} className={currentNode.isGoal ? "text-green-600" : "text-primary"} /> <span>{currentNode.isGoal ? t('editor.remove_goal') : t('editor.mark_goal')}</span>
                  </button>
                )}
              </>
            )}
            {(problemType === 'custom' || isAdversarial) && (
              <button onClick={() => setIsEditingValue(true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors">
                <Edit2 size={16} className="text-primary" /> <span>{mode === 'edge' ? t('editor.edit_cost') : t('editor.edit_value')}</span>
              </button>
            )}
            {!isRoot && mode === 'node' && (
              <button onClick={handleRemove} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-md transition-colors">
                <Trash2 size={16} /> <span>{t('editor.delete_node')}</span>
              </button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// --- MAIN TREE GRAPH COMPONENT ---

/**
 * Properties for the TreeGraph component.
 */
interface TreeGraphProps {
  /** Recursive data structure representing the search tree. */
  data: CustomTreeNode & { isCurrent?: boolean };
  /** Width of the component container. */
  width: number;
  /** Height of the component container. */
  height: number;
  /** Optional trigger to reset zoom and center the tree. */
  zoomResetTrigger?: number;
}

/**
 * Component for hierarchical tree visualization.
 * Uses Visx for SVG management and D3 for hierarchical layout calculation.
 */
export default function TreeGraph({ data, width, height, zoomResetTrigger }: TreeGraphProps) {
  const { algorithm, maxNodeShape, minNodeShape, admissibilityViolations, nodeViewMode, problemType, updateNodeAttributes, followActiveNode } = useGameStore();
  const { t } = useTranslation();

  const [selectedNode, setSelectedNode] = useState<CustomTreeNode | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuMode, setMenuMode] = useState<'node' | 'edge'>('node');
  const zoomRef = useRef<any>(null);

  const isGameMode = nodeViewMode === 'game' && problemType !== 'custom';
  const minNodeWidth = problemType === 'tictactoe' ? 160 : 120;
  const minNodeHeight = problemType === 'tictactoe' ? 200 : 160;

  /**
   * manual layout calculation using D3 Tree to access precise coordinates (x, y) 
   * for centering and camera-following logic.
   */
  const { layoutRoot, treeWidth, treeHeight } = useMemo(() => {
    const h = hierarchy(data);
    const tw = Math.max(h.leaves().length * minNodeWidth, minNodeWidth);
    const th = Math.max(h.height * minNodeHeight, minNodeHeight);
    const treeLayout = d3.tree<CustomTreeNode>()
      .size([tw, th])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));
    return { layoutRoot: treeLayout(h), treeWidth: tw, treeHeight: th };
  }, [data, minNodeWidth, minNodeHeight]);

  /**
   * Effect to center the tree when the data structure or container dimensions change.
   */
  useEffect(() => {
    if (zoomRef.current && width > 0 && height > 0) {
      const rootX = treeWidth / 2;
      // Exact displacement calculation to align tree center with viewport center.
      // Compensates for the 50px offset in the SVG Group.
      const tx = (width / 2) - (rootX + 50);
      const ty = (height / 2) - (treeHeight / 2 + 50);

      zoomRef.current.setTransformMatrix({
        scaleX: 1,
        scaleY: 1,
        translateX: tx,
        translateY: ty,
        skewX: 0,
        skewY: 0,
      });
    }
  }, [zoomResetTrigger, width, height, treeWidth, treeHeight]);

  /** 
   * Effect to automatically move the camera to center the currently active node 
   * during algorithm simulation.
   */
  useEffect(() => {
    if (followActiveNode && zoomRef.current && width > 0 && height > 0) {
      const activeNode = layoutRoot.descendants().find(d => {
        const nodeData = d.data as any;
        return nodeData.isCurrent;
      });

      if (activeNode) {
        const currentMatrix = zoomRef.current.transformMatrix;
        const scale = currentMatrix.scaleX;

        const tx = (width / 2) - (activeNode.x + 50) * scale;
        const ty = (height / 2) - (activeNode.y + 50) * scale;

        zoomRef.current.setTransformMatrix({
          scaleX: scale,
          scaleY: scale,
          translateX: tx,
          translateY: ty,
          skewX: 0,
          skewY: 0,
        });
      }
    }
  }, [layoutRoot, followActiveNode, width, height]);

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

  /**
   * Handles board interactions specifically for the 8-puzzle problem.
   * Validates move legality before updating state.
   */
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
        alert(t('editor.invalid_move'));
        return;
      }
    }
    updateNodeAttributes(currentNode.id, { boardState: newBoard });
  };

  const showHeuristic = algorithm && !['bfs', 'dfs', 'ids', 'ucs', 'minimax', 'alpha-beta'].includes(algorithm);
  const showAlphaBeta = algorithm === 'minimax' || algorithm === 'alpha-beta';
  const isMCTS = algorithm === 'mcts';

  /** 
   * Detects if a node represents a repeated state in the current path.
   * Used to highlight cycles in search.
   */
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
              isCurrent ? "border-purple-600 bg-purple-100 dark:bg-purple-900/40 ring-4 ring-purple-500/30" :
                isGoal ? "border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/20" :
                  isSelected ? "border-orange-500 bg-orange-500/5 shadow-orange-500/20" :
                    "border-border/60 bg-slate-50/50 dark:bg-slate-900/50",
              isPruned && "grayscale border-dashed",
              isRepeated && "border-yellow-500/50 bg-yellow-500/5"
            )}>
              <ProblemVisualizer problemType={problemType} node={nodeData} size="xs" interactive={problemType === '8puzzle'} onEightPuzzleMove={(idx) => handle8PuzzleMove(node, idx)} />
            </div>
          </foreignObject>
          {isPruned && (
            <motion.text
              y={10}
              textAnchor="middle"
              fontSize={40}
              fill="red"
              fontWeight="bold"
              className="pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              ✕
            </motion.text>
          )}
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

    if (shape === 'triangle') return (
      <Group>
        <motion.polygon points="-30,20 30,20 0,-32" {...commonProps} />
        {isPruned && (
          <motion.text y={10} textAnchor="middle" fontSize={40} fill="#ef4444" fontWeight="bold" className="pointer-events-none" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>✕</motion.text>
        )}
      </Group>
    );

    if (shape === 'square') return (
      <Group>
        <motion.rect x={-26} y={-26} width={52} height={52} rx={4} {...commonProps} />
        {isPruned && (
          <motion.text y={10} textAnchor="middle" fontSize={40} fill="#ef4444" fontWeight="bold" className="pointer-events-none" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>✕</motion.text>
        )}
      </Group>
    );

    return (
      <Group>
        <motion.circle r={28} {...commonProps} />
        {isPruned && (
          <motion.text y={10} textAnchor="middle" fontSize={40} fill="#ef4444" fontWeight="bold" className="pointer-events-none" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>✕</motion.text>
        )}
      </Group>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background rounded-xl border-2 border-border shadow-inner transition-colors duration-300">
      <Zoom width={width} height={height} scaleXMin={1 / 4} scaleXMax={4} scaleYMin={1 / 4} scaleYMax={4}>
        {(zoom) => (
          <div className="relative w-full h-full overflow-hidden touch-none" ref={(node) => {
            if (zoom.containerRef) (zoom.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            zoomRef.current = zoom;
          }}>
            <svg width={width} height={height} className={cn("w-full h-full", zoom.isDragging ? "cursor-grabbing" : "cursor-grab")} onClick={() => setSelectedNode(null)}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted/10" /></pattern>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="2" /><feOffset dx="1" dy="1" result="offsetblur" /><feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <rect width={width} height={height} fill="url(#grid)" />
              <Group transform={zoom.toString()}>
                <Group top={50} left={50}>
                  {layoutRoot.links().map((link) => {
                    const targetData = link.target.data as CustomTreeNode;
                    const sourceData = link.source.data as CustomTreeNode;
                    const cost = targetData.costToParent;
                    const isPruned = targetData.isPruned;
                    return (
                      <Group key={`link-${sourceData.id}-${targetData.id}`} opacity={isPruned ? 0.3 : 1}>
                        <LinkVertical data={link} stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray={isPruned ? "5,5" : "none"} className="text-muted-foreground/30" />
                        {/* Pruning Visualization (Red Crosshairs) */}
                        {isPruned && (
                          <Group top={(link.source.y + link.target.y) / 2} left={(link.source.x + link.target.x) / 2}>
                            <motion.g
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            >
                              <line x1={-8} y1={-8} x2={8} y2={8} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                              <line x1={-8} y1={8} x2={8} y2={-8} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                            </motion.g>
                          </Group>
                        )}
                        {cost !== undefined && (
                          <Group className="cursor-pointer" onClick={(e) => handleEdgeClick(e, targetData)}>
                            <rect x={(link.source.x + link.target.x) / 2 - 14} y={(link.source.y + link.target.y) / 2 - 14} width={28} height={28} rx={14} fill="currentColor" className="text-muted hover:text-accent transition-colors border border-border" />
                            <text x={(link.source.x + link.target.x) / 2} y={(link.source.y + link.target.y) / 2} dy=".33em" fontSize={11} fontWeight="bold" textAnchor="middle" fill="currentColor" className="text-muted-foreground select-none pointer-events-none">{cost}</text>
                          </Group>
                        )}
                      </Group>
                    );
                  })}
                  {layoutRoot.descendants().map((node) => {
                    const nodeData = node.data as CustomTreeNode & { isCurrent?: boolean };
                    const isSelected = selectedNode?.id === nodeData.id && menuMode === 'node';
                    const isVisited = nodeData.isVisited, isGoal = nodeData.isGoal, isCurrent = nodeData.isCurrent, isPruned = nodeData.isPruned, isRepeated = isRepeatedNode(node);
                    return (
                      <Group key={nodeData.id} top={node.y} left={node.x} onClick={(e) => handleNodeClick(e, nodeData)} className="cursor-pointer" filter={isPruned ? undefined : "url(#shadow)"}>
                        {isGoal && !isPruned && <motion.circle r={36} fill="none" stroke="#22c55e" strokeWidth={3} strokeDasharray="4 4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, rotate: 360 }} transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, default: { duration: 0.3 } }} />}

                        {isCurrent && (
                          isGameMode ? (
                            <motion.rect
                              x={-(problemType === 'tictactoe' ? 120 : 100) / 2 - 4}
                              y={-(problemType === 'tictactoe' ? 120 : 100) / 2 - 4}
                              width={(problemType === 'tictactoe' ? 120 : 100) + 8}
                              height={(problemType === 'tictactoe' ? 120 : 100) + 8}
                              rx={12}
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth={4}
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          ) : (
                            <motion.circle
                              r={34}
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth={4}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )
                        )}

                        {renderNodeShape(node, !!isSelected, !!isVisited, !!isGoal, !!isCurrent, !!isPruned, isRepeated)}

                        {/* Node Label */}
                        <text
                          dy={isGameMode ? (problemType === 'tictactoe' ? -75 : -65) : ".33em"}
                          fontSize={isGameMode ? 10 : 11}
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="currentColor"
                          className={cn(
                            "pointer-events-none",
                            isGameMode ? "text-muted-foreground" : (isCurrent || isGoal || admissibilityViolations.includes(nodeData.id) ? "text-white" : "text-foreground"),
                            isPruned && "opacity-30"
                          )}
                        >
                          {nodeData.name}
                        </text>

                        {/* Value/Heuristic Visualization */}
                        {((showHeuristic && !isMCTS) || showAlphaBeta) && nodeData.value !== undefined && !isPruned && (
                          <Group top={nodeViewMode === 'game' ? 85 : 45} left={0}>
                            <rect x={-25} y={-12} width={50} height={24} rx={12} fill="currentColor" className="text-slate-800 shadow-xl" />
                            <text dy=".33em" fontSize={12} fontWeight="900" textAnchor="middle" fill="currentColor" className="text-white">
                              v:{nodeData.value === Infinity ? '∞' : nodeData.value === -Infinity ? '-∞' : nodeData.value}
                            </text>
                          </Group>
                        )}

                        {/* Alpha-Beta Visualization (Floating above node) */}
                        {algorithm === 'alpha-beta' && !isPruned && (nodeData.alpha !== undefined || nodeData.beta !== undefined) && (
                          <Group top={nodeViewMode === 'game' ? -120 : -80} left={0}>
                            <motion.g
                              initial={false}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 0.3 }}
                            >
                              <rect x={-65} y={-18} width={130} height={36} rx={8} fill="currentColor" className="text-slate-900 border-2 border-primary shadow-2xl" />
                              <text dy=".33em" fontSize={15} fontWeight="900" textAnchor="middle" fill="currentColor" className="text-white">
                                α:{nodeData.alpha === -Infinity || nodeData.alpha === null ? '-∞' : nodeData.alpha} β:{nodeData.beta === Infinity || nodeData.beta === null ? '∞' : nodeData.beta}
                              </text>
                            </motion.g>
                          </Group>
                        )}
                      </Group>
                    );
                  })}
                </Group>
              </Group>
            </svg>
          </div>
        )}
      </Zoom>
      <NodeActionMenu node={selectedNode} position={menuPos} mode={menuMode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
