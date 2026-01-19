"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  BrainCircuit,
  GitGraph,
  Network,
  ArrowRightLeft,
  ArrowDown,
  Search,
  Zap,
  Timer,
  Route,
  ShieldCheck,
  Settings2,
  Circle,
  Triangle,
  Square,
  Gamepad2,
  Puzzle,
  TreePine,
  Eye,
  LayoutGrid,
  Target,
  Users
} from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { CustomTreeNode, NodeShape, ProblemType, NodeViewMode } from "@/types/game"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon } from "lucide-react"
import { EightPuzzleBoard, TicTacToeBoard } from "../game/Boards"

const algorithms = [
  {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    icon: ArrowRightLeft,
    description: 'Explora vizinhos nível por nível. Garante o caminho mais curto em grafos não ponderados.',
    category: 'blind'
  },
  {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    icon: ArrowDown,
    description: 'Explora o mais profundo possível antes de retroceder. Baixo consumo de memória.',
    category: 'blind'
  },
  {
    id: 'ids',
    name: 'Iterative Deepening (IDS)',
    icon: Timer,
    description: 'Combina a completude do BFS com a eficiência de memória do DFS, aumentando o limite iterativamente.',
    category: 'blind'
  },
  {
    id: 'ucs',
    name: 'Uniform Cost Search (UCS)',
    icon: Route,
    description: 'Explora o nó com menor custo de caminho g(n). Ótimo para grafos ponderados.',
    category: 'blind'
  },
  {
    id: 'greedy',
    name: 'Greedy Best-First',
    icon: Zap,
    description: 'Explora o nó que parece mais próximo do objetivo baseado apenas na heurística h(n).',
    category: 'heuristic'
  },
  {
    id: 'astar',
    name: 'A* Search',
    icon: Search,
    description: 'Combina custo real e heurística f(n) = g(n) + h(n). Ótimo e completo.',
    category: 'heuristic'
  },
  {
    id: 'idastar',
    name: 'IDA*',
    icon: Timer,
    description: 'Versão iterativa do A* que usa limites de f-cost para economizar memória.',
    category: 'heuristic'
  },
  {
    id: 'minimax',
    name: 'Minimax',
    icon: GitGraph,
    description: 'Para jogos adversariais. Minimiza a perda máxima possível.',
    category: 'adversarial'
  },
  {
    id: 'alpha-beta',
    name: 'Alpha-Beta Pruning',
    icon: Network,
    description: 'Otimização do Minimax que corta ramos irrelevantes.',
    category: 'adversarial'
  },
  {
    id: 'mcts',
    name: 'Monte Carlo Tree Search',
    icon: BrainCircuit,
    description: 'Usa simulações aleatórias para estimar o valor dos movimentos.',
    category: 'adversarial'
  }
] as const;

