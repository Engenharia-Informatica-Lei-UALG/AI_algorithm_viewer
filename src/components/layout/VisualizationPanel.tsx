"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from "@/store/gameStore"
import TreeGraph from "@/components/visualization/TreeGraph"
import GraphVisualizer from "@/components/visualization/GraphVisualizer"
import { Play, SkipBack, SkipForward, RotateCcw, FastForward, Network, GitBranch, X, Sparkles, Maximize } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ParentSize } from '@visx/responsive'

interface VisualizationPanelProps {
  visxData: any;
  onStepAction: () => void;
  onStepBackAction: () => void;
  onFastForwardAction: () => void;
}

export function VisualizationPanel({ visxData, onStepAction, onStepBackAction, onFastForwardAction }: VisualizationPanelProps) {
  const { t } = useTranslation()
  const { algorithm, isSimulating, reset, nodesExplored, problemType } = useGameStore()
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree')
  const [showHint, setShowHint] = useState(false)
  const [zoomResetTrigger, setZoomResetTrigger] = useState(0)

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('has_seen_view_toggle_hint')
    if (!hasSeenHint && problemType === 'custom') {
      setShowHint(true)
    }
  }, [problemType])

  const dismissHint = () => {
    setShowHint(false)
    localStorage.setItem('has_seen_view_toggle_hint', 'true')
  }

  return (
    <section className="xl:col-span-9 flex flex-col h-full min-h-[500px]">
      <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b bg-muted/10 flex flex-wrap gap-4 justify-between items-center">

          {/* Controls Area */}
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/50 rounded-lg border p-1 gap-1 shadow-sm">
              <button
                onClick={onStepBackAction}
                disabled={!algorithm || isSimulating || nodesExplored === 0}
                className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                title={t('step_back')}
              >
                <SkipBack size={18} />
              </button>
              
              <button
                onClick={onStepAction}
                disabled={!algorithm || isSimulating}
                className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md disabled:opacity-30 transition-all"
                title={t('step')}
              >
                <SkipForward size={18} />
              </button>

              <button
                onClick={onFastForwardAction}
                disabled={!algorithm || isSimulating}
                className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
                title="Resultado Final"
              >
                <FastForward size={18} />
              </button>
            </div>

            <button
              onClick={() => setZoomResetTrigger(v => v + 1)}
              className="p-2 bg-muted/50 hover:bg-accent border rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-sm"
              title={t('center_view')}
            >
              <Maximize size={18} />
            </button>

            <button
              onClick={reset}
              disabled={!algorithm || nodesExplored === 0}
              className="flex items-center gap-2 py-2 px-4 text-xs font-bold border rounded-lg hover:bg-accent transition-all disabled:opacity-30"
            >
              <RotateCcw size={14} />
              {t('reset')}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            {problemType === 'custom' && (
                <div className="relative flex bg-muted/50 rounded-lg border p-1 gap-1">
                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute -bottom-16 right-0 z-50 min-w-[200px]"
                        >
                          <div className="bg-primary text-primary-foreground text-[11px] font-bold p-3 rounded-xl shadow-2xl border border-primary-foreground/20 relative">
                            {/* Seta do balão */}
                            <div className="absolute -top-1 right-6 w-3 h-3 bg-primary rotate-45" />
                            
                            <div className="flex items-start gap-2">
                              <Sparkles size={14} className="text-yellow-400 shrink-0 animate-pulse" />
                              <p className="leading-tight">{t('view_hint') as string}</p>
                              <button 
                                onClick={dismissHint}
                                className="hover:bg-white/20 rounded p-0.5 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'tree' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Vista de Árvore"
                    >
                        <GitBranch size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('graph')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'graph' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Vista de Grafo (Force-Directed)"
                    >
                        <Network size={16} />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Algoritmo:</span>
                <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                {algorithm ? algorithm.toUpperCase() : "---"}
                </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-background relative overflow-hidden">
          <ParentSize>
            {({ width, height }) => (
              viewMode === 'tree' || problemType !== 'custom' ? (
                <TreeGraph data={visxData} width={width} height={height} zoomResetTrigger={zoomResetTrigger} />
              ) : (
                <GraphVisualizer data={visxData} width={width} height={height} zoomResetTrigger={zoomResetTrigger} />
              )
            )}
          </ParentSize>
        </div>
      </div>
    </section>
  )
}
