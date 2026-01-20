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
  private currentVisualNode: CustomTreeNode | null = null;
  private maxAllowedDepth: number;
  private isResetting: boolean = false;

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
    this.visualRoot = null;
    this.currentVisualNode = null;
    this.isResetting = false;
    this.prepareIteration();
  }

  /**
   * Resets visual flags for the entire tree to prepare for a new iteration.
   * Keeps the structure (children) intact so the tree doesn't "collapse" visually.
   */
  private resetVisualTree(node: CustomTreeNode): void {
    node.isVisited = false;
    node.isCurrent = false;
    node.isPruned = false;
    node.pruningTriggeredBy = undefined;
    node.children.forEach(child => this.resetVisualTree(child));
  }

  /**
   * Re-initializes the DFS stack for a new depth-limit iteration.
   */
  private prepareIteration(): void {
    const rootState = this.problem.initialState;
    const rootNode = new NodeImpl<S, A>(rootState, null, null, 0, 0, 0);
    this.stack = [rootNode];

    if (!this.visualRoot) {
      const p = this.problem as any;
      if (p.rootNode) {
        this.visualRoot = structuredClone(p.rootNode);
      } else {
        this.visualRoot = {
          id: 'root',
          name: `Start`,
          children: [],
          boardState: (rootState as any).board,
        };
      }
    }

    if (this.visualRoot) {
      this.resetVisualTree(this.visualRoot);
    }

    this.currentVisualNode = null;
    this.visualNodeMap.clear();
    if (this.visualRoot) {
      this.visualNodeMap.set(rootNode, this.visualRoot);
    }
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

    // If we are in the "reset" phase, prepare the next iteration and immediately proceed
    // so the UI updates with the new iteration state (root visited, new limit text).
    if (this.stack.length === 0) {
      this.currentLimit++;
      if (this.currentLimit > this.maxAllowedDepth) {
        this.status = SearchStatus.FAILED;
        return null;
      }
      this.prepareIteration();
      // Proceed to pop the first node of the new iteration
    }

    const node = this.stack.pop()!;
    this.nodesExplored++;
    this.currentDepth = node.depth;

    // Update visual state: Clear previous focus
    if (this.currentVisualNode) {
      this.currentVisualNode.isCurrent = false;
    }

    // Set new focus
    const visualNode = this.visualNodeMap.get(node);
    if (visualNode) {
      visualNode.isVisited = true;
      visualNode.isCurrent = true; // This triggers the purple highlight in TreeGraph.tsx
      this.currentVisualNode = visualNode;
    }

    if (this.problem.isGoal(node.state)) {
      this.status = SearchStatus.COMPLETED;
      if (visualNode) visualNode.isGoal = true;
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
          const targetNodeId = (action as any).targetNodeId;
          const childId = targetNodeId || `${parentVisual.id}-${action.name.replace(/\s+/g, '_')}`;
          let childVisual = parentVisual.children.find(c => c.id === childId);

          if (!childVisual) {
            childVisual = {
              id: childId,
              name: action.name,
              children: [],
              boardState: (nextState as any).board,
              isGoal: this.problem.isGoal(nextState)
            };
            parentVisual.children.push(childVisual);
          }

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
