import { useEffect, useRef, useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CustomTreeProblem } from '@/lib/ai/problems/CustomTreeProblem';
import { TicTacToe } from '@/lib/ai/problems/TicTacToe';
import { EightPuzzle } from '@/lib/ai/problems/EightPuzzle';
import { FrontierSearch } from '@/lib/ai/algorithms/FrontierSearch';
import { Minimax } from '@/lib/ai/algorithms/Minimax';
import { MCTS } from '@/lib/ai/algorithms/MCTS';
import { IDS } from '@/lib/ai/algorithms/IDS';
import { IDAStar } from '@/lib/ai/algorithms/IDAStar';
import { SearchAlgorithm, SearchStatus } from '@/lib/ai/core/SearchAlgorithm';
import { Problem } from '@/lib/ai/core/types';

/**
 * Custom hook to manage the simulation of AI search algorithms.
 * Handles algorithm initialization, step-by-step execution, history management,
 * and automatic simulation timing.
 * 
 * @returns {Object} Simulation control functions and state.
 */
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

  /** Reference to the current algorithm instance ensuring persistence across renders. */
  const searchAlgoRef = useRef<SearchAlgorithm<any, any> | null>(null);
  /** Reference to the current problem formulation. */
  const problemRef = useRef<Problem<any, any> | null>(null);

  /** History of visited node IDs to allow stepping back. */
  const [history, setHistory] = useState<string[]>([]);
  /** Current index in the exploration history. */
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Effect to (re)initialize the problem and algorithm whenever the configuration changes.
   * Handles setup for Tic-Tac-Toe, 8-Puzzle, and Custom Trees across all supported algorithms.
   */
  useEffect(() => {
    if (!algorithm) return;

    setHistory([]);
    setCurrentStep(0);
    setNodesExplored(0);
    setAlgorithmStats({});

    let problem: Problem<any, any>;

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

    let algoInstance: SearchAlgorithm<any, any> | null = null;
    switch (algorithm) {
      case 'bfs': algoInstance = FrontierSearch.createBFS(problem); break;
      case 'dfs': algoInstance = FrontierSearch.createDFS(problem); break;
      case 'astar': algoInstance = FrontierSearch.createAStar(problem); break;
      case 'greedy': algoInstance = FrontierSearch.createGreedy(problem); break;
      case 'ucs': algoInstance = FrontierSearch.createUCS(problem); break;
      case 'minimax': algoInstance = new Minimax(problem, searchSettings.maxDepth, false); break;
      case 'alpha-beta': algoInstance = new Minimax(problem, searchSettings.maxDepth, true); break;
      case 'mcts': algoInstance = new MCTS(problem, searchSettings.mctsIterations, searchSettings.mctsExploration); break;
      case 'ids': algoInstance = new IDS(problem, searchSettings.maxDepth); break;
      case 'idastar': algoInstance = new IDAStar(problem, 5000); break;
      default: console.warn("Algorithm not implemented:", algorithm);
    }
    searchAlgoRef.current = algoInstance;

  }, [algorithm, resetTrigger, problemType, goalState, setNodesExplored, ticTacToeMaxPlayer, searchSettings]);

  /**
   * synchronizes the global explored nodes count with the local simulation step.
   */
  useEffect(() => {
    setNodesExplored(currentStep);
  }, [currentStep, setNodesExplored]);

  /**
   * Executes a single step of the search algorithm.
   * Updates visual structures for tree-based algorithms (Minimax, MCTS, IDS/IDA*).
   */
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
      const isTreeBasedAlgo = ['minimax', 'alpha-beta', 'mcts', 'ids', 'idastar'].includes(algorithm as string);
      if ((problemType !== 'custom' || isTreeBasedAlgo) && 'getTree' in algo) {
        updateTree((algo as any).getTree(), true);
      }

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

  /**
   * Reverts the simulation to the previous state in history.
   */
  const stepBack = () => {
    setCurrentStep(c => Math.max(0, c - 1));
  };

  const executeStepRef = useRef(executeStep);
  useEffect(() => {
    executeStepRef.current = executeStep;
  }, [executeStep]);

  /**
   * Automatically executes steps at a fixed interval when simulation is active.
   */
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

  /**
   * Rapidly advances the algorithm until termination or a safety threshold is reached.
   * Prevents browser UI freezing by limiting steps for heavy algorithms like MCTS or IDS.
   */
  const fastForward = () => {
    const algo = searchAlgoRef.current;
    if (!algo) return;

    let updatedHistory = [...history];
    let lastNode = null;
    let changed = false;

    let steps = 0;
    const maxSteps = (algorithm === 'mcts' || algorithm === 'idastar' || algorithm === 'ids') ? 20 : 1000;

    while (algo.getStatus() !== SearchStatus.COMPLETED && algo.getStatus() !== SearchStatus.FAILED && steps < maxSteps) {
      const node = algo.step();
      if (!node) break;

      changed = true;
      lastNode = node;
      const nodeId = (node.state as any).key || (node.state as any).nodeId;
      if (nodeId) updatedHistory.push(nodeId);
      steps++;
    }

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

