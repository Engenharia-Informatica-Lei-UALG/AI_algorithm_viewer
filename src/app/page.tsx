"use client"

import { useGameStore } from "@/store/gameStore"
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo } from "react"
import { useSimulation } from "@/hooks/useSimulation"
import { VisualizationPanel } from "@/components/layout/VisualizationPanel"
import { EditorPanel } from "@/components/layout/EditorPanel"
import { Instagram, Github, BookOpen } from "lucide-react"
import Link from 'next/link'

export default function Home() {
  const { t, i18n } = useTranslation();
  const { tree } = useGameStore()
  const [mounted, setMounted] = useState(false);

  const { visitedNodes, currentNodeId, stepForward, stepBack, fastForward } = useSimulation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize visxData to prevent unnecessary re-renders of the graph
  const visxData = useMemo(() =>
    convertToVisx(tree, visitedNodes, currentNodeId),
    [tree, visitedNodes, currentNodeId]
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
          onStep={stepForward}
          onStepBack={stepBack}
          onFastForward={fastForward}
        />
        <div className="xl:col-span-3 flex flex-col h-full overflow-hidden gap-4">
          <div className="flex-1 min-h-0">
            <EditorPanel />
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-4 border-t flex justify-between items-center text-muted-foreground shrink-0">
        <p className="text-xs font-medium">© 2026 Algorithm AI Labs</p>
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
            href="/docs/json"
            className="hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-bold border-l pl-4"
          >
            <BookOpen size={16} />
            Documentação JSON
          </Link>
        </div>
      </footer>
    </div>
  );
}

function convertToVisx(node: any, visitedSet: Set<string>, currentNodeId: string | null): any {
  return {
    id: node.id,
    name: node.name,
    value: node.value,
    isGoal: node.isGoal,
    isCurrent: node.id === currentNodeId,
    costToParent: node.costToParent,
    isVisited: visitedSet.has(node.id),
    boardState: node.boardState,
    children: node.children ? node.children.map((c: any) => convertToVisx(c, visitedSet, currentNodeId)) : []
  };
}
