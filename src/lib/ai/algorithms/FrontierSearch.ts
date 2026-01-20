import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

/**
 * Concrete implementation of a SearchNode for tree-based search algorithms.
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
   * @returns The total evaluation score of the node.
   */
  getScore(): number {
    return this.pathCost + this.heuristic;
  }
}

/**
 * Type definition for a node comparator used to order the search frontier.
 */
type NodeComparator<S extends State, A extends Action> = (a: SearchNode<S, A>, b: SearchNode<S, A>) => number;

/**
 * Generic search algorithm implementation that uses a frontier (priority queue or stack/queue)
 * to explore the state space. It supports multiple algorithms like BFS, DFS, A*, UCS, and Greedy
 * by adjusting the node comparator.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export class FrontierSearch<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private frontier: SearchNode<S, A>[] = [];
  private explored: Set<string> = new Set();
  private comparator: NodeComparator<S, A> | null;
  /** Map used to build and track the visual tree representation for UI components. */
  private visualNodeMap: Map<SearchNode<S, A>, CustomTreeNode> = new Map();

  /**
   * Initializes a new FrontierSearch instance.
   * @param problem - The problem to solve.
   * @param comparator - Optional function to determine the order of node expansion.
   */
  constructor(problem: Problem<S, A>, comparator: NodeComparator<S, A> | null = null) {
    super(problem);
    this.comparator = comparator;
    this.initialize();
  }

  /**
   * Initializes the search by creating the root node and clearing metrics.
   * Sets up the initial visual tree structure.
   */
  protected initialize(): void {
    const rootState = this.problem.initialState;
    const rootNode = new NodeImpl<S, A>(
      rootState,
      null,
      null,
      0,
      this.problem.getHeuristic(rootState),
      0
    );
    this.frontier = [rootNode];
    this.explored.clear();
    this.visualNodeMap.clear();

    const visualRoot: CustomTreeNode = {
      id: 'root',
      name: 'Start',
      value: this.problem.getHeuristic(rootState),
      children: [],
      boardState: (rootState as any).board,
    };
    this.visualNodeMap.set(rootNode, visualRoot);
  }

  /**
   * Executes a single step of the search algorithm.
   * Expands the best node from the frontier based on the comparator.
   * 
   * @returns The node currently being explored, or the goal node if found.
   */
  step(): SearchNode<S, A> | null {
    if (this.frontier.length === 0) {
      this.status = SearchStatus.FAILED;
      return null;
    }

    if (this.comparator) {
      this.frontier.sort(this.comparator);
    }

    const node = this.frontier.shift()!;
    this.nodesExplored++;
    this.currentDepth = Math.max(this.currentDepth, node.depth);

    if (this.problem.isGoal(node.state)) {
      this.status = SearchStatus.COMPLETED;
      return node;
    }

    this.explored.add(node.state.key);

    const actions = this.problem.getActions(node.state);

    for (const action of actions) {
      const nextState = this.problem.getResult(node.state, action);

      if (!this.explored.has(nextState.key)) {
        const cost = node.pathCost + this.problem.getCost(node.state, action, nextState);
        const heuristic = this.problem.getHeuristic(nextState);

        const child = new NodeImpl<S, A>(
          nextState,
          node,
          action,
          cost,
          heuristic,
          node.depth + 1
        );

        const parentVisualNode = this.visualNodeMap.get(node);
        if (parentVisualNode) {
          const childVisualNode: CustomTreeNode = {
            id: `${parentVisualNode.id}-${action.name}`,
            name: action.name,
            value: heuristic,
            costToParent: this.problem.getCost(node.state, action, nextState),
            children: [],
            boardState: (nextState as any).board,
            isGoal: this.problem.isGoal(nextState),
          };
          parentVisualNode.children.push(childVisualNode);
          this.visualNodeMap.set(child, childVisualNode);
        }

        const existingIndex = this.frontier.findIndex(n => n.state.key === nextState.key);
        if (existingIndex !== -1) {
          if (this.comparator && this.comparator(child, this.frontier[existingIndex]) < 0) {
            this.frontier[existingIndex] = child;
          }
        } else {
          this.frontier.push(child);
        }
      }
    }

    return node;
  }

  /**
   * Returns the visual tree structure for UI rendering.
   * @returns {CustomTreeNode} The root of the visual tree.
   */
  public getTree(): CustomTreeNode {
    return Array.from(this.visualNodeMap.values())[0];
  }

  /**
   * Gathers algorithm-specific attributes for the UI statistics display.
   * @returns A record of search metrics including frontier and explored sets.
   */
  public getAttributes(): Record<string, string | number | string[]> {
    const frontierNames = this.frontier.map(n => {
      const name = (n.state as any).nodeRef?.name || (n.action?.name) || 'Node';
      const score = n.getScore();
      return `${name} (f=${score.toFixed(1)})`;
    });

    const exploredNames = Array.from(this.explored).map(key => {
      return key.length > 15 ? key.substring(0, 12) + '...' : key;
    });

    return {
      "Open List (Frontier)": frontierNames.length > 0 ? frontierNames : ["(Empty)"],
      "Closed List (Explored)": exploredNames.length > 0 ? exploredNames : ["(Empty)"],
      "Total Visited": this.explored.size,
    };
  }

  /**
   * Factory method to create a Breadth-First Search (BFS) instance.
   */
  static createBFS<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, null);
  }

  /**
   * Factory method to create a Depth-First Search (DFS) instance.
   */
  static createDFS<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => b.depth - a.depth);
  }

  /**
   * Factory method to create an A* Search instance.
   */
  static createAStar<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => a.getScore() - b.getScore());
  }

  /**
   * Factory method to create a Uniform Cost Search (UCS) instance.
   */
  static createUCS<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => a.pathCost - b.pathCost);
  }

  /**
   * Factory method to create a Greedy Best-First Search instance.
   */
  static createGreedy<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => a.heuristic - b.heuristic);
  }
}

