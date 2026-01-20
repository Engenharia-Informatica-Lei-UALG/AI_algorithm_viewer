import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

class MCTSNode<S extends State, A extends Action> implements SearchNode<S, A> {
  public visits: number = 0;
  public value: number = 0;
  public children: MCTSNode<S, A>[] = [];
  public untriedActions: A[];
  public id: string; // ID único para o nó MCTS

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

  getScore() { return this.value / (this.visits || 1); }

  isFullyExpanded(): boolean {
    return this.untriedActions.length === 0;
  }
}

export class MCTS<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private root: MCTSNode<S, A> | null = null;
  private iterations: number;
  private cParam: number;
  private nodeCounter: number = 0; // Contador global para IDs únicos

  constructor(problem: Problem<S, A>, iterations: number = 1000, cParam: number = 1.414) {
    super(problem);
    this.iterations = iterations;
    this.cParam = cParam;
    this.initialize();
  }

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
    while (!this.problem.isGoal(currentState) && depth < 50) { // Limite de profundidade para evitar loops infinitos
      const actions = this.problem.getActions(currentState);
      if (actions.length === 0) break;
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      currentState = this.problem.getResult(currentState, randomAction);
      depth++;
    }

    // Assumindo jogo de soma zero [-1, 1] ou [0, 1]
    // Precisamos de uma função de utilidade no problema
    const result = this.problem.getUtility ? this.problem.getUtility(currentState, 0) : 0;

    // 4. Backpropagation
    let tempNode: MCTSNode<S, A> | null = node;
    while (tempNode !== null) {
      tempNode.visits++;
      tempNode.value += result;
      tempNode = tempNode.parent;
    }

    this.nodesExplored++;
    return node; // Retorna o nó expandido/simulado
  }

  private selectBestChild(node: MCTSNode<S, A>): MCTSNode<S, A> {
    const stateAny = node.state as any;
    let isMaxPlayer = true;
    if (stateAny.playerTurn !== undefined) {
      const maxPlayer = (this.problem as any).maxPlayer || 'X';
      isMaxPlayer = stateAny.playerTurn === maxPlayer;
    } else {
      // Fallback for custom trees: assume alternation starting with Max at depth 0
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

  public getTree(): CustomTreeNode {
    const convert = (node: MCTSNode<S, A>): CustomTreeNode => {
      // Usamos o ID único gerado pelo MCTS para a visualização da árvore
      // Isso garante que mesmo estados repetidos (transposições) tenham nós visuais distintos na árvore
      return {
        id: node.id,
        name: node.action ? node.action.name : 'Start',
        value: node.getScore(),
        boardState: (node.state as any).board || (node.state as any).boardState,
        children: node.children.map(child => convert(child)),
        visits: node.visits // Opcional: para mostrar no tooltip
      } as any;
    };

    return convert(this.root!);
  }

  public getAttributes(): Record<string, string | number | string[]> {
    if (!this.root) return {};
    return {
      "Iterações Totais": `${this.nodesExplored} / ${this.iterations}`,
      "Visitas na Raiz": this.root.visits,
      "Valor da Raiz": this.root.value.toFixed(2),
      "Fator de Exploração (C)": this.cParam.toFixed(3)
    };
  }
}
