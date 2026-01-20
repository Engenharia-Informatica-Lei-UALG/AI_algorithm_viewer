import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

/**
 * Represents a node in the Monte Carlo Tree Search.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
class MCTSNode<S extends State, A extends Action> implements SearchNode<S, A> {
  /** Number of times this node has been visited. */
  public visits: number = 0;
  /** Accumulated value (reward/utility) from simulations. */
  public value: number = 0;
  /** Child nodes in the MCTS tree. */
  public children: MCTSNode<S, A>[] = [];
  /** List of actions that haven't been expanded yet from this state. */
  public untriedActions: A[];
  /** Unique identifier for the node, used for visualization stability. */
  public id: string;

  /**
   * Initializes a new MCTS node.
   * @param state - The state associated with this node.
   * @param parent - The parent node in the MCTS tree.
   * @param action - The action taken to reach this node.
   * @param pathCost - Initial path cost (usually 0 for MCTS).
   * @param heuristic - Initial heuristic (usually 0 for MCTS).
   * @param depth - Node depth.
   * @param problem - The problem instance.
   * @param id - Unique node ID.
   */
  constructor(
    public state: S,
    public parent: MCTSNode<S, A> | null,
    public action: A | null,
    public pathCost: number,
    public heuristic: number,
    public depth: number,
    problem: Problem<S, A>,
    id: string
  ) {
    this.untriedActions = problem.getActions(state);
    this.id = id;
  }

  /**
   * Calculates the average value of the node.
   * @returns {number}
   */
  getScore() { return this.value / (this.visits || 1); }

  /**
   * Checks if all possible actions from this state have been expanded.
   * @returns {boolean}
   */
  isFullyExpanded(): boolean {
    return this.untriedActions.length === 0;
  }
}

/**
 * Monte Carlo Tree Search (MCTS) algorithm implementation.
 * Follows the Selection, Expansion, Simulation, and Backpropagation cycle.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export class MCTS<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private root: MCTSNode<S, A> | null = null;
  private iterations: number;
  private cParam: number;
  private nodeCounter: number = 0;

  /**
   * Initializes a new MCTS instance.
   * @param problem - The problem to solve.
   * @param iterations - Total number of MCTS iterations to perform.
   * @param cParam - Exploration parameter (default: sqrt(2)).
   */
  constructor(problem: Problem<S, A>, iterations: number = 1000, cParam: number = 1.414) {
    super(problem);
    this.iterations = iterations;
    this.cParam = cParam;
    this.initialize();
  }

  /**
   * Initializes the search by creating the root MCTS node.
   */
  protected initialize(): void {
    this.nodeCounter = 0;
    this.root = new MCTSNode(
      this.problem.initialState,
      null,
      null,
      0,
      0,
      0,
      this.problem,
      `mcts-root-${this.nodeCounter++}`
    );
  }

  /**
   * Executes a single iteration of the MCTS algorithm.
   * 
   * @returns The node reached after expansion and simulation.
   */
  step(): SearchNode<S, A> | null {
    if (this.nodesExplored >= this.iterations) {
      this.status = SearchStatus.COMPLETED;
      return null;
    }

    // 1. Selection
    let node = this.root!;
    while (!this.problem.isGoal(node.state) && node.isFullyExpanded() && node.children.length > 0) {
      node = this.selectBestChild(node);
    }

    // 2. Expansion
    if (!this.problem.isGoal(node.state) && !node.isFullyExpanded()) {
      const action = node.untriedActions.pop()!;
      const nextState = this.problem.getResult(node.state, action);
      const child = new MCTSNode(
        nextState,
        node,
        action,
        0,
        0,
        node.depth + 1,
        this.problem,
        `mcts-node-${this.nodeCounter++}`
      );
      node.children.push(child);
      node = child;
    }

    // 3. Simulation (Rollout)
    let currentState = node.state;
    let depth = 0;
    while (!this.problem.isGoal(currentState) && depth < 50) {
      const actions = this.problem.getActions(currentState);
      if (actions.length === 0) break;
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      currentState = this.problem.getResult(currentState, randomAction);
      depth++;
    }

    const result = this.problem.getUtility ? this.problem.getUtility(currentState, 0) : 0;

    // 4. Backpropagation
    let tempNode: MCTSNode<S, A> | null = node;
    while (tempNode !== null) {
      tempNode.visits++;
      tempNode.value += result;
      tempNode = tempNode.parent;
    }

    this.nodesExplored++;
    return node;
  }

  /**
   * Selects the best child according to the UCB1 formula.
   * @param node - The parent node.
   * @returns {MCTSNode} The best child node.
   */
  private selectBestChild(node: MCTSNode<S, A>): MCTSNode<S, A> {
    const stateAny = node.state as any;
    let isMaxPlayer = true;
    if (stateAny.playerTurn !== undefined) {
      const maxPlayer = (this.problem as any).maxPlayer || 'X';
      isMaxPlayer = stateAny.playerTurn === maxPlayer;
    } else {
      isMaxPlayer = node.depth % 2 === 0;
    }

    const getUCB1 = (n: MCTSNode<S, A>) => {
      const exploitation = n.value / n.visits;
      const exploration = this.cParam * Math.sqrt(Math.log(node.visits) / n.visits);
      return isMaxPlayer ? exploitation + exploration : -exploitation + exploration;
    };

    return node.children.reduce((best, child) =>
      getUCB1(child) > getUCB1(best) ? child : best
    );
  }

  /**
   * Generates a visual tree structure from the MCTS data.
   * @returns {CustomTreeNode}
   */
  public getTree(): CustomTreeNode {
    const convert = (node: MCTSNode<S, A>): CustomTreeNode => {
      return {
        id: node.id,
        name: node.action ? node.action.name : 'Start',
        value: node.getScore(),
        boardState: (node.state as any).board || (node.state as any).boardState,
        children: node.children.map(child => convert(child)),
        visits: node.visits
      } as any;
    };

    return convert(this.root!);
  }

  /**
   * Gathers algorithm-specific attributes for the UI statistics display.
   * @returns A record of MCTS performance metrics.
   */
  public getAttributes(): Record<string, string | number | string[]> {
    if (!this.root) return {};
    return {
      "Total Iterations": `${this.nodesExplored} / ${this.iterations}`,
      "Root Visits": this.root.visits,
      "Root Value": this.root.value.toFixed(2),
      "Exploration Factor (C)": this.cParam.toFixed(3)
    };
  }
}

