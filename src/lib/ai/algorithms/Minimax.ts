import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

export class Minimax<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private maxDepth: number;
  private useAlphaBeta: boolean;
  private tree: CustomTreeNode | null = null;
  private iterator: Generator<SearchNode<S, A> | null, number, void> | null = null;

  constructor(problem: Problem<S, A>, maxDepth: number = 3, useAlphaBeta: boolean = false) {
    super(problem);
    this.maxDepth = maxDepth;
    this.useAlphaBeta = useAlphaBeta;
    this.initialize();
  }

  protected initialize(): void {
    this.status = SearchStatus.RUNNING;
    this.nodesExplored = 0;
    const initialState = this.problem.initialState as any;
    this.tree = {
      id: 'root',
      name: 'Start',
      children: [],
      value: undefined,
      boardState: initialState.board || initialState.boardState,
    };
    // Inicializa o gerador que controlará a execução passo-a-passo
    this.iterator = this.minimaxGenerator(this.problem.initialState, -Infinity, Infinity, 0, this.tree!, 'root', 'root', true);
  }

  step(): SearchNode<S, A> | null {
    if (this.status !== SearchStatus.RUNNING) return null;

    const result = this.iterator!.next();
    if (result.done) {
      this.status = SearchStatus.COMPLETED;
      return null;
    }
    return result.value;
  }

  private *minimaxGenerator(state: S, alpha: number, beta: number, depth: number, visualNode: CustomTreeNode, alphaId: string, betaId: string, isMax: boolean): Generator<SearchNode<S, A> | null, number, void> {
    this.nodesExplored++;
    visualNode.alpha = alpha;
    visualNode.beta = beta;

    // Yield para visualização do nó atual sendo visitado
    yield {
      state,
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
      visualNode.alpha = utility;
      visualNode.beta = utility;
      return utility;
    }

    let value = isMax ? -Infinity : Infinity;
    const actions = this.problem.getActions(state);
    
    // Variáveis para rastrear a origem do alpha/beta localmente
    let currentAlphaId = alphaId; 
    let currentBetaId = betaId;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const nextState = this.problem.getResult(state, action);
      const nextStateAny = nextState as any;
      
      const childVisualNode: CustomTreeNode = {
        id: `${visualNode.id}-${action.name}`,
        name: action.name,
        children: [],
        boardState: nextStateAny.board || nextStateAny.boardState,
      };
      visualNode.children.push(childVisualNode);

      // Chamada recursiva via yield* para manter o controle do gerador
      const childValue: number = yield* this.minimaxGenerator(
        nextState, 
        alpha, 
        beta, 
        depth + 1, 
        childVisualNode, 
        isMax ? currentAlphaId : alphaId, 
        isMax ? betaId : currentBetaId,
        !isMax
      );

      if (isMax) {
        if (childValue > value) {
          value = childValue;
          visualNode.alpha = value;
          currentAlphaId = visualNode.id; // Atualiza quem define o Alpha
        }
      } else {
        if (childValue < value) {
          value = childValue;
          visualNode.beta = value;
          currentBetaId = visualNode.id; // Atualiza quem define o Beta
        }
      }

      if (this.useAlphaBeta) {
        if (isMax) {
          if (value >= beta) {
            this.handlePruning(visualNode, value, betaId, actions, i + 1);
            return value; // Beta cutoff
          }
          alpha = Math.max(alpha, value);
          visualNode.alpha = alpha;
        } else {
          if (value <= alpha) {
            this.handlePruning(visualNode, value, alphaId, actions, i + 1);
            return value; // Alpha cutoff
          }
          beta = Math.min(beta, value);
          visualNode.beta = beta;
        }
      }
    }
    visualNode.value = value;
    return value;
  }

  private handlePruning(visualNode: CustomTreeNode, value: number, triggerId: string, actions: A[], startIndex: number) {
    visualNode.value = value;
    visualNode.isCutoffPoint = true;
    visualNode.pruningTriggeredBy = triggerId;

    for (let j = startIndex; j < actions.length; j++) {
      visualNode.children.push({
        id: `${visualNode.id}-${actions[j].name}-pruned`,
        name: actions[j].name,
        children: [],
        isPruned: true,
        pruningTriggeredBy: triggerId
      });
    }
  }

  public getTree(): CustomTreeNode {
    return this.tree!;
  }
}
