import { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { AlgorithmType, ProblemType } from '@/types/game';
import { CustomTreeProblem } from '@/lib/ai/problems/CustomTreeProblem';
import { TicTacToe } from '@/lib/ai/problems/TicTacToe';
import { EightPuzzle } from '@/lib/ai/problems/EightPuzzle';
import { FrontierSearch } from '@/lib/ai/algorithms/FrontierSearch';
import { Minimax } from '@/lib/ai/algorithms/Minimax';
import { MCTS } from '@/lib/ai/algorithms/MCTS';
import { SearchAlgorithm, SearchStatus } from '@/lib/ai/core/SearchAlgorithm';
import { Problem } from '@/lib/ai/core/types';

export function useSimulation() {
  const {
    algorithm,
    tree,
    isSimulating,
    toggleSimulation,
    setNodesExplored,
    resetTrigger,
    problemType,
    goalState,
    updateTree,
    searchSettings,
    setAlgorithmStats,
    ticTacToeMaxPlayer
  } = useGameStore();

  const searchAlgoRef = useRef<SearchAlgorithm<any, any> | null>(null);
  const problemRef = useRef<Problem<any, any> | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Detecta mudanças no estado inicial do problema para reinicializar a simulação
  // Para problemas customizados, queremos que a simulação reinicie se a estrutura da árvore mudar
  // MAS, se a mudança for apenas visual (ex: isVisited), não devemos reiniciar.
  // O useMemo abaixo tenta capturar apenas mudanças estruturais relevantes.
  const problemStateJson = useMemo(() => {
    if (problemType === 'custom') {
      // Para árvores customizadas, qualquer mudança na estrutura ou valores (h, g)
      // deve reiniciar o algoritmo para evitar cálculos baseados em dados obsoletos.
      // Como a simulação não altera a árvore original em modo 'custom', isso é seguro.
      return JSON.stringify(tree);
    }
    if (problemType === 'tictactoe' || problemType === '8puzzle') return JSON.stringify(tree.boardState);
    return '';
  }, [problemType, tree]);

  // Inicializa o problema e o algoritmo
  useEffect(() => {
    if (!algorithm) return;

    // Se mudou o algoritmo ou o problema, resetamos o histórico
    setHistory([]);
    setCurrentStep(0);
    setNodesExplored(0);
    setAlgorithmStats({});

    let problem: Problem<any, any>;

    // 1. Cria a instância do problema
    switch (problemType) {
      case 'tictactoe':
        problem = new TicTacToe(tree.boardState, ticTacToeMaxPlayer);
        break;
      case '8puzzle':
        problem = new EightPuzzle(tree.boardState, goalState);
        break;
      case 'custom':
      default:
        problem = new CustomTreeProblem(tree);
        break;
    }
    problemRef.current = problem;

    // 2. Cria a instância do algoritmo com o problema
    let algoInstance: SearchAlgorithm<any, any> | null = null;
    switch (algorithm) {
      case 'bfs': algoInstance = FrontierSearch.createBFS(problem); break;
      case 'dfs': algoInstance = FrontierSearch.createDFS(problem); break;
      case 'astar': algoInstance = FrontierSearch.createAStar(problem); break;
      case 'greedy': algoInstance = FrontierSearch.createGreedy(problem); break;
      case 'ucs': algoInstance = FrontierSearch.createUCS(problem); break;
      case 'minimax': algoInstance = new Minimax(problem, 10, false); break;
      case 'alpha-beta': algoInstance = new Minimax(problem, 10, true); break;
      case 'mcts': algoInstance = new MCTS(problem, searchSettings.mctsIterations, searchSettings.mctsExploration); break;
      default: console.warn("Algoritmo não implementado:", algorithm);
    }
    searchAlgoRef.current = algoInstance;

  }, [algorithm, resetTrigger, problemType, goalState, setNodesExplored, problemStateJson]);

  useEffect(() => {
    setNodesExplored(currentStep);
  }, [currentStep, setNodesExplored]);

  const executeStep = () => {
    if (currentStep < history.length) {
      setCurrentStep(c => c + 1);
      return;
    }

    // Se já terminou, para a simulação
    const algo = searchAlgoRef.current;
    if (!algo) return;

    if (algo.getStatus() === SearchStatus.COMPLETED || algo.getStatus() === SearchStatus.FAILED) {
      if (isSimulating) toggleSimulation();
      return;
    }

    const node = algo.step();
    if (node) {
      // Para problemas dinâmicos, atualizamos a árvore visual
      if (problemType !== 'custom' && 'getTree' in algo) {
        updateTree((algo as any).getTree());
      }
      
      // Atualiza estatísticas específicas do algoritmo (Fronteira, etc)
      if (algo.getAttributes) {
        setAlgorithmStats(algo.getAttributes());
      }

      const nodeId = (node.state as any).key || (node.state as any).nodeId;
      if (nodeId) {
        setHistory(prev => [...prev, nodeId]);
        setCurrentStep(c => c + 1);
      }
    }
  };

  const stepBack = () => {
    setCurrentStep(c => Math.max(0, c - 1));
  };

  // Padrão para evitar que o setInterval use valores antigos (stale closures)
  // e para evitar que o timer resete a cada renderização
  const executeStepRef = useRef(executeStep);
  useEffect(() => {
    executeStepRef.current = executeStep;
  }, [executeStep]);

  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        executeStepRef.current();
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const visitedNodes = useMemo(() => new Set(history.slice(0, currentStep)), [history, currentStep]);
  const currentNodeId = useMemo(() => history[currentStep - 1] || null, [history, currentStep]);

  const fastForward = () => {
    const algo = searchAlgoRef.current;
    if (!algo) return;

    let updatedHistory = [...history];
    let lastNode = null;
    let changed = false;

    // Limite de segurança para evitar que o browser trave (Freeze protection)
    // Algoritmos que geram muitas sub-árvores ou rollouts são limitados a 20 passos por clique
    let steps = 0;
    const maxSteps = (algorithm === 'mcts' || algorithm === 'idastar' || algorithm === 'ids') ? 20 : 1000;

    // 1. Se o algoritmo ainda estiver rodando, executa até o fim instantaneamente
    while (algo.getStatus() !== SearchStatus.COMPLETED && algo.getStatus() !== SearchStatus.FAILED && steps < maxSteps) {
      const node = algo.step();
      if (!node) break;
      
      changed = true;
      lastNode = node;
      const nodeId = (node.state as any).key || (node.state as any).nodeId;
      if (nodeId) updatedHistory.push(nodeId);
      steps++;
    }

    // 2. Se voltamos atrás no histórico, queremos pular para o fim do que já temos
    if (currentStep < history.length) changed = true;

    if (changed) {
      if (lastNode) {
        if (problemType !== 'custom' && 'getTree' in algo) {
          updateTree((algo as any).getTree());
        }
        if (algo.getAttributes) {
          setAlgorithmStats(algo.getAttributes());
        }
      }
      setHistory(updatedHistory);
      setCurrentStep(updatedHistory.length);
    }

    if (isSimulating) toggleSimulation();
  };

  return {
    visitedNodes,
    currentNodeId,
    stepForward: executeStep,
    stepBack,
    fastForward
  };
}
