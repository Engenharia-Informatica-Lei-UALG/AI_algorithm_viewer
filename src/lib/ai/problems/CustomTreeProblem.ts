import { Problem, State, Action } from '../core/types';
import { CustomTreeNode } from '@/store/gameStore';

export interface CustomTreeState extends State {
  nodeId: string;
  nodeRef: CustomTreeNode; // Referência direta ao nó da árvore
}

export interface CustomTreeAction extends Action {
  targetNodeId: string;
  cost: number;
}

export class CustomTreeProblem implements Problem<CustomTreeState, CustomTreeAction> {
  public initialState: CustomTreeState;
  private nodeMap: Map<string, CustomTreeNode>;

  constructor(rootNode: CustomTreeNode) {
    this.nodeMap = new Map();
    this.indexNodes(rootNode);

    this.initialState = {
      key: rootNode.id,
      isTerminal: this.isNodeGoal(rootNode),
      nodeId: rootNode.id,
      nodeRef: rootNode
    };
  }

  private indexNodes(node: CustomTreeNode) {
    this.nodeMap.set(node.id, node);
    for (const child of node.children) {
      this.indexNodes(child);
    }
  }

  private isNodeGoal(node: CustomTreeNode): boolean {
    // No editor, podemos adicionar uma flag 'isGoal', ou assumir folhas com valor alto?
    // Por enquanto, vamos assumir que o usuário marca explicitamente ou folhas específicas.
    // Vamos adicionar suporte a 'isGoal' na interface CustomTreeNode depois.
    return !!node.isGoal;
  }

  getActions(state: CustomTreeState): CustomTreeAction[] {
    const node = state.nodeRef;
    return node.children.map(child => ({
      name: `Go to ${child.name}`,
      targetNodeId: child.id,
      cost: child.costToParent || 1
    }));
  }

  getResult(state: CustomTreeState, action: CustomTreeAction): CustomTreeState {
    const nextNode = this.nodeMap.get(action.targetNodeId)!;
    return {
      key: nextNode.id,
      isTerminal: this.isNodeGoal(nextNode),
      nodeId: nextNode.id,
      nodeRef: nextNode
    };
  }

  isGoal(state: CustomTreeState): boolean {
    return state.isTerminal;
  }

  getCost(state: CustomTreeState, action: CustomTreeAction, nextState: CustomTreeState): number {
    return action.cost;
  }

  getHeuristic(state: CustomTreeState): number {
    return state.nodeRef.value || 0;
  }

  // Para Minimax
  getUtility(state: CustomTreeState, player: number): number {
    return state.nodeRef.value || 0;
  }
}
