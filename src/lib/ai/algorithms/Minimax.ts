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

    // Se o problema fornecer uma árvore (CustomTreeProblem), usamos a estrutura existente
    // para não "apagar" o que o usuário definiu.
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

    // Inicializa o gerador que controlará a execução passo-a-passo
    this.iterator = this.minimaxGenerator(this.problem.initialState, -Infinity, Infinity, 0, this.tree!, 'root', 'root', true);
  }

  private cleanTree(node: CustomTreeNode) {
    delete node.alpha;
    delete node.beta;
    delete node.isPruned;
    delete node.isCutoffPoint;
    delete node.pruningTriggeredBy;
    delete node.isVisited;

    // Se o valor for Infinity ou -Infinity (resquício de simulação anterior ou init),
    // limpamos para undefined, para não mostrar 'v:∞' antes de começar.
    if (node.value === Infinity || node.value === -Infinity) {
      node.value = undefined;
    }

    if (node.children) {
      node.children.forEach(c => this.cleanTree(c));
    }
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

    if (this.useAlphaBeta) {
      visualNode.alpha = alpha;
      visualNode.beta = beta;
    }

    visualNode.isVisited = true;

    // Inicializa o valor visual com o pior caso possível
    let value = isMax ? -Infinity : Infinity;
    visualNode.value = value;

    // Yield para visualização do nó atual sendo visitado
    // Usamos o ID visual como chave para garantir foco único na árvore
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
      // Em nós folha, alpha e beta tornam-se o próprio valor para visualização
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

    // Se não houver ações possíveis, tratamos como nó terminal (folha)
    // Isso resolve o problema de nós folhas não marcados como goal ficarem com valor Infinity
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

    // Variáveis para rastrear a origem do alpha/beta localmente
    let currentAlphaId = alphaId;
    let currentBetaId = betaId;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const nextState = this.problem.getResult(state, action);
      const nextStateAny = nextState as any;

      // Criar ID único. No modo custom, usamos o ID real do nó para manter a ligação.
      // Em jogos, usamos o caminho hierárquico.
      const childId = nextStateAny.nodeId || `${visualNode.id}-${action.name.replace(/\s+/g, '_')}`;

      // No modo custom, tentamos encontrar se o filho já existe na árvore base
      // para não duplicar ou apagar o que o usuário definiu.
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

      // Chamada recursiva via yield* para manter o controle do gerador
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
          // Yield de atualização (valor ou alpha)
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
          // Yield de atualização (valor ou beta)
          yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
        }
      }

      if (this.useAlphaBeta) {
        if (isMax) {
          if (value >= beta) {
            this.handlePruning(state, visualNode, value, betaId, actions, i + 1);
            yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
            return value; // Beta cutoff
          }
        } else {
          if (value <= alpha) {
            this.handlePruning(state, visualNode, value, alphaId, actions, i + 1);
            yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
            return value; // Alpha cutoff
          }
        }
      } else {
        // Se for minimax puro ou se o valor não melhorou, ainda assim retornamos o foco para o pai
        yield { state: { ...state, key: visualNode.id, nodeId: visualNode.id } as any, depth, pathCost: 0, heuristic: 0, action: null, parent: null, getScore: () => 0 };
      }
    }
    visualNode.value = value;
    return value;
  }

  private handlePruning(state: S, visualNode: CustomTreeNode, value: number, triggerId: string, actions: A[], startIndex: number) {
    visualNode.value = value;
    visualNode.isCutoffPoint = true;
    visualNode.pruningTriggeredBy = triggerId;

    for (let j = startIndex; j < actions.length; j++) {
      const action = actions[j];
      const nextState = this.problem.getResult(state, action);
      const nextStateAny = nextState as any;

      // Tenta encontrar o nó filho correspondente
      // Prioridade: ID explícito (custom) ou gerado (dinâmico)
      const targetId = nextStateAny.nodeId || `${visualNode.id}-${action.name.replace(/\s+/g, '_')}`;

      const existingChild = visualNode.children.find(c =>
        c.id === targetId ||
        c.id === nextStateAny.nodeId || // Fallback para ID direto
        c.name === action.name // Fallback final (menos seguro)
      );

      if (existingChild) {
        // Se o nó já existe, marcamos ele como podado
        existingChild.isPruned = true;
        existingChild.pruningTriggeredBy = triggerId;
      } else {
        // Se não existe (árvore dinâmica não expandida), criamos o nó fantasma
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

  public getTree(): CustomTreeNode {
    // Retornamos um clone profundo que preserva Infinity/-Infinity
    return structuredClone(this.tree!);
  }
}
