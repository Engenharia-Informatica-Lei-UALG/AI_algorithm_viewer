"use client"

import { useGameStore } from "@/store/gameStore"
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from "react"
import { useSimulation } from "@/hooks/useSimulation"
import { VisualizationPanel } from "@/components/dashboard/VisualizationPanel"
import { EditorPanel } from "@/components/dashboard/EditorPanel"
import { Instagram, Github } from "lucide-react"

export default function Home() {
  const { t, i18n } = useTranslation();
  const { tree } = useGameStore()
  const [mounted, setMounted] = useState(false);

  const { visitedNodes, currentNodeId, stepForward, stepBack, fastForward } = useSimulation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Converter tree do store para formato VisX, injetando isVisited e isCurrent
  const visxData = convertToVisx(tree, visitedNodes, currentNodeId);

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

      <main className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 pb-4">
        <VisualizationPanel
          visxData={visxData}
          onStep={stepForward}
          onStepBack={stepBack}
          onFastForward={fastForward}
        />
        <EditorPanel />
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
    children: node.children ? node.children.map((c: any) => convertToVisx(c, visitedSet, currentNodeId)) : []
  };
}
