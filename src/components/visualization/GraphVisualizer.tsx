"use client"

import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useGameStore } from '@/store/gameStore';
import { CustomTreeNode } from '@/types/game';
import { Zoom } from '@visx/zoom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { NodeActionMenu, findNodeRecursive } from './TreeGraph';

interface GraphVisualizerProps {
  data: CustomTreeNode;
  width: number;
  height: number;
  zoomResetTrigger?: number;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  originalIds: string[];
  name: string;
  value?: number;
  isGoal?: boolean;
  isStart?: boolean;
  isCurrent?: boolean;
  isVisited?: boolean;
  isViolation?: boolean; // Adicionado para controle visual
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  cost?: number;
}

function GraphVisualizer({ data, width, height, zoomResetTrigger }: GraphVisualizerProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const { admissibilityViolations, followActiveNode } = useGameStore();
  
  const [selectedNode, setSelectedNode] = useState<CustomTreeNode | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuMode, setMenuMode] = useState<'node' | 'edge'>('node');
  const zoomRef = useRef<any>(null);

  useEffect(() => {
    if (zoomRef.current) {
      zoomRef.current.reset();
    }
    // Adicionamos width/height para garantir que resete se a janela mudar drasticamente
  }, [zoomResetTrigger, width, height]);

  const { nodes, links } = useMemo(() => {
    const uniqueNodes = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    const traverse = (node: CustomTreeNode, parentName: string | null) => {
      if (!uniqueNodes.has(node.name)) {
        uniqueNodes.set(node.name, {
          id: node.name,
          name: node.name,
          originalIds: [node.id],
          value: node.value,
          isCurrent: node.isCurrent,
          isGoal: node.isGoal,
          isStart: parentName === null,
          x: width / 2 + (Math.random() - 0.5) * 50,
          y: height / 2 + (Math.random() - 0.5) * 50,
        });
      } else {
        const existing = uniqueNodes.get(node.name)!;
        existing.originalIds.push(node.id);
        if (node.isCurrent) existing.isCurrent = true;
        if (node.isGoal) existing.isGoal = true;
      }

      if (parentName) {
        const linkExists = links.some(l =>
          (l.source as string) === parentName &&
          (l.target as string) === node.name &&
          l.cost === node.costToParent
        );

        if (!linkExists) {
          links.push({
            source: parentName,
            target: node.name,
            cost: node.costToParent
          });
        }
      }

      node.children?.forEach(child => traverse(child, node.name));
    };

    traverse(data, null);

    const nodesArray = Array.from(uniqueNodes.values()).map(n => {
      return n;
    });

    return { nodes: nodesArray, links };
  }, [data]); // width/height removidos para estabilidade

  // Lógica para seguir o nó ativo no Grafo
  useEffect(() => {
    if (followActiveNode && zoomRef.current && width > 0 && height > 0) {
      const activeNode = nodes.find(n => n.isCurrent);
      if (activeNode && activeNode.x !== undefined && activeNode.y !== undefined) {
        zoomRef.current.translateTo({ x: activeNode.x, y: activeNode.y });
      }
    }
  }, [nodes, followActiveNode, width, height]);

  // Atualiza estado visual (violações) sem reiniciar física
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Atualiza a propriedade isViolation nos dados dos nós
    nodes.forEach(n => {
      n.isViolation = n.originalIds.some(id => admissibilityViolations.includes(id));
    });

    // Atualiza visualmente os nós existentes
    svg.selectAll<SVGGElement, GraphNode>(".nodes g circle")
      .attr("stroke", d => d.isViolation ? "#ef4444" : (d.isCurrent ? "#a855f7" : (d.isGoal ? "#15803d" : (d.isStart ? "#1d4ed8" : "currentColor"))))
      .attr("stroke-width", d => d.isViolation ? 4 : 3)
      .attr("fill", d => d.isViolation ? "#fee2e2" : (d.isCurrent ? "#f3e8ff" : (d.isGoal ? "#22c55e" : (d.isStart ? "#3b82f6" : "hsl(var(--card))"))));

    // Reinicia levemente a simulação para garantir que o loop 'ticked' pegue as mudanças de cor
    if (simulationRef.current) {
      simulationRef.current.alpha(0.1).restart();
    }

  }, [admissibilityViolations, nodes]);

  // Inicializa ou Atualiza a Simulação (Estrutura)
  useEffect(() => {
    if (!svgRef.current) return;

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<GraphNode>(nodes)
        .force("link", d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-1000))
        .force("collide", d3.forceCollide(65).strength(1.0).iterations(2));
    } else {
      simulationRef.current.nodes(nodes);
      (simulationRef.current.force("link") as d3.ForceLink<GraphNode, GraphLink>).links(links);

      // Só reinicia alpha se a estrutura mudou significativamente (opcional)
      // Para evitar pulos, podemos usar um alpha menor ou nem reiniciar se nodes.length for igual
      simulationRef.current.alpha(0.1).restart();
    }

    simulationRef.current.force("center", d3.forceCenter(width / 2, height / 2).strength(0.05));
    simulationRef.current.force("y", d3.forceY<GraphNode>((d) => {
      if (d.isStart) return height * 0.1;
      if (d.isGoal) return height * 0.9;
      return height / 2;
    }).strength((d) => {
      if (d.isStart || d.isGoal) return 0.15;
      return 0.05;
    }));

    const simulation = simulationRef.current;

    const ticked = () => {
      const svg = d3.select(svgRef.current);

      const linkSelection = svg.select(".links")
        .selectAll<SVGLineElement, GraphLink>("line")
        .data(links);

      linkSelection.enter()
        .append("line")
        .merge(linkSelection)
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!)
        .attr("stroke", "#999")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrowhead)");

      linkSelection.exit().remove();

      const labelGroup = svg.select(".labels")
        .selectAll<SVGGElement, GraphLink>("g")
        .data(links, d => `${(d.source as any).id}-${(d.target as any).id}`);

      const labelEnter = labelGroup.enter().append("g")
        .attr("class", "cursor-pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          const treeNode = findNodeRecursive(data, (d.target as GraphNode).originalIds[0]);
          if (treeNode) {
            setMenuPos({ x: event.clientX, y: event.clientY });
            setMenuMode('edge');
            setSelectedNode(treeNode);
          }
        });

      labelEnter.append("rect")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", "var(--background)")
        .attr("stroke", "var(--border)")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8);

      labelEnter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("fill", "currentColor")
        .attr("font-size", 11)
        .attr("font-weight", "bold")
        .text(d => d.cost ?? "");

      const labelUpdate = labelGroup.merge(labelEnter);

      labelUpdate.attr("transform", d => {
        const x = ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2;
        const y = ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2;
        return `translate(${x},${y})`;
      });

      labelUpdate.select("rect")
        .attr("x", function () {
          const parent = (this as unknown as SVGElement).parentNode as SVGElement;
          const text = parent?.querySelector("text") as SVGGraphicsElement;
          const textWidth = text?.getBBox()?.width ?? 0;
          return -textWidth / 2 - 4;
        })
        .attr("y", -10)
        .attr("width", function () {
          const parent = (this as unknown as SVGElement).parentNode as SVGElement;
          const text = parent?.querySelector("text") as SVGGraphicsElement;
          const textWidth = text?.getBBox()?.width ?? 0;
          return textWidth + 8;
        })
        .attr("height", 20);

      labelGroup.exit().remove();

      const nodeSelection = svg.select(".nodes")
        .selectAll<SVGGElement, GraphNode>("g")
        .data(nodes);

      const nodeEnter = nodeSelection.enter()
        .append("g")
        .attr("class", "cursor-pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          const treeNode = findNodeRecursive(data, d.originalIds[0]);
          if (treeNode) {
            setMenuPos({ x: event.clientX, y: event.clientY });
            setMenuMode('node');
            setSelectedNode(treeNode);
          }
        })
        .call(d3.drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.sourceEvent.stopPropagation();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
        );

      // Círculo base
      nodeEnter.append("circle")
        .attr("r", 25)
        .attr("stroke-width", 3);

      nodeSelection.merge(nodeEnter).select("circle")
        .attr("fill", d => d.isViolation ? "#fee2e2" : (d.isCurrent ? "#f3e8ff" : (d.isGoal ? "#22c55e" : (d.isStart ? "#3b82f6" : "hsl(var(--card))"))))
        .attr("stroke", d => d.isViolation ? "#ef4444" : (d.isCurrent ? "#a855f7" : (d.isGoal ? "#15803d" : (d.isStart ? "#1d4ed8" : "currentColor"))))
        .attr("stroke-width", d => d.isViolation ? 4 : 3);

      nodeEnter.append("text")
        .attr("dy", 6)
        .attr("text-anchor", "middle")
        .attr("fill", d => d.isGoal || d.isStart ? "white" : "currentColor")
        .attr("font-weight", "bold")
        .attr("font-size", 14)
        .text(d => d.name);

      nodeEnter.append("text")
        .attr("dy", 40)
        .attr("text-anchor", "middle")
        .attr("fill", "gray")
        .attr("font-size", 11)
        .text(d => d.value ? `h:${d.value}` : "");

      nodeSelection.merge(nodeEnter)
        .attr("transform", d => `translate(${d.x},${d.y})`);

      nodeSelection.exit().remove();
    };

    simulation.on("tick", ticked);

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [nodes, links, width, height]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-background rounded-xl border-2 border-border shadow-inner">
      <Zoom width={width} height={height}>
        {(zoom) => (
          <div
            className="relative w-full h-full overflow-hidden"
            ref={(node) => { 
              if (zoom.containerRef) (zoom.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              zoomRef.current = zoom; 
            }}
            style={{ touchAction: 'none' }}
          >
            <svg
              ref={svgRef}
              width={width}
              height={height}
              className={cn(
                "w-full h-full",
                zoom.isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
              onClick={() => setSelectedNode(null)}
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="34" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
                </marker>
                <pattern id="grid-graph" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted/10" />
                </pattern>
              </defs>
              <rect width={width} height={height} fill="url(#grid-graph)" />

              <g transform={zoom.toString()}>
                <g className="links"></g>
                <g className="labels"></g>
                <g className="nodes"></g>
              </g>
            </svg>
          </div>
        )}
      </Zoom>

      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur p-2 rounded border text-xs text-muted-foreground">
        {t('graph_mode')}
      </div>
      <NodeActionMenu node={selectedNode} position={menuPos} mode={menuMode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}

export default React.memo(GraphVisualizer);
