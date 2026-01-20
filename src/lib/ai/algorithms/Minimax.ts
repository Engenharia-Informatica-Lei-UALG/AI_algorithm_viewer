import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

/**
 * Minimax algorithm implementation with optional Alpha-Beta Pruning.
 * Designed for adversarial games and decision-making visualizations.
 * Uses a Generator to allow step-by-step execution and state observation.
 * 
 * @template S - The type of State
 * @template A - The type of Action
 */
export class Minimax<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private maxDepth: number;
  private useAlphaBeta: boolean;
  private tree: CustomTreeNode | null = null;
  private iterator: Generator<SearchNode<S, A> | null, number, void> | null = null;

  /**
   * Initializes a new Minimax instance.
   * @param problem - The game/adversarial problem to solve.
   * @param maxDepth - Maximum search depth.
   * @param useAlphaBeta - Whether to enable Alpha-Beta pruning.
   */
  constructor(problem: Problem<S, A>, maxDepth: number = 3, useAlphaBeta: boolean = false) {
    super(problem);
    this.maxDepth = maxDepth;
    this.useAlphaBeta = useAlphaBeta;
    this.initialize();
  }

  /**
   * Initializes the search state and prepares the visual tree.
   * Sets up the iterator for step-by-step execution.
   */
  protected initialize(): void {
    this.status = SearchStatus.RUNNING;
    this.nodesExplored = 0;

    if ((this.problem as any).rootNode) {
      this.tree = structuredClone((this.problem as any).rootNode);
      this.cleanTree(this.tree!);
    } else {
      const initialState = this.problem.initialState as any;
      this.tree = {
        id: 'root',
        name: 'Start',
        children: [],
        value: undefined,
        boardState: initialState.board || initialState.boardState,
      };
    }

    this.iterator = this.minimaxGenerator(this.problem.initialState, -Infinity, Infinity, 0, this.tree!, 'root', 'root', true);
  }

  /**
   * Resets visualization-specific properties of a tree node.
   * @param node - The node to clean.
   */
  private cleanTree(node: CustomTreeNode) {
    delete node.alpha;
    delete node.beta;
    delete node.isPruned;
    delete node.isCutoffPoint;
    delete node.pruningTriggeredBy;
    delete node.isVisited;

    if (node.value === Infinity || node.value === -Infinity) {
      node.value = undefined;
    }

    if (node.children) {
      node.children.forEach(c => this.cleanTree(c));
    }
  }

  /**
   * Performs a single step of the Minimax execution.
   * Advances the generator and returns the current node of interest.
   * 
   * @returns The current SearchNode or null if completed.
   */
  step(): SearchNode<S, A> | null {
    if (this.status !== SearchStatus.RUNNING) return null;

    const result = this.iterator!.next();
    if (result.done) {
      this.status = SearchStatus.COMPLETED;
      return null;
    }
    return result.value;
  }

  /**
   * Generator function that implements the Minimax/Alpha-Beta search logic.
   * Yields search nodes at each critical point for UI observation.
   * 
   * @param state - Current state
   * @param alpha - Current alpha value
   * @param beta - Current beta value
   * @param depth - Current depth
   * @param visualNode - Current visual node representation
   * @param alphaId - Node ID where the current alpha originated
   * @param betaId - Node ID where the current beta originated
   * @param isMax - Whether the current level is Max or Min
   */
  private *minimaxGenerator(state: S, alpha: number, beta: number, depth: number, visualNode: CustomTreeNode, alphaId: string, betaId: string, isMax: boolean): Generator<SearchNode<S, A> | null, number, void> {
    this.nodesExplored++;

    if (this.useAlphaBeta) {
      visualNode.alpha = alpha;
      visualNode.beta = beta;
    }

    visualNode.isVisited = true;

    let value = isMax ? -Infinity : Infinity;
    visualNode.value = value;

    yield {
      state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any,
      depth,
      pathCost: 0,
      heuristic: 0,
      action: null,
      parent: null,
      getScore: () => 0
    };

    if (depth >= this.maxDepth || this.problem.isGoal(state)) {
      const utility = this.problem.getUtility ? this.problem.getUtility(state, 0) : 0;
      visualNode.value = utility;

      if (this.useAlphaBeta) {
        visualNode.alpha = utility;
        visualNode.beta = utility;
      }

      yield {
        state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any,
        depth,
        pathCost: 0,
        heuristic: 0,
        action: null,
        parent: null,
        getScore: () => 0
      };
      return utility;
    }

    const actions = this.problem.getActions(state);

    if (actions.length === 0) {
      const utility = this.problem.getUtility ? this.problem.getUtility(state, 0) : 0;
      visualNode.value = utility;
      if (this.useAlphaBeta) {
        visualNode.alpha = utility;
        visualNode.beta = utility;
      }
      yield {
        state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any,
        depth,
        pathCost: 0,
        heuristic: 0,
        action: null,
        parent: null,
        getScore: () => 0
      };
      return utility;
    }

    let currentAlphaId = alphaId;
    let currentBetaId = betaId;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const nextState = this.problem.getResult(state, action);
      const nextStateAny = nextState as any;

      const childId = nextStateAny.nodeId || `${visualNode.id}-${action.name.replace(/\s+/g, '_')}`;

      let childVisualNode = visualNode.children.find(c => c.id === childId || c.id === (nextStateAny.nodeId || ''));

      if (!childVisualNode) {
        childVisualNode = {
          id: childId,
          name: action.name,
          children: [],
          boardState: nextStateAny.board || nextStateAny.boardState,
          isVisited: false,
        };
        visualNode.children.push(childVisualNode);
      }

      const childValue: number = yield* this.minimaxGenerator(
        nextState,
        alpha,
        beta,
        depth + 1,
        childVisualNode!,
        currentAlphaId,
        currentBetaId,
        !isMax
      );

      if (isMax) {
        if (childValue > value) {
          value = childValue;
          visualNode.value = value;

          if (this.useAlphaBeta) {
            if (value > alpha) {
              alpha = value;
              visualNode.alpha = alpha;
              currentAlphaId = childVisualNode!.id;
            }
          }
          yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
        }
      } else {
        if (childValue < value) {
          value = childValue;
          visualNode.value = value;

          if (this.useAlphaBeta) {
            if (value < beta) {
              beta = value;
              visualNode.beta = beta;
              currentBetaId = childVisualNode!.id;
            }
          }
          yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
        }
      }

      if (this.useAlphaBeta) {
        if (isMax) {
          if (value >= beta) {
            this.handlePruning(state, visualNode, value, betaId, actions, i + 1);
            yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
            return value;
          }
        } else {
          if (value <= alpha) {
            this.handlePruning(state, visualNode, value, alphaId, actions, i + 1);
            yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
            return value;
          }
        }
      } else {
        yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
      }
    }
    visualNode.value = value;
    return value;
  }

  /**
   * Handles visual pruning of branches when a cutoff occurs.
   * 
   * @param state - The parent state
   * @param visualNode - The parent visual node
   * @param value - The cutoff value
   * @param triggerId - The ID of the node that triggered the pruning
   * @param actions - All possible actions from this state
   * @param startIndex - The index of the first action to be pruned
   */
  private handlePruning(state: S, visualNode: CustomTreeNode, value: number, triggerId: string, actions: A[], startIndex: number) {
    visualNode.value = value;
    visualNode.isCutoffPoint = true;
    visualNode.pruningTriggeredBy = triggerId;

    for (let j = startIndex; j < actions.length; j++) {
      const action = actions[j];
      const nextState = this.problem.getResult(state, action);
      const nextStateAny = nextState as any;

      const targetId = nextStateAny.nodeId || `${visualNode.id}-${action.name.replace(/\s+/g, '_')}`;

      const existingChild = visualNode.children.find(c =>
        c.id === targetId ||
        c.id === nextStateAny.nodeId ||
        c.name === action.name
      );

      if (existingChild) {
        existingChild.isPruned = true;
        existingChild.pruningTriggeredBy = triggerId;
      } else {
        const prunedId = `${visualNode.id}-${action.name.replace(/\s+/g, '_')}-pruned`;
        if (!visualNode.children.some(c => c.id === prunedId)) {
          visualNode.children.push({
            id: prunedId,
            name: action.name,
            children: [],
            isPruned: true,
            pruningTriggeredBy: triggerId,
            isVisited: false,
            boardState: undefined
          });
        }
      }
    }
  }

  /**
   * Returns the current visual tree representation.
   * @returns {CustomTreeNode}
   */
  public getTree(): CustomTreeNode {
    return structuredClone(this.tree!);
  }
}

