import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/types/game';

class NodeImpl<S extends State, A extends Action> implements SearchNode<S, A> {
  constructor(
    public state: S,
    public parent: SearchNode<S, A> | null,
    public action: A | null,
    public pathCost: number,
    public heuristic: number,
    public depth: number
  ) { }

  getScore(): number {
    return this.pathCost + this.heuristic;
  }
}

export class IDAStar<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private threshold: number = 0;
  private nextThreshold: number = Infinity;
  private stack: SearchNode<S, A>[] = [];
  private visualRoot: CustomTreeNode | null = null;
  private visualNodeMap: Map<SearchNode<S, A>, CustomTreeNode> = new Map();
  private maxIterations: number;

  constructor(problem: Problem<S, A>, maxIterations: number = 5000) {
    super(problem);
    this.maxIterations = maxIterations;
    this.initialize();
  }

  protected initialize(): void {
    this.nodesExplored = 0;
    this.status = SearchStatus.RUNNING;
    // Inicializa o threshold com a heurística do estado inicial
    this.threshold = this.problem.getHeuristic(this.problem.initialState);
    this.prepareIteration();
  }

  private prepareIteration(): void {
    const rootState = this.problem.initialState;
    const h = this.problem.getHeuristic(rootState);
    
    // CORREÇÃO: Passar a heurística real (h), não o threshold
    const rootNode = new NodeImpl<S, A>(
      rootState, 
      null, 
      null, 
      0, 
      h, 
      0
    );
    this.stack = [rootNode];
    this.nextThreshold = Infinity;

    this.visualRoot = {
      id: `idastar-t${this.threshold}-root`,
      name: `Start (f-limit ${this.threshold})`,
      children: [],
      boardState: (rootState as any).board,
    };
    this.visualNodeMap.clear();
    this.visualNodeMap.set(rootNode, this.visualRoot);
  }

  step(): SearchNode<S, A> | null {
    if (this.status !== SearchStatus.RUNNING) return null;

    if (this.nodesExplored >= this.maxIterations) {
      this.status = SearchStatus.FAILED;
      return null;
    }

    if (this.stack.length === 0) {
      if (this.nextThreshold === Infinity) {
        this.status = SearchStatus.FAILED;
        return null;
      }
      this.threshold = this.nextThreshold;
      this.prepareIteration();
      return null;
    }

    const node = this.stack.pop()!;
    const f = node.getScore();

    if (f > this.threshold) {
      this.nextThreshold = Math.min(this.nextThreshold, f);
      // Retorna null para indicar que este nó não foi expandido nesta iteração (corte)
      // Ou retorna o nó mas não expande seus filhos
      return node; 
    }

    this.nodesExplored++;
    this.currentDepth = Math.max(this.currentDepth, node.depth);

    if (this.problem.isGoal(node.state)) {
      this.status = SearchStatus.COMPLETED;
      return node;
    }

    const actions = this.problem.getActions(node.state);
    // Ordem inversa para simular DFS corretamente na pilha
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      const nextState = this.problem.getResult(node.state, action);
      const h = this.problem.getHeuristic(nextState);
      const g = node.pathCost + this.problem.getCost(node.state, action, nextState);
      
      const child = new NodeImpl<S, A>(nextState, node, action, g, h, node.depth + 1);
      this.stack.push(child);

      const parentVisual = this.visualNodeMap.get(node);
      if (parentVisual) {
        const childVisual: CustomTreeNode = {
          id: `${parentVisual.id}-${action.name}`,
          name: action.name,
          value: h,
          costToParent: this.problem.getCost(node.state, action, nextState),
          children: [],
          boardState: (nextState as any).board,
          isGoal: this.problem.isGoal(nextState)
        };
        parentVisual.children.push(childVisual);
        this.visualNodeMap.set(child, childVisual);
      }
    }

    return node;
  }

  public getTree(): CustomTreeNode {
    return this.visualRoot!;
  }
}
