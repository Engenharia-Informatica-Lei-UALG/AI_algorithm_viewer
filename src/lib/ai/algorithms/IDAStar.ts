import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

/**
 * Concrete implementation of a SearchNode for IDA*.
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
   * Calculates the f-score (g + h).
   * @returns The total evaluation score.
   */
  getScore(): number {
    return this.pathCost + this.heuristic;
  }
}

/**
 * Iterative Deepening A* (IDA*) search algorithm.
 * Combines the space-efficiency of DFS with the optimality of A*.
 * It iteratively increases the f-score threshold.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export class IDAStar<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private threshold: number = 0;
  private nextThreshold: number = Infinity;
  private stack: SearchNode<S, A>[] = [];
  private visualRoot: CustomTreeNode | null = null;
  private visualNodeMap: Map<SearchNode<S, A>, CustomTreeNode> = new Map();
  private currentVisualNode: CustomTreeNode | null = null;
  private maxIterations: number;
  private isResetting: boolean = false;

  /**
   * Initializes a new IDAStar instance.
   * @param problem - The problem to solve.
   * @param maxIterations - Safety limit to prevent infinite loops.
   */
  constructor(problem: Problem<S, A>, maxIterations: number = 5000) {
    super(problem);
    this.maxIterations = maxIterations;
    this.initialize();
  }

  /**
   * Initializes the algorithm by setting the initial threshold based on root heuristic.
   */
  protected initialize(): void {
    this.nodesExplored = 0;
    this.status = SearchStatus.RUNNING;
    this.threshold = this.problem.getHeuristic(this.problem.initialState);
    this.visualRoot = null;
    this.currentVisualNode = null;
    this.isResetting = false;
    this.prepareIteration();
  }

  /**
   * Resets visual flags for the entire tree to prepare for a new iteration.
   */
  private resetVisualTree(node: CustomTreeNode): void {
    node.isVisited = false;
    node.isCurrent = false;
    node.isPruned = false;
    node.pruningTriggeredBy = undefined;
    node.children.forEach(child => this.resetVisualTree(child));
  }

  /**
   * Resets the DFS stack for a new threshold iteration.
   */
  private prepareIteration(): void {
    const rootState = this.problem.initialState;
    const h = this.problem.getHeuristic(rootState);

    const rootNode = new NodeImpl<S, A>(
      rootState,
      null,
      null,
      0,
      h,
      0
    );
    this.stack = [rootNode];
    this.nextThreshold = Infinity;

    if (!this.visualRoot) {
      const p = this.problem as any;
      if (p.rootNode) {
        this.visualRoot = structuredClone(p.rootNode);
      } else {
        const rootState = this.problem.initialState;
        this.visualRoot = {
          id: 'root',
          name: `Start`,
          children: [],
          boardState: (rootState as any).board,
          value: h
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
   * Performs a single step of the IDA* algorithm.
   * Processes the top node from the stack. If f > threshold, it prunes the branch.
   * If the stack is empty, it starts a new iteration with the next threshold.
   * 
   * @returns The explored node, or null if an iteration ended.
   */
  step(): SearchNode<S, A> | null {
    if (this.status !== SearchStatus.RUNNING) return null;

    if (this.nodesExplored >= this.maxIterations) {
      this.status = SearchStatus.FAILED;
      return null;
    }

    if (this.stack.length === 0) {
      if (this.nextThreshold === Infinity) {
        this.status = SearchStatus.FAILED;
        return null;
      }
      this.threshold = this.nextThreshold;
      this.prepareIteration();
      // Proceed to pop the first node of new iteration
    }

    const node = this.stack.pop()!;
    const f = node.getScore();

    // Update visual state: Clear previous focus
    if (this.currentVisualNode) {
      this.currentVisualNode.isCurrent = false;
    }

    // Set new focus
    const visualNode = this.visualNodeMap.get(node);
    if (visualNode) {
      visualNode.isVisited = true;
      visualNode.isCurrent = true; // Triggers purple highlight
      this.currentVisualNode = visualNode;
    }

    if (f > this.threshold) {
      this.nextThreshold = Math.min(this.nextThreshold, f);
      if (visualNode) {
        visualNode.isPruned = true;
        visualNode.pruningTriggeredBy = `f(${f}) > limit(${this.threshold})`;
      }
      return node;
    }

    this.nodesExplored++;
    this.currentDepth = Math.max(this.currentDepth, node.depth);

    if (this.problem.isGoal(node.state)) {
      this.status = SearchStatus.COMPLETED;
      if (visualNode) visualNode.isGoal = true;
      return node;
    }

    const actions = this.problem.getActions(node.state);

    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      const nextState = this.problem.getResult(node.state, action);
      const h = this.problem.getHeuristic(nextState);
      const g = node.pathCost + this.problem.getCost(node.state, action, nextState);

      const child = new NodeImpl<S, A>(nextState, node, action, g, h, node.depth + 1);
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
            value: h,
            costToParent: this.problem.getCost(node.state, action, nextState),
            children: [],
            boardState: (nextState as any).board,
            isGoal: this.problem.isGoal(nextState)
          };
          parentVisual.children.push(childVisual);
        }

        this.visualNodeMap.set(child, childVisual);
      }
    }

    return node;
  }

  /**
   * Returns the visual tree for the current threshold iteration.
   * @returns {CustomTreeNode}
   */
  public getTree(): CustomTreeNode {
    return this.visualRoot!;
  }

  /**
   * Returns current IDA* attributes for UI display.
   * @returns A record containing current and next f-limits.
   */
  public getAttributes(): Record<string, string | number | string[]> {
    return {
      "Current f-limit (Threshold)": this.threshold,
      "Next f-limit": this.nextThreshold === Infinity ? "∞" : this.nextThreshold,
      "Stack Size": this.stack.length
    };
  }
}
