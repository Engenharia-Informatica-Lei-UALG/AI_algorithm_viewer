import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/store/gameStore';

export class Minimax<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private maxDepth: number;
  private useAlphaBeta: boolean;
  private tree: CustomTreeNode | null = null;

  constructor(problem: Problem<S, A>, maxDepth: number = 10, useAlphaBeta: boolean = false) {
    super(problem);
    this.maxDepth = maxDepth;
    this.useAlphaBeta = useAlphaBeta;
    this.initialize();
  }

  protected initialize(): void {
    this.status = SearchStatus.RUNNING;
    this.nodesExplored = 0;
    this.tree = {
      id: this.problem.initialState.key,
      name: 'root',
      children: [],
      value: undefined,
      boardState: (this.problem.initialState as any).board,
    };
  }

  step(): SearchNode<S, A> | null {
    if (this.status !== SearchStatus.RUNNING) return null;

    // Minimax runs to completion in one "step"
    this.maxValue(this.problem.initialState, -Infinity, Infinity, 0, this.tree);
    this.status = SearchStatus.COMPLETED;
    return null; // Minimax doesn't return a single path node
  }

  private maxValue(state: S, alpha: number, beta: number, depth: number, visualNode: CustomTreeNode): number {
    this.nodesExplored++;
    if (depth >= this.maxDepth || this.problem.isGoal(state)) {
      const utility = this.problem.getUtility(state, 1);
      visualNode.value = utility;
      return utility;
    }

    let value = -Infinity;
    const actions = this.problem.getActions(state);

    for (const action of actions) {
      const nextState = this.problem.getResult(state, action);
      
      const childVisualNode: CustomTreeNode = {
        id: nextState.key,
        name: nextState.key,
        children: [],
        boardState: (nextState as any).board,
      };
      visualNode.children.push(childVisualNode);

      value = Math.max(value, this.minValue(nextState, alpha, beta, depth + 1, childVisualNode));
      
      if (this.useAlphaBeta) {
        if (value >= beta) {
          visualNode.value = value;
          return value; // Beta cutoff
        }
        alpha = Math.max(alpha, value);
      }
    }
    visualNode.value = value;
    return value;
  }

  private minValue(state: S, alpha: number, beta: number, depth: number, visualNode: CustomTreeNode): number {
    this.nodesExplored++;
    if (depth >= this.maxDepth || this.problem.isGoal(state)) {
      const utility = this.problem.getUtility(state, 1);
      visualNode.value = utility;
      return utility;
    }

    let value = Infinity;
    const actions = this.problem.getActions(state);

    for (const action of actions) {
      const nextState = this.problem.getResult(state, action);

      const childVisualNode: CustomTreeNode = {
        id: nextState.key,
        name: nextState.key,
        children: [],
        boardState: (nextState as any).board,
      };
      visualNode.children.push(childVisualNode);

      value = Math.min(value, this.maxValue(nextState, alpha, beta, depth + 1, childVisualNode));

      if (this.useAlphaBeta) {
        if (value <= alpha) {
          visualNode.value = value;
          return value; // Alpha cutoff
        }
        beta = Math.min(beta, value);
      }
    }
    visualNode.value = value;
    return value;
  }

  public getTree(): CustomTreeNode {
    return this.tree!;
  }
}
