import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

class MCTSNode<S extends State, A extends Action> implements SearchNode<S, A> {
  public visits: number = 0;
  public value: number = 0;
  public children: MCTSNode<S, A>[] = [];
  public untriedActions: A[];

  constructor(
    public state: S,
    public parent: MCTSNode<S, A> | null,
    public action: A | null,
    public pathCost: number,
    public heuristic: number,
    public depth: number,
    problem: Problem<S, A>
  ) {
    this.untriedActions = problem.getActions(state);
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

  constructor(problem: Problem<S, A>, iterations: number = 1000, cParam: number = 1.414) {
    super(problem);
    this.iterations = iterations;
    this.cParam = cParam;
    this.initialize();
  }

  protected initialize(): void {
    this.root = new MCTSNode(
      this.problem.initialState,
      null,
      null,
      0,
      0,
      0,
      this.problem
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
        this.problem
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
    const isMaxPlayer = (node.state as any).playerTurn === ((this.problem as any).maxPlayer || 'X');
    
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
    const convert = (node: MCTSNode<S, A>, id: string): CustomTreeNode => {
      return {
        id,
        name: node.action ? node.action.name : 'Start',
        value: node.getScore(),
        boardState: (node.state as any).board,
        children: node.children.map((child, i) => 
          convert(child, `${id}-${i}`)
        ),
        visits: node.visits // Opcional: para mostrar no tooltip
      } as any;
    };

    return convert(this.root!, 'root');
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
