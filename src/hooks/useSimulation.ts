import { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore, AlgorithmType, ProblemType } from '@/store/gameStore';
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
    updateTree
  } = useGameStore();

  const searchAlgoRef = useRef<SearchAlgorithm<any, any> | null>(null);
  const problemRef = useRef<Problem<any, any> | null>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // A árvore customizada só é uma dependência se o problema for 'custom'
  const customTreeJson = useMemo(() => 
    problemType === 'custom' ? JSON.stringify(tree) : '',
    [problemType, tree]
  );

  // Inicializa o problema e o algoritmo
  useEffect(() => {
    if (!algorithm) return;

    setHistory([]);
    setCurrentStep(0);
    setNodesExplored(0);

    let problem: Problem<any, any>;

    // 1. Cria a instância do problema
    switch (problemType) {
      case 'tictactoe':
        problem = new TicTacToe(tree.boardState);
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
      case 'mcts': algoInstance = new MCTS(problem, 100); break;
      default: console.warn("Algoritmo não implementado:", algorithm);
    }
    searchAlgoRef.current = algoInstance;

  }, [algorithm, customTreeJson, resetTrigger, problemType, goalState, setNodesExplored]);

  useEffect(() => {
    setNodesExplored(currentStep);
  }, [currentStep, setNodesExplored]);

  const executeStep = () => {
    if (currentStep < history.length) {
      setCurrentStep(c => c + 1);
      return;
    }

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

  useEffect(() => {
    if (isSimulating && searchAlgoRef.current) {
      timerRef.current = setInterval(executeStep, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, history, currentStep, toggleSimulation]);

  const visitedNodes = useMemo(() => new Set(history.slice(0, currentStep)), [history, currentStep]);
  const currentNodeId = useMemo(() => history[currentStep - 1] || null, [history, currentStep]);

  return {
    visitedNodes,
    currentNodeId,
    stepForward: executeStep,
    stepBack,
    fastForward: () => {
      if (!isSimulating) toggleSimulation();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(executeStep, 50);
    }
  };
}