export function AlgorithmSelector() {
  const {
    algorithm,
    setAlgorithm,
    tree,
    maxNodeShape,
    minNodeShape,
    setMaxNodeShape,
    setMinNodeShape,
    setAdmissibilityViolations,
    problemType,
    setProblemType,
    goalState,
    setGoalState,
    ticTacToeMaxPlayer,
    setTicTacToeMaxPlayer
  } = useGameStore()

  const [isCollapsed, setIsCollapsed] = useState(!!algorithm)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [admissibilityResult, setAdmissibilityResult] = useState<{ isAdmissible: boolean, violations: string[] } | null>(null)
  const [goalInput, setGoalInput] = useState(goalState?.join(' ') || "")
  const { t } = useTranslation()

  useEffect(() => {
    setIsCollapsed(!!algorithm)
    setAdmissibilityResult(null)
    // Evita resetar violações se já estiver vazio para não disparar re-render
    setAdmissibilityViolations([])
  }, [algorithm, setAdmissibilityViolations]);

  useEffect(() => {
    if (problemType === '8puzzle') {
      setGoalInput(goalState?.join(' ') || "")
    }
  }, [goalState, problemType]);

  const handleGoalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setGoalInput(input);

    const numbers = input.split(/\s+/).filter(Boolean).map(Number);
    if (numbers.length === 9 && new Set(numbers).size === 9 && numbers.every(n => n >= 0 && n <= 8)) {
      setGoalState(numbers);
    }
  };

  const selectedAlgo = algorithms.find(a => a.id === algorithm);
  const isAdversarial = selectedAlgo?.category === 'adversarial';

  const checkAdmissibility = () => {
    const violationIds: string[] = [];
    const violationDetails: string[] = [];
    const getMinCostToGoal = (node: CustomTreeNode): number => {
      if (node.isGoal) return 0;
      if (!node.children || node.children.length === 0) return Infinity;
      const costs = node.children.map(child => (child.costToParent || 0) + getMinCostToGoal(child));
      return Math.min(...costs);
    };
    const validateNode = (node: CustomTreeNode) => {
      const h = node.value || 0;
      const hStar = getMinCostToGoal(node);
      if (hStar !== Infinity && h > hStar) {
        violationIds.push(node.id);
        violationDetails.push(`${node.name}: h(${h}) > h*(${hStar})`);
      }
      node.children?.forEach(validateNode);
    };
    validateNode(tree);
    setAdmissibilityResult({ isAdmissible: violationIds.length === 0, violations: violationDetails });
    setAdmissibilityViolations(violationIds);
  };

  const filteredAlgorithms = algorithms.filter(algo => {
    const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || algo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'blind', 'heuristic', 'adversarial'];

  const ShapeIcon = ({ shape }: { shape: NodeShape }) => {
    if (shape === 'circle') return <Circle size={14} />;
    if (shape === 'triangle') return <Triangle size={14} />;
    return <Square size={14} />;
  };

  return (
    <div className="flex flex-col gap-6">
      {isCollapsed && selectedAlgo ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{t('algorithm')}</span>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-xs font-bold text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
            >
              {t('change_algo')}
            </button>
          </div>

          <div className="relative flex items-start gap-3 rounded-xl border-2 p-4 border-primary bg-primary/5 shadow-sm">
            <div className="rounded-lg p-2 bg-primary text-primary-foreground shrink-0">
              <selectedAlgo.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-bold leading-none text-sm text-primary">
                {selectedAlgo.name}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedAlgo.description}
              </p>
            </div>
          </div>

          {/* Menu de Tipo de Problema */}
          <div className="space-y-3 pt-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Settings2 size={12} />
              Tipo de Problema
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'custom', name: 'Árvore', icon: TreePine },
                { id: 'tictactoe', name: 'TicTacToe', icon: Gamepad2 },
                { id: '8puzzle', name: '8-Puzzle', icon: Puzzle },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProblemType(type.id as ProblemType)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all",
                    problemType === type.id
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border bg-card hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <type.icon size={16} />
                  <span className="text-[9px] font-bold uppercase">{type.name}</span>
                </button>
              ))}
            </div>
            <div className="h-px bg-border/50 mt-2" />
          </div>

          {/* Menus de Configuração Específicos */}
          <AnimatePresence mode="wait">
            {problemType === '8puzzle' && (
              <motion.div
                key="8puzzle-goal-settings"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border-2 border-dashed p-4 bg-card space-y-3"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Target size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Estado Objetivo</h4>
                </div>
                <EightPuzzleBoard board={goalState || []} size="sm" />
                <input
                  type="text"
                  value={goalInput}
                  onChange={handleGoalInputChange}
                  placeholder="Ex: 1 2 3 4 5 6 7 8 0"
                  className="w-full text-center font-mono bg-muted/50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </motion.div>
            )}

            {selectedAlgo.category === 'heuristic' && problemType === 'custom' && (
              <motion.div
                key="heuristic-settings"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border-2 border-dashed p-4 bg-card space-y-3"
              >
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Análise de Heurística</h4>
                </div>
                <button
                  onClick={checkAdmissibility}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Verificar Admissibilidade
                </button>
                {admissibilityResult && (
                  <div className={cn("p-3 rounded-lg text-xs font-bold border", admissibilityResult.isAdmissible ? "bg-green-500/10 border-green-500/50 text-green-600" : "bg-destructive/10 border-destructive/50 text-destructive")}>
                    {admissibilityResult.isAdmissible ? "✅ Admissível" : "❌ Não Admissível"}
                  </div>
                )}
              </motion.div>
            )}

            {isAdversarial && (problemType === 'custom' || problemType === 'tictactoe') && (
              <motion.div
                key="adversarial-settings"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border-2 border-dashed p-4 bg-card space-y-4"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Users size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Configuração Adversarial</h4>
                </div>

                {problemType === 'tictactoe' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Jogador Maximizador (MAX)</label>
                    <div className="flex bg-muted p-1 rounded-lg border">
                      <button
                        onClick={() => setTicTacToeMaxPlayer('X')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-1.5 text-lg font-black rounded-md transition-all",
                          ticTacToeMaxPlayer === 'X' ? "bg-blue-500 text-white shadow-sm" : "text-blue-500 hover:bg-background"
                        )}
                      >X</button>
                      <button
                        onClick={() => setTicTacToeMaxPlayer('O')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-1.5 text-lg font-black rounded-md transition-all",
                          ticTacToeMaxPlayer === 'O' ? "bg-red-500 text-white shadow-sm" : "text-red-500 hover:bg-background"
                        )}
                      >O</button>
                    </div>
                  </div>
                )}

                {problemType === 'custom' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Nós MAX (Jogador)</label>
                      <div className="flex gap-2">
                        {(['triangle', 'circle', 'square'] as NodeShape[]).map(shape => (
                          <button
                            key={shape}
                            onClick={() => setMaxNodeShape(shape)}
                            title={`Set MAX nodes to ${shape} shape`}
                            className={cn(
                              "flex-1 flex items-center justify-center p-2 rounded-md border transition-all",
                              maxNodeShape === shape ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted hover:bg-accent"
                            )}
                          >
                            <ShapeIcon shape={shape} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Nós MIN (Oponente)</label>
                      <div className="flex gap-2">
                        {(['triangle', 'circle', 'square'] as NodeShape[]).map(shape => (
                          <button
                            key={shape}
                            onClick={() => setMinNodeShape(shape)}
                            title={`Set MIN nodes to ${shape} shape`}
                            className={cn(
                              "flex-1 flex items-center justify-center p-2 rounded-md border transition-all",
                              minNodeShape === shape ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted hover:bg-accent"
                            )}
                          >
                            <ShapeIcon shape={shape} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted/50 border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  {t(`cat_${cat}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {filteredAlgorithms.map((algo) => {
              const isSelected = algorithm === algo.id
              const Icon = algo.icon

              return (
                <div
                  key={algo.id}
                  onClick={() => {
                    setAlgorithm(algo.id as any);
                    setIsCollapsed(true);
                  }}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all hover:bg-accent/50",
                    isSelected ? "border-primary bg-accent/10" : "bg-card"
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="algo-selection"
                      className="absolute inset-0 rounded-xl border-2 border-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  <div className={cn(
                    "rounded-lg p-2 transition-colors shrink-0",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 space-y-1 z-10 min-w-0">
                    <p className={cn("font-medium leading-none text-sm", isSelected && "text-primary")}>
                      {algo.name}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {algo.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
