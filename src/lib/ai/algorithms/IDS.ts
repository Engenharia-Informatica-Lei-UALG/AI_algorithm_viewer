import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

/**
 * Concrete implementation of a SearchNode for IDS.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
class NodeImpl<S extends State, A extends Action> implements SearchNode<S, A> {
  constructor(
    public state: S,
    public parent: SearchNode<S, A> | null,
    public action: A | null,
    public pathCost: number,
    public heuristic: number,
    public depth: number
  ) { }

  /**
   * Calculates the node score.
   * @returns {number}
   */
  getScore(): number {
    return this.pathCost + this.heuristic;
  }
}

/**
 * Iterative Deepening Search (IDS) algorithm.
 * Combines BFS's optimality (for unit costs) with DFS's space efficiency.
 * It repeatedly applies Depth-Limited Search with increasing depth limits.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export class IDS<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private currentLimit: number = 0;
  private stack: SearchNode<S, A>[] = [];
  private visualRoot: CustomTreeNode | null = null;
  private visualNodeMap: Map<SearchNode<S, A>, CustomTreeNode> = new Map();
  private maxAllowedDepth: number;

  /**
   * Initializes a new IDS instance.
   * @param problem - The problem to solve.
   * @param maxAllowedDepth - Safety limit for the search depth.
   */
  constructor(problem: Problem<S, A>, maxAllowedDepth: number = 50) {
    super(problem);
    this.maxAllowedDepth = maxAllowedDepth;
    this.initialize();
  }

  /**
   * Initializes the algorithm by resetting metrics and starting from depth 0.
   */
  protected initialize(): void {
    this.currentLimit = 0;
    this.nodesExplored = 0;
    this.status = SearchStatus.RUNNING;
    this.prepareIteration();
  }

  /**
   * Re-initializes the DFS stack for a new depth-limit iteration.
   */
  private prepareIteration(): void {
    const rootState = this.problem.initialState;
    const rootNode = new NodeImpl<S, A>(rootState, null, null, 0, 0, 0);
    this.stack = [rootNode];

    this.visualRoot = {
      id: `ids-l${this.currentLimit}-root`,
      name: `Start (Limit: ${this.currentLimit})`,
      children: [],
      boardState: (rootState as any).board,
    };
    this.visualNodeMap.clear();
    this.visualNodeMap.set(rootNode, this.visualRoot);
  }

  /**
   * Performs a single step of the IDS algorithm.
   * Processes the top node from the DFS stack. If the stack is empty, 
   * increments the depth limit and restarts the search.
   * 
   * @returns The explored node, or null if an iteration ended.
   */
  step(): SearchNode<S, A> | null {
    if (this.status !== SearchStatus.RUNNING) return null;

    if (this.stack.length === 0) {
      this.currentLimit++;
      if (this.currentLimit > this.maxAllowedDepth) {
        this.status = SearchStatus.FAILED;
        return null;
      }
      this.prepareIteration();
      return null;
    }

    const node = this.stack.pop()!;
    this.nodesExplored++;
    this.currentDepth = node.depth;

    if (this.problem.isGoal(node.state)) {
      this.status = SearchStatus.COMPLETED;
      return node;
    }

    if (node.depth < this.currentLimit) {
      const actions = this.problem.getActions(node.state);

      for (let i = actions.length - 1; i >= 0; i--) {
        const action = actions[i];
        const nextState = this.problem.getResult(node.state, action);
        const child = new NodeImpl<S, A>(
          nextState,
          node,
          action,
          node.pathCost + this.problem.getCost(node.state, action, nextState),
          0,
          node.depth + 1
        );

        this.stack.push(child);

        const parentVisual = this.visualNodeMap.get(node);
        if (parentVisual) {
          const childVisual: CustomTreeNode = {
            id: `${parentVisual.id}-${action.name}`,
            name: action.name,
            children: [],
            boardState: (nextState as any).board,
            isGoal: this.problem.isGoal(nextState)
          };
          parentVisual.children.push(childVisual);
          this.visualNodeMap.set(child, childVisual);
        }
      }
    }

    return node;
  }

  /**
   * Returns the visual tree structure for the current depth-limit iteration.
   * @returns {CustomTreeNode}
   */
  public getTree(): CustomTreeNode {
    return this.visualRoot!;
  }

  /**
   * Returns current IDS attributes for UI display.
   * @returns A record containing the current depth limit.
   */
  public getAttributes(): Record<string, string | number | string[]> {
    return {
      "Current Depth Limit": this.currentLimit,
      "Max Allowed Depth": this.maxAllowedDepth,
      "Stack Size": this.stack.length
    };
  }
}

