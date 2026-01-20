import { Problem, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

/**
 * State representation for a search on a custom-defined tree.
 */
export interface CustomTreeState extends State {
  /** Unique identifier for the node in the custom tree. */
  nodeId: string;
  /** Direct reference to the tree node data. */
  nodeRef: CustomTreeNode;
}

/**
 * Action representation for transitioning between nodes in a custom tree.
 */
export interface CustomTreeAction extends Action {
  /** The destination node ID. */
  targetNodeId: string;
  /** The edge cost to reach the target node. */
  cost: number;
}

/**
 * Problem implementation that operates on a user-defined tree structure.
 * This is used for visualizations where the user manually builds the search tree.
 */
export class CustomTreeProblem implements Problem<CustomTreeState, CustomTreeAction> {
  /** The starting point of the search. */
  public initialState: CustomTreeState;
  /** The original root of the tree, exposed for visualizers. */
  public rootNode: CustomTreeNode;
  /** Memoization map for quick node lookup by ID. */
  private nodeMap: Map<string, CustomTreeNode>;

  /**
   * Initializes a new CustomTreeProblem from a root node.
   * @param rootNode - The root of the custom tree.
   */
  constructor(rootNode: CustomTreeNode) {
    this.rootNode = rootNode;
    this.nodeMap = new Map();
    this.indexNodes(rootNode);

    this.initialState = {
      key: rootNode.id,
      isTerminal: this.isNodeGoal(rootNode),
      nodeId: rootNode.id,
      nodeRef: rootNode
    };
  }

  /**
   * Recursively indexes all nodes in the tree for O(1) retrieval.
   * @param node - The current node to index.
   */
  private indexNodes(node: CustomTreeNode) {
    this.nodeMap.set(node.id, node);
    for (const child of node.children) {
      this.indexNodes(child);
    }
  }

  /**
   * Checks if a given node is considered a goal state.
   * @param node - The node to check.
   * @returns {boolean}
   */
  private isNodeGoal(node: CustomTreeNode): boolean {
    return !!node.isGoal;
  }

  /**
   * Returns available actions (transitions to children) from the current state.
   * @param state - Current tree state.
   * @returns {CustomTreeAction[]} List of possible actions.
   */
  getActions(state: CustomTreeState): CustomTreeAction[] {
    const node = state.nodeRef;
    return node.children.map(child => ({
      name: `Go to ${child.name}`,
      targetNodeId: child.id,
      cost: child.costToParent || 1
    }));
  }

  /**
   * Calculates the resulting state after performing an action.
   * @param state - Current state.
   * @param action - Action to perform.
   * @returns {CustomTreeState} The new state.
   */
  getResult(state: CustomTreeState, action: CustomTreeAction): CustomTreeState {
    const nextNode = this.nodeMap.get(action.targetNodeId)!;
    return {
      key: nextNode.id,
      isTerminal: this.isNodeGoal(nextNode),
      nodeId: nextNode.id,
      nodeRef: nextNode
    };
  }

  /**
   * Determines if the current state satisfies the goal condition.
   * @param state - The state to check.
   * @returns {boolean}
   */
  isGoal(state: CustomTreeState): boolean {
    return state.isTerminal;
  }

  /**
   * Retrieves the cost of performing an action.
   * @param state - Current state.
   * @param action - Action performed.
   * @param nextState - Resulting state.
   * @returns {number}
   */
  getCost(state: CustomTreeState, action: CustomTreeAction, nextState: CustomTreeState): number {
    return action.cost;
  }

  /**
   * Provides the heuristic value (estimated cost to goal or node value).
   * @param state - Current state.
   * @returns {number} The node's stored value.
   */
  getHeuristic(state: CustomTreeState): number {
    return state.nodeRef.value || 0;
  }

  /**
   * Retrieves the utility value of the state for adversarial search.
   * @param state - Current state.
   * @param player - The player for whom to calculate utility.
   * @returns {number} The node's stored value.
   */
  getUtility(state: CustomTreeState, player: number): number {
    return state.nodeRef.value || 0;
  }
}

