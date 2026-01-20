/**
 * Represents a state in the state space.
 */
export interface State {
  /** Unique identifier for the state, used for cycle detection and transposition tables. */
  key: string;
  /** Indicates if the state is a terminal state (end of search/game). */
  isTerminal: boolean;
}

/**
 * Represents an action that can be performed to transition between states.
 */
export interface Action {
  /** Human-readable name or identifier for the action. */
  name: string;
}

/**
 * Interface defining the structure of a Search Problem.
 * Follows the standard AI state-space search formulation.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export interface Problem<S extends State, A extends Action> {
  /** The starting point of the search. */
  initialState: S;
  /** Returns a list of valid actions from the given state. */
  getActions(state: S): A[];
  /** Returns the resulting state after applying an action to a state. */
  getResult(state: S, action: A): S;
  /** Checks if the given state satisfies the goal condition. */
  isGoal(state: S): boolean;
  /** Returns the step cost of performing an action from one state to another. */
  getCost(state: S, action: A, nextState: S): number;
  /** Returns the estimated cost from the given state to the goal (h(n)). */
  getHeuristic(state: S): number;
  /** Returns the utility value of a state for a specific player (used in adversarial games). */
  getUtility?(state: S, player: number): number;
}

/**
 * Represents a node in the search tree.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export interface SearchNode<S extends State, A extends Action> {
  /** The state associated with this node. */
  state: S;
  /** The parent node from which this node was generated. */
  parent: SearchNode<S, A> | null;
  /** The action taken to reach this node from the parent. */
  action: A | null;
  /** The accumulated path cost from the root to this node (g(n)). */
  pathCost: number;
  /** The estimated cost from this node to the goal (h(n)). */
  heuristic: number;
  /** The depth of the node in the search tree (root is depth 0). */
  depth: number;

  /**
   * Calculates the evaluation score for this node.
   * Typically f(n) = g(n) + h(n).
   * 
   * @returns The node's evaluation score.
   */
  getScore(): number;
}

