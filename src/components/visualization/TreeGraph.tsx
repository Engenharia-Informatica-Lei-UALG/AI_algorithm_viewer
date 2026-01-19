"use client"

import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { Tree, hierarchy } from '@visx/hierarchy';
import { LinkVertical } from '@visx/shape';
import { Zoom } from '@visx/zoom';
import { motion } from 'framer-motion';
import { CustomTreeNode, useGameStore, NodeShape } from '@/store/gameStore';
import { NodeActionMenu } from './NodeActionMenu';
import { cn } from '@/lib/utils';
import { ProblemVisualizer } from './ProblemVisualizer';

interface TreeGraphProps {
  data: CustomTreeNode & { isCurrent?: boolean };
  width: number;
  height: number;
}

export default function TreeGraph({ data, width, height }: TreeGraphProps) {
  const {
    algorithm,
    maxNodeShape,
    minNodeShape,
    admissibilityViolations,
    nodeViewMode,
    problemType,
    updateNodeAttributes
  } = useGameStore();

  const [selectedNode, setSelectedNode] = useState<CustomTreeNode | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuMode, setMenuMode] = useState<'node' | 'edge'>('node');

  const root = useMemo(() => hierarchy(data), [data]);

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
      const diffCount = parentBoard.reduce((acc: number, val: number, idx: number) => {
        return acc + (val !== newBoard[idx] ? 1 : 0);
      }, 0);

      if (diffCount !== 2) {
        alert("Movimento Inválido! O estado do filho deve ser alcançável com apenas 1 movimento a partir do estado do pai.");
        return;
      }
    }

    updateNodeAttributes(currentNode.id, { boardState: newBoard });
  };

  const isGameMode = nodeViewMode === 'game' && problemType !== 'custom';

  // Cálculo robusto de espaçamento: a árvore cresce conforme a complexidade
  const minNodeWidth = problemType === 'tictactoe' ? 160 : 120;
  const minNodeHeight = problemType === 'tictactoe' ? 200 : 160;

  const treeWidth = Math.max(width - 100, root.leaves().length * minNodeWidth);
  const treeHeight = Math.max(height - 150, root.height * minNodeHeight);

  const showHeuristic = algorithm && !['bfs', 'dfs', 'ids', 'ucs'].includes(algorithm);

  const renderNodeShape = (node: any, isSelected: boolean, isVisited: boolean, isGoal: boolean, isCurrent: boolean) => {
    const nodeData = node.data as CustomTreeNode;
    const isViolation = admissibilityViolations.includes(nodeData.id);

    if (isGameMode) {
      const boardSize = problemType === 'tictactoe' ? 120 : 100;
      return (
        <Group>
          <foreignObject x={-boardSize / 2} y={-boardSize / 2} width={boardSize} height={boardSize}>
            <div className={cn(
              "w-full h-full flex items-center justify-center rounded-xl border-2 transition-all duration-300 shadow-md p-1",
              isCurrent ? "border-purple-500 bg-purple-500/5 ring-4 ring-purple-500/20" :
                isGoal ? "border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/20" :
                  isSelected ? "border-orange-500 bg-orange-500/5 shadow-orange-500/20" :
                    "border-border/60 bg-slate-50/50 dark:bg-slate-900/50"
            )}>
              <ProblemVisualizer
                problemType={problemType}
                node={nodeData}
                size="xs"
                interactive={problemType === '8puzzle'}
                onEightPuzzleMove={(idx) => handle8PuzzleMove(node, idx)}
              />
            </div>
          </foreignObject>
        </Group>
      );
    }

    let shape: NodeShape = 'circle';
    if (algorithm === 'minimax' || algorithm === 'alpha-beta') {
      shape = node.depth % 2 === 0 ? maxNodeShape : minNodeShape;
    }

    const commonProps = {
      initial: { scale: 0 },
      animate: {
        scale: 1,
        scaleX: isCurrent ? [1, 1.05, 1] : 1,
        scaleY: isCurrent ? [1, 1.05, 1] : 1
      },
      transition: {
        duration: 0.3,
        scaleX: { duration: 1.5, repeat: Infinity },
        scaleY: { duration: 1.5, repeat: Infinity }
      },
      whileHover: { scale: 1.1 },
      className: cn(
        "cursor-pointer transition-colors duration-300",
        isViolation ? "text-destructive stroke-destructive-foreground" :
          isCurrent ? "text-purple-600 stroke-purple-900" :
            isGoal ? "text-green-500 stroke-green-700" :
              isVisited ? "text-primary/60" :
                isSelected ? "text-card stroke-orange-500" : "text-card stroke-foreground"
      ),
      strokeWidth: isSelected || isCurrent || isViolation ? 6 : (isGoal ? 5 : 3),
      fill: "currentColor",
      stroke: "currentColor"
    };

    if (shape === 'triangle') {
      const points = "-30,20 30,20 0,-32";
      return <motion.polygon points={points} {...commonProps} />;
    }

    if (shape === 'square') {
      return <motion.rect x={-26} y={-26} width={52} height={52} rx={4} {...commonProps} />;
    }

    return <motion.circle r={28} {...commonProps} />;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background rounded-xl border-2 border-border shadow-inner transition-colors duration-300">
      <Zoom width={width} height={height} scaleXMin={1 / 4} scaleXMax={4} scaleYMin={1 / 4} scaleYMax={4}>
        {(zoom) => (
          <div
            className="relative w-full h-full overflow-hidden"
            ref={zoom.containerRef as any}
            style={{ touchAction: 'none' }}
          >
            <svg
              width={width}
              height={height}
              className={cn(
                "w-full h-full",
                zoom.isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
              onClick={() => setSelectedNode(null)}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted/10" />
                </pattern>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                  <feOffset dx="1" dy="1" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width={width} height={height} fill="url(#grid)" />

              <Group transform={zoom.toString()}>
                <Tree
                  root={root}
                  size={[treeWidth, treeHeight]}
                  separation={(a, b) => (a.parent === b.parent ? 1 : 1.5)}
                >
                  {tree => (
                    <Group top={50} left={50}>
                      {tree.links().map((link, i) => {
                        const targetData = link.target.data as CustomTreeNode;
                        const cost = targetData.costToParent;

                        return (
                          <Group key={`link-group-${i}`}>
                            <LinkVertical
                              data={link}
                              stroke="currentColor"
                              strokeWidth="2.5"
                              fill="none"
                              className="text-muted-foreground/30"
                            />
                            {cost !== undefined && (
                              <Group
                                className="cursor-pointer"
                                onClick={(e) => handleEdgeClick(e, targetData)}
                              >
                                <rect
                                  x={(link.source.x + link.target.x) / 2 - 14}
                                  y={(link.source.y + link.target.y) / 2 - 14}
                                  width={28}
                                  height={28}
                                  rx={14}
                                  fill="currentColor"
                                  className="text-muted hover:text-accent transition-colors border border-border"
                                />
                                <text
                                  x={(link.source.x + link.target.x) / 2}
                                  y={(link.source.y + link.target.y) / 2}
                                  dy=".33em"
                                  fontSize={11}
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fill="currentColor"
                                  className="text-muted-foreground select-none pointer-events-none"
                                >
                                  {cost}
                                </text>
                              </Group>
                            )}
                          </Group>
                        );
                      })}

                      {tree.descendants().map((node, i) => {
                        const nodeData = node.data as CustomTreeNode & { isCurrent?: boolean };
                        const isSelected = selectedNode?.id === nodeData.id && menuMode === 'node';
                        const isVisited = nodeData.isVisited;
                        const isGoal = nodeData.isGoal;
                        const isCurrent = nodeData.isCurrent;
                        const isViolation = admissibilityViolations.includes(nodeData.id);

                        return (
                          <Group
                            key={`node-${i}`}
                            top={node.y}
                            left={node.x}
                            onClick={(e) => handleNodeClick(e, nodeData)}
                            className="cursor-pointer"
                            filter="url(#shadow)"
                          >
                            {isGoal && (
                              <motion.circle
                                r={36}
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth={3}
                                strokeDasharray="4 4"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                                transition={{
                                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                                  default: { duration: 0.3 }
                                }}
                              />
                            )}

                            {isCurrent && (
                              <motion.circle
                                r={34}
                                fill="none"
                                stroke="#a855f7"
                                strokeWidth={4}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}

                            {renderNodeShape(node, !!isSelected, !!isVisited, !!isGoal, !!isCurrent)}

                            {showHeuristic && nodeData.value !== undefined && (
                              <Group y={nodeViewMode === 'game' ? 85 : 40} x={0}>
                                <rect x={-18} y={-12} width={36} height={20} rx={10} fill="currentColor" className="text-foreground" />
                                <text
                                  dy=".33em"
                                  fontSize={10}
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  fill="currentColor"
                                  className="text-background"
                                >
                                  {nodeViewMode === 'game' ? 'v' : 'h'}:{nodeData.value}
                                </text>
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

      <NodeActionMenu
        node={selectedNode}
        position={menuPos}
        mode={menuMode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
