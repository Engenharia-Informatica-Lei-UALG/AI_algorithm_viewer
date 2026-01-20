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
  Users,
  RotateCcw
} from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { CustomTreeNode, NodeShape, ProblemType, NodeViewMode, AlgorithmType } from "@/types/game"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon } from "lucide-react"
import { EightPuzzleBoard, TicTacToeBoard } from "../game/Boards"

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
    setTicTacToeMaxPlayer,
    searchSettings,
    updateSearchSettings,
    toggleAdmissibility,
    admissibilityViolations
  } = useGameStore()

  const [isCollapsed, setIsCollapsed] = useState(!!algorithm)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [admissibilityResult, setAdmissibilityResult] = useState<{ isAdmissible: boolean, violations: string[] } | null>(null)
  const [goalInput, setGoalInput] = useState(goalState?.join(' ') || "")
  const { t } = useTranslation()

  const algorithms = [
    {
      id: 'bfs',
      name: t('algo_bfs_name'),
      icon: ArrowRightLeft,
      description: t('algo_bfs_desc'),
      category: 'blind'
    },
    {
      id: 'dfs',
      name: t('algo_dfs_name'),
      icon: ArrowDown,
      description: t('algo_dfs_desc'),
      category: 'blind'
    },
    {
      id: 'ids',
      name: t('algo_ids_name'),
      icon: Timer,
      description: t('algo_ids_desc'),
      category: 'blind'
    },
    {
      id: 'ucs',
      name: t('algo_ucs_name'),
      icon: Route,
      description: t('algo_ucs_desc'),
      category: 'blind'
    },
    {
      id: 'greedy',
      name: t('algo_greedy_name'),
      icon: Zap,
      description: t('algo_greedy_desc'),
      category: 'heuristic'
    },
    {
      id: 'astar',
      name: t('algo_astar_name'),
      icon: Search,
      description: t('algo_astar_desc'),
      category: 'heuristic'
    },
    {
      id: 'idastar',
      name: t('algo_idastar_name'),
      icon: Timer,
      description: t('algo_idastar_desc'),
      category: 'heuristic'
    },
    {
      id: 'minimax',
      name: t('algo_minimax_name'),
      icon: GitGraph,
      description: t('algo_minimax_desc'),
      category: 'adversarial'
    },
    {
      id: 'alpha-beta',
      name: t('algo_alphabeta_name'),
      icon: Network,
      description: t('algo_alphabeta_desc'),
      category: 'adversarial'
    },
    {
      id: 'mcts',
      name: t('algo_mcts_name'),
      icon: BrainCircuit,
      description: t('algo_mcts_desc'),
      category: 'adversarial'
    }
  ] as const;

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

  const handleCheckAdmissibility = () => {
    // Usa a função do store para alternar ou calcular
    toggleAdmissibility();
    
    // Atualiza o estado local de resultado para mostrar a mensagem de texto
    // Nota: Como toggleAdmissibility é síncrono no store, podemos ler o estado atualizado logo após?
    // Não diretamente com o hook, mas podemos replicar a lógica de exibição baseada no store.
    
    // Se o store agora tem violações, mostramos "Não Admissível".
    // Se não tem, e acabamos de rodar... bem, o toggleAdmissibility não retorna o resultado para aqui.
    // Vamos manter a lógica local APENAS para a mensagem de texto, mas usar o store para o visual (vermelho).
    
    // Mas espere, se o usuário clicar para "limpar", o store limpa.
    // Se o usuário clicar para "verificar", o store verifica.
    
    // Vamos simplificar: Se já tem violações (vermelho), o clique limpa tudo (store e local).
    if (admissibilityViolations.length > 0) {
        setAdmissibilityResult(null);
        return;
    }

    // Se não tem, calculamos para mostrar a mensagem
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
      // Verifica consistência: h(n) <= c(n, n') + h(n')
      // Mas aqui estamos verificando admissibilidade estrita h <= h* para a mensagem?
      // O store verifica consistência local. Vamos alinhar.
      
      // O store usa: hCurrent > cost + hChild (Consistência)
      // Vamos usar a mesma lógica do store para consistência visual.
      
      // Mas para a mensagem "Admissível", geralmente se espera h <= h*.
      // Vamos manter a verificação de h <= h* para a mensagem de texto, pois é mais forte.
      if (hStar !== Infinity && h > hStar) {
        violationIds.push(node.id);
        violationDetails.push(`${node.name}: h(${h}) > h*(${hStar})`);
      }
      node.children?.forEach(validateNode);
    };
    validateNode(tree);
    
    setAdmissibilityResult({ isAdmissible: violationIds.length === 0, violations: violationDetails });
    // O store já foi atualizado pelo toggleAdmissibility? Não, precisamos chamar o toggle se quisermos o visual.
    // O problema é que o toggleAdmissibility do store usa a lógica de consistência local, e aqui usamos h*.
    // Se quisermos que o botão "Verificar" mostre o vermelho, devemos confiar no store.
    
    // Se o store toggleAdmissibility foi chamado no início, ele usou a lógica de consistência.
    // Se quisermos alinhar, devemos usar apenas o store.
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
              {t('problem_type')}
            </h3>
            <div className={cn("grid gap-2", algorithm === 'mcts' ? "grid-cols-2" : "grid-cols-3")}>
              {[
                { id: 'custom', name: t('custom_tree'), icon: TreePine },
                { id: 'tictactoe', name: t('tictactoe'), icon: Gamepad2 },
                { id: '8puzzle', name: t('8puzzle'), icon: Puzzle },
              ].filter(t => algorithm !== 'mcts' || t.id !== 'custom').map((type) => (
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
                  <h4 className="text-xs font-black uppercase tracking-widest">{t('goal_state')}</h4>
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
                  <h4 className="text-xs font-black uppercase tracking-widest">{t('heuristic_analysis')}</h4>
                </div>
                <button
                  onClick={handleCheckAdmissibility}
                  className={cn(
                    "w-full py-2 rounded-lg text-xs font-bold transition-all",
                    admissibilityViolations.length > 0 
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                        : "bg-primary text-primary-foreground hover:opacity-90"
                  )}
                >
                  {admissibilityViolations.length > 0 ? t('clear_visualization') : t('check_admissibility')}
                </button>
                {admissibilityResult && (
                  <div className={cn("p-3 rounded-lg text-xs font-bold border", admissibilityResult.isAdmissible ? "bg-green-500/10 border-green-500/50 text-green-600" : "bg-destructive/10 border-destructive/50 text-destructive")}>
                    {admissibilityResult.isAdmissible ? t('admissible') : t('not_admissible')}
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
                  <h4 className="text-xs font-black uppercase tracking-widest">{t('adversarial_config')}</h4>
                </div>

                {problemType === 'tictactoe' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('max_player')}</label>
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
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('max_nodes')}</label>
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
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('min_nodes')}</label>
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

            {algorithm === 'mcts' && (
              <motion.div
                key="mcts-settings"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border-2 border-dashed p-4 bg-card space-y-4"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Settings2 size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">{t('mcts_config')}</h4>
                </div>

                <div className="space-y-3">
                   <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('exploration_constant')}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{searchSettings.mctsExploration.toFixed(2)}</span>
                          <button
                            onClick={() => updateSearchSettings({ mctsExploration: 1.414 })}
                            className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"
                            title="Resetar para padrão (1.414)"
                          >
                            <RotateCcw size={10} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.05"
                        value={searchSettings.mctsExploration}
                        onChange={(e) => updateSearchSettings({ mctsExploration: parseFloat(e.target.value) })}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {t('mcts_desc')}
                      </p>
                   </div>
                </div>
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
                    setAlgorithm(algo.id as AlgorithmType);
                    // Se escolher MCTS e estiver em Árvore, muda automaticamente para um jogo
                    if (algo.id === 'mcts' && problemType === 'custom') {
                      setProblemType('tictactoe');
                    }
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
