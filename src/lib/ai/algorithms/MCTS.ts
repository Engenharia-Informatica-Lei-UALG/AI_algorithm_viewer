import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';

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
  private cParam: number = 1.414; // Constante de exploração

  constructor(problem: Problem<S, A>, iterations: number = 1000) {
    super(problem);
    this.iterations = iterations;
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
    // UCB1
    return node.children.reduce((best, child) => {
      const ucb1 = (child.value / child.visits) + this.cParam * Math.sqrt(Math.log(node.visits) / child.visits);
      const bestUcb1 = (best.value / best.visits) + this.cParam * Math.sqrt(Math.log(node.visits) / best.visits);
      return ucb1 > bestUcb1 ? child : best;
    });
  }
}
