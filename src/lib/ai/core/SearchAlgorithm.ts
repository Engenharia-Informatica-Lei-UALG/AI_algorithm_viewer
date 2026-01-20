import { Problem, SearchNode, State, Action } from './types';

/**
 * Enumeration of possible search algorithm statuses.
 */
export enum SearchStatus {
  /** Algorithm has not started yet. */
  IDLE = 'IDLE',
  /** Algorithm is currently executing. */
  RUNNING = 'RUNNING',
  /** Algorithm is temporarily suspended. */
  PAUSED = 'PAUSED',
  /** Algorithm successfully found a solution or completed its task. */
  COMPLETED = 'COMPLETED',
  /** Algorithm finished without finding a solution. */
  FAILED = 'FAILED'
}

/**
 * Abstract base class for all search algorithms.
 * Provides common infrastructure for tracking metrics, status, and iterative execution.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export abstract class SearchAlgorithm<S extends State, A extends Action> {
  /** The problem instance to be solved. */
  protected problem: Problem<S, A>;
  /** Current execution status. */
  protected status: SearchStatus = SearchStatus.IDLE;
  /** Total number of nodes expanded/explored during search. */
  protected nodesExplored: number = 0;
  /** Current depth reached in the search tree. */
  protected currentDepth: number = 0;

  /** Optional callback triggered on each step of the algorithm. */
  protected onStep?: (node: SearchNode<S, A>) => void;

  /**
   * Initializes a new search algorithm instance.
   * @param problem - The problem to solve.
   */
  constructor(problem: Problem<S, A>) {
    this.problem = problem;
  }

  /**
   * Performs a single iteration or 'step' of the search algorithm.
   * This is designed to be used in visualizations or controlled environments.
   * 
   * @returns The current or target node if found/relevant, otherwise null.
   */
  abstract step(): SearchNode<S, A> | null;

  /**
   * Executes the algorithm continuously until a solution is found, 
   * the search space is exhausted, or the status changes.
   * 
   * @returns The goal node if found, otherwise null.
   */
  run(): SearchNode<S, A> | null {
    this.status = SearchStatus.RUNNING;
    let result: SearchNode<S, A> | null = null;

    while (this.status === SearchStatus.RUNNING) {
      result = this.step();
      if (this.status !== SearchStatus.RUNNING) break;
    }

    return result;
  }

  /**
   * Returns the current status of the search.
   * @returns {SearchStatus}
   */
  getStatus(): SearchStatus {
    return this.status;
  }

  /**
   * Returns current performance metrics of the search.
   * @returns An object containing exploration metrics and status.
   */
  getMetrics() {
    return {
      nodesExplored: this.nodesExplored,
      currentDepth: this.currentDepth,
      status: this.status
    };
  }

  /**
   * Resets the algorithm to its initial state.
   */
  reset(): void {
    this.status = SearchStatus.IDLE;
    this.nodesExplored = 0;
    this.currentDepth = 0;
    this.initialize();
  }

  /**
   * Hook for algorithm-specific initialization logic.
   * Called during construction and resets.
   */
  protected abstract initialize(): void;

  /**
   * Returns algorithm-specific attributes/data for UI visualization.
   * e.g., current frontier size, closed set elements, etc.
   * 
   * @returns A record of attribute names and their values.
   */
  public getAttributes(): Record<string, string | number | string[]> {
    return {};
  }
}

