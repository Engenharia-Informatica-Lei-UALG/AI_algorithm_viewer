"use client"

import { useTranslation } from 'react-i18next'
import { useGameStore } from "@/store/gameStore"
import TreeGraph from "@/components/visualization/TreeGraph"
import { Play, SkipBack, SkipForward, RotateCcw, FastForward } from 'lucide-react'

interface VisualizationPanelProps {
  visxData: any;
  onStep: () => void;
  onStepBack: () => void;
  onFastForward: () => void;
}

export function VisualizationPanel({ visxData, onStep, onStepBack, onFastForward }: VisualizationPanelProps) {
  const { t } = useTranslation()
  const { algorithm, isSimulating, reset, nodesExplored } = useGameStore()

  return (
    <section className="xl:col-span-9 flex flex-col h-full min-h-[500px]">
      <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b bg-muted/10 flex flex-wrap gap-4 justify-between items-center">

          {/* Controls Area - Simplificada */}
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/50 rounded-lg border p-1 gap-1 shadow-sm">
              <button
                onClick={onStepBack}
                disabled={!algorithm || isSimulating || nodesExplored === 0}
                className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                title={t('step_back')}
              >
                <SkipBack size={18} />
              </button>
              
              <button
                onClick={onStep}
                disabled={!algorithm || isSimulating}
                className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md disabled:opacity-30 transition-all"
                title={t('step')}
              >
                <SkipForward size={18} />
              </button>

              <button
                onClick={onFastForward}
                disabled={!algorithm || isSimulating}
                className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                title="Resultado Final"
              >
                <FastForward size={18} />
              </button>
            </div>

            <button
              onClick={reset}
              disabled={!algorithm || nodesExplored === 0}
              className="flex items-center gap-2 py-2 px-4 text-xs font-bold border rounded-lg hover:bg-accent transition-all disabled:opacity-30"
            >
              <RotateCcw size={14} />
              {t('reset')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Algoritmo:</span>
            <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              {algorithm ? algorithm.toUpperCase() : "---"}
            </span>
          </div>
        </div>
        
        <div className="flex-1 bg-background relative overflow-hidden">
          <TreeGraph data={visxData} width={800} height={600} />
        </div>
      </div>
    </section>
  )
}
