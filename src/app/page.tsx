"use client"

import { useGameStore } from "@/store/gameStore"
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo } from "react"
import { useSimulation } from "@/hooks/useSimulation"
import { VisualizationPanel } from "@/components/layout/VisualizationPanel"
import { EditorPanel } from "@/components/layout/EditorPanel"
import { Instagram, Github, BookOpen } from "lucide-react"
import Link from 'next/link'

/**
 * Main entry point for the AI Algorithm Viewer application.
 * Renders the dashboard layout including the visualization panel and editor panels.
 */
export default function Home() {
  const { t, i18n } = useTranslation();
  const { tree, problemType, algorithm } = useGameStore()
  const [mounted, setMounted] = useState(false);

  const { visitedNodes, currentNodeId, stepForward, stepBack, fastForward } = useSimulation();

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Memoizes the tree data formatted for Visx to prevent unnecessary 
   * re-renders of the expensive SVG graph component.
   */
  const visxData = useMemo(() =>
    convertToVisx(tree, visitedNodes, currentNodeId, problemType, algorithm),
    [tree, visitedNodes, currentNodeId, problemType, algorithm]
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans flex flex-col h-screen overflow-hidden">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => i18n.changeLanguage('pt')} className={`px-3 py-1 text-xs font-bold rounded border ${i18n.language === 'pt' ? 'bg-primary text-primary-foreground' : ''}`}>PT</button>
          <button onClick={() => i18n.changeLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded border ${i18n.language === 'en' ? 'bg-primary text-primary-foreground' : ''}`}>EN</button>
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 pb-4 overflow-y-auto">
        <VisualizationPanel
          visxData={visxData}
          onStepAction={stepForward}
          onStepBackAction={stepBack}
          onFastForwardAction={fastForward}
        />
        <div className="xl:col-span-3 flex flex-col h-full overflow-hidden gap-4">
          <div className="flex-1 min-h-0">
            <EditorPanel />
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-4 border-t flex justify-between items-center text-muted-foreground shrink-0">
        <p className="text-xs font-medium">{t('footer_text')}</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/kanekitakitos"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Github size={16} />
            GitHub
          </a>
          <a
            href="https://www.instagram.com/brandonmejia4/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Instagram size={16} />
            Instagram
          </a>
          <Link
            href="/docs"
            className="hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-bold border-l pl-4"
          >
            <BookOpen size={16} />
            {t('docs_link')}
          </Link>
        </div>
      </footer>
    </div>
  );
}

/**
 * Transforms the internal tree structure into a format suitable for @visx/hierarchy.
 * Handles state-to-key mapping for cycle detection and node highlighting.
 * 
 * @param node - The current node in the recursive structure.
 * @param visitedSet - Set of state keys that have been visited by the algorithm.
 * @param currentNodeId - The unique key of the node currently under exploration.
 * @param problemType - Domain type (Tic-Tac-Toe, 8-Puzzle, etc.).
 * @param algorithm - The active search algorithm.
 */
function convertToVisx(node: any, visitedSet: Set<string>, currentNodeId: string | null, problemType: string, algorithm: string | null): any {
  // For algorithms that build unique search trees (Minimax, MCTS, Alpha-Beta),
  // the node's unique ID is the identifying key, as the same state can recur in different branches.
  const isTreeAlgo = algorithm === 'minimax' || algorithm === 'alpha-beta' || algorithm === 'mcts';

  let stateKey = node.id;

  if (!isTreeAlgo) {
    if (problemType === 'tictactoe' && node.boardState) {
      stateKey = node.boardState.map((c: any) => c || '-').join('');
    } else if (problemType === '8puzzle' && node.boardState) {
      stateKey = node.boardState.join(',');
    }
  }

  return {
    id: node.id,
    name: node.name,
    value: node.value,
    isGoal: node.isGoal,
    isCurrent: stateKey === currentNodeId,
    costToParent: node.costToParent,
    isVisited: visitedSet.has(stateKey),
    boardState: node.boardState,
    alpha: node.alpha,
    beta: node.beta,
    isPruned: node.isPruned,
    children: node.children ? node.children.map((c: any) => convertToVisx(c, visitedSet, currentNodeId, problemType, algorithm)) : []
  };
}
