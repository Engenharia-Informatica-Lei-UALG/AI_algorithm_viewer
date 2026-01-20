"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from "@/store/gameStore"
import TreeGraph from "@/components/visualization/TreeGraph"
import GraphVisualizer from "@/components/visualization/GraphVisualizer"
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward, Network, GitBranch, X, Sparkles, Maximize, LocateFixed, Gauge, MousePointer2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ParentSize } from '@visx/responsive'
import { cn } from '@/lib/utils'

interface VisualizationPanelProps {
  visxData: any;
  onStepAction: () => void;
  onStepBackAction: () => void;
  onFastForwardAction: () => void;
}

/**
 * The main visualization container for the search tree/graph.
 * Provides controls for stepping through algorithms, toggling view modes (Tree vs. Force-Directed),
 * and managing visualization settings like zoom and camera follow.
 */
export function VisualizationPanel({ visxData, onStepAction, onStepBackAction, onFastForwardAction }: VisualizationPanelProps) {
  const { t } = useTranslation()
  const { algorithm, isSimulating, reset, nodesExplored, problemType, followActiveNode, setFollowActiveNode, algorithmStats, toggleSimulation, searchSettings, updateSearchSettings } = useGameStore()
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree')
  const [showHint, setShowHint] = useState(false)
  const [showSpeedHint, setShowSpeedHint] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [zoomResetTrigger, setZoomResetTrigger] = useState(0)

  useEffect(() => {
    const hasSeenSpeedHint = localStorage.getItem('has_seen_speed_hint')
    if (!hasSeenSpeedHint) {
      setShowSpeedHint(true)
    }
  }, [])

  // Hint persistence logic
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('has_seen_view_toggle_hint')
    if (!hasSeenHint && problemType === 'custom') {
      setShowHint(true)
    }
  }, [problemType])

  /** Suppresses the structural view hint for the remainder of the session. */
  const dismissHint = () => {
    setShowHint(false)
    localStorage.setItem('has_seen_view_toggle_hint', 'true')
  }

  return (
    <section className="xl:col-span-9 flex flex-col h-full min-h-[500px]">
      <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col h-full overflow-visible">
        <div className="p-4 border-b bg-muted/10 flex flex-wrap gap-4 justify-between items-center relative z-50">

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

              <div className="relative">
                <button
                  onClick={toggleSimulation}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowSpeedHint(false);
                    if (localStorage.getItem('has_seen_speed_hint') !== 'true') {
                      localStorage.setItem('has_seen_speed_hint', 'true');
                    }
                  }}
                  disabled={!algorithm}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isSimulating
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 animate-pulse"
                      : "hover:bg-background text-muted-foreground hover:text-foreground"
                  )}
                  title={isSimulating ? t('stop_sim') : t('start_sim')}
                >
                  {isSimulating ? <Pause size={18} /> : <Play size={18} />}
                </button>

                {/* Right-click notification hint - Aligned to the left to prevent clipping */}
                <AnimatePresence>
                  {showSpeedHint && !isSimulating && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                        default: { duration: 0.3 }
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute top-full mt-4 -left-4 bg-amber-600 text-white text-[11px] font-black py-2 px-4 rounded-xl whitespace-nowrap shadow-[0_0_25px_rgba(245,158,11,0.4)] border-2 border-white/40 z-[100] flex items-center gap-2"
                    >
                      {/* Arrow positioned over the button */}
                      <div className="absolute -top-2 left-8 w-4 h-4 bg-amber-600 rotate-45 border-t-2 border-l-2 border-white/40" />
                      <motion.span
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <MousePointer2 size={14} />
                      </motion.span>
                      {t('stats_tab.speed_hint')}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Speed Selection Menu - Now opens downwards */}
                <AnimatePresence>
                  {showSpeedMenu && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setShowSpeedMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 z-[100] bg-card/95 backdrop-blur-md border-2 rounded-xl shadow-2xl p-2 min-w-[170px] flex flex-col gap-1 border-primary/20"
                      >
                        <div className="px-2 py-1.5 border-b mb-1 flex items-center gap-2 text-muted-foreground">
                          <Gauge size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{t('stats_tab.sim_speed')}</span>
                        </div>
                        {[500, 1000, 1500, 2000, 3000].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              updateSearchSettings({ simulationSpeed: speed });
                              setShowSpeedMenu(false);
                            }}
                            className={cn(
                              "text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex justify-between items-center w-full",
                              searchSettings.simulationSpeed === speed
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <span>{speed / 1000}s</span>
                            {speed === 1500 && <span className="text-[9px] opacity-70">(Default)</span>}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

            </div>

            <button
              onClick={() => setFollowActiveNode(!followActiveNode)}
              className={cn(
                "p-2 border rounded-lg transition-all shadow-sm",
                followActiveNode ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-accent"
              )}
              title={t('follow_node') as string}
            >
              <LocateFixed size={18} />
            </button>

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
            {/* View Mode Toggle (Tree vs. Force Graph) */}
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
                        {/* Balloon tail/arrow */}
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
                  title="Tree View"
                >
                  <GitBranch size={16} />
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'graph' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Graph View (Force-Directed)"
                >
                  <Network size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{t('algorithm')}:</span>
                <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                  {algorithm ? algorithm.toUpperCase() : "---"}
                </span>
              </div>

              {/* Iteration / Limit Badge */}
              {algorithmStats && (algorithmStats["Current Depth Limit"] !== undefined || algorithmStats["Current f-limit (Threshold)"] !== undefined) && (
                <div className="flex items-center gap-3 animate-in zoom-in-50 duration-300">
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-black">
                    {algorithmStats["Current Depth Limit"] !== undefined ? t('stats_tab.depth_limit') : t('stats_tab.f_limit')}:
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={String(algorithmStats["Current Depth Limit"] ?? algorithmStats["Current f-limit (Threshold)"])}
                      initial={{ scale: 1.4, color: "#f59e0b" }}
                      animate={{ scale: 1, color: "#b45309" }}
                      transition={{ type: "spring", stiffness: 500, damping: 12 }}
                      className="text-lg font-mono font-black bg-amber-500/10 px-5 py-2 rounded-xl border-2 border-amber-500/30 shadow-md"
                    >
                      {algorithmStats["Current Depth Limit"] ?? algorithmStats["Current f-limit (Threshold)"]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-background relative overflow-hidden rounded-b-xl">
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
