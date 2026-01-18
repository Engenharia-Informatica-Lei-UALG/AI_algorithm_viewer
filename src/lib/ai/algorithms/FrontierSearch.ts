import { SearchAlgorithm, SearchStatus } from '../core/SearchAlgorithm';
import { Problem, SearchNode, State, Action } from '../core/types';
import { CustomTreeNode } from '@/store/gameStore';

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
type NodeComparator<S extends State, A extends Action> = (a: SearchNode<S, A>, b: SearchNode<S, A>) => number;

export class FrontierSearch<S extends State, A extends Action> extends SearchAlgorithm<S, A> {
  private frontier: SearchNode<S, A>[] = [];
  private explored: Set<string> = new Set();
  private comparator: NodeComparator<S, A> | null;
  private nodeMap: Map<string, CustomTreeNode> = new Map(); // Map to build the visual tree

  constructor(problem: Problem<S, A>, comparator: NodeComparator<S, A> | null = null) {
    super(problem);
    this.comparator = comparator;
    this.initialize();
  }

  protected initialize(): void {
    const rootState = this.problem.initialState;
    const rootNode = new NodeImpl<S, A>(
      rootState,
      null,
      null,
      0,
      this.problem.getHeuristic(rootState),
      0
    );
    this.frontier = [rootNode];
    this.explored.clear();
    this.nodeMap.clear();

    // Create the root of the visual tree
    const visualRoot: CustomTreeNode = {
      id: rootState.key,
      name: rootState.key,
      value: this.problem.getHeuristic(rootState),
      children: [],
      boardState: (rootState as any).board,
    };
    this.nodeMap.set(rootState.key, visualRoot);
  }

  step(): SearchNode<S, A> | null {
    if (this.frontier.length === 0) {
      this.status = SearchStatus.FAILED;
      return null;
    }

    if (this.comparator) {
      this.frontier.sort(this.comparator);
    }

    const node = this.frontier.shift()!;
    this.nodesExplored++;
    this.currentDepth = Math.max(this.currentDepth, node.depth);

    if (this.problem.isGoal(node.state)) {
      this.status = SearchStatus.COMPLETED;
      return node;
    }

    this.explored.add(node.state.key);

    const actions = this.problem.getActions(node.state);
    for (const action of actions) {
      const nextState = this.problem.getResult(node.state, action);

      if (!this.explored.has(nextState.key)) {
        const cost = node.pathCost + this.problem.getCost(node.state, action, nextState);
        const heuristic = this.problem.getHeuristic(nextState);

        const child = new NodeImpl<S, A>(
          nextState,
          node,
          action,
          cost,
          heuristic,
          node.depth + 1
        );

        // Add to visual tree
        const parentVisualNode = this.nodeMap.get(node.state.key);
        if (parentVisualNode) {
          const childVisualNode: CustomTreeNode = {
            id: nextState.key,
            name: nextState.key,
            value: heuristic,
            costToParent: this.problem.getCost(node.state, action, nextState),
            children: [],
            boardState: (nextState as any).board,
            isGoal: this.problem.isGoal(nextState),
          };
          parentVisualNode.children.push(childVisualNode);
          this.nodeMap.set(nextState.key, childVisualNode);
        }

        const existingIndex = this.frontier.findIndex(n => n.state.key === nextState.key);
        if (existingIndex !== -1) {
          if (this.comparator && this.comparator(child, this.frontier[existingIndex]) < 0) {
            this.frontier[existingIndex] = child;
          }
        } else {
          this.frontier.push(child);
        }
      }
    }

    return node;
  }

  public getTree(): CustomTreeNode {
    // The root is always the first node added to the map
    return this.nodeMap.get(this.problem.initialState.key)!;
  }

  static createBFS<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, null);
  }

  static createDFS<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => b.depth - a.depth);
  }

  static createAStar<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => a.getScore() - b.getScore());
  }

  static createUCS<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => a.pathCost - b.pathCost);
  }

  static createGreedy<S extends State, A extends Action>(problem: Problem<S, A>) {
    return new FrontierSearch(problem, (a, b) => a.heuristic - b.heuristic);
  }
}
