import { create } from 'zustand'

export type AlgorithmType =
  | 'bfs' | 'dfs' | 'ids' | 'ucs' | 'greedy' | 'astar' | 'idastar'
  | 'minimax' | 'alpha-beta' | 'mcts'
  | null;

export type ProblemType = 'custom' | 'tictactoe' | '8puzzle';

export type NodeShape = 'circle' | 'triangle' | 'square';

export type NodeViewMode = 'shape' | 'game';

export interface CustomTreeNode {
  id: string;
  name: string;
  value?: number; // Heurística ou Utilidade
  children: CustomTreeNode[];
  isGoal?: boolean;
  costToParent?: number; // Custo da aresta
  boardState?: any; // Para TicTacToe ou 8-Puzzle
}

interface GameState {
  algorithm: AlgorithmType
  problemType: ProblemType
  depth: number
  nodesExplored: number
  isSimulating: boolean
  resetTrigger: number

  // Configurações Visuais e de Jogo
  maxNodeShape: NodeShape
  minNodeShape: NodeShape
  nodeViewMode: NodeViewMode
  goalState: any | null
  ticTacToeMaxPlayer: 'X' | 'O'

  // IDs de nós que violam a admissibilidade
  admissibilityViolations: string[]

  // Estado da Árvore Customizada
  tree: CustomTreeNode

  setAlgorithm: (algo: AlgorithmType) => void
  setProblemType: (type: ProblemType) => void
  setDepth: (depth: number) => void
  incrementNodes: () => void
  toggleSimulation: () => void
  reset: () => void
  
  // Ações de Configuração
  setMaxNodeShape: (shape: NodeShape) => void
  setMinNodeShape: (shape: NodeShape) => void
  setNodeViewMode: (mode: NodeViewMode) => void
  setGoalState: (state: any) => void
  setTicTacToeMaxPlayer: (player: 'X' | 'O') => void

  // Ações de Admissibilidade
  setAdmissibilityViolations: (ids: string[]) => void

  // Ações de Edição da Árvore
  updateTree: (newTree: CustomTreeNode) => void
  addNode: (parentId: string, node: CustomTreeNode) => void
  removeNode: (nodeId: string) => void
  updateNodeAttributes: (nodeId: string, attributes: Partial<CustomTreeNode>) => void
  setNodesExplored: (count: number) => void
}

const initialTree: CustomTreeNode = {
  id: 'root',
  name: 'Start',
  children: [],
};

export const useGameStore = create<GameState>((set) => ({
  algorithm: null,
  problemType: 'custom',
  depth: 0,
  nodesExplored: 0,
  isSimulating: false,
  resetTrigger: 0,
  tree: initialTree,
  admissibilityViolations: [],
  goalState: [1, 2, 3, 4, 5, 6, 7, 8, 0],

  // Default settings
  maxNodeShape: 'triangle',
  minNodeShape: 'circle',
  nodeViewMode: 'shape',
  ticTacToeMaxPlayer: 'X',

  setAlgorithm: (algo) => set({ algorithm: algo, admissibilityViolations: [] }),
  
  setProblemType: (type) => set((state) => {
    const newNodeViewMode = type === 'custom' ? 'shape' : 'game';
    let newTree: CustomTreeNode;
    let newGoalState: any;

    if (type === 'tictactoe') {
      newTree = { id: 'root', name: 'Start', children: [], boardState: Array(9).fill(null) };
      newGoalState = null;
    } else if (type === '8puzzle') {
      newTree = { id: 'root', name: 'Start', children: [], boardState: [1, 2, 3, 4, 5, 6, 7, 8, 0] };
      newGoalState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    } else { // custom
      newTree = { id: 'root', name: 'Start', children: [] };
      newGoalState = null;
    }

    return { 
      problemType: type, 
      tree: newTree,
      resetTrigger: state.resetTrigger + 1, 
      goalState: newGoalState,
      nodeViewMode: newNodeViewMode,
      admissibilityViolations: [],
      nodesExplored: 0,
      isSimulating: false,
    };
  }),

  setDepth: (depth) => set({ depth }),
  incrementNodes: () => set((state) => ({ nodesExplored: state.nodesExplored + 1 })),
  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),
  
  reset: () => set((state) => ({ 
    depth: 0, 
    nodesExplored: 0, 
    isSimulating: false,
    resetTrigger: state.resetTrigger + 1,
    admissibilityViolations: []
  })),
  
  setNodesExplored: (count) => set({ nodesExplored: count }),

  setMaxNodeShape: (shape) => set({ maxNodeShape: shape }),
  setMinNodeShape: (shape) => set({ minNodeShape: shape }),
  setNodeViewMode: (mode) => set({ nodeViewMode: mode }),
  setGoalState: (state) => set({ goalState: state }),
  setTicTacToeMaxPlayer: (player) => set({ ticTacToeMaxPlayer: player }),

  setAdmissibilityViolations: (ids) => set({ admissibilityViolations: ids }),

  updateTree: (newTree) => set({ tree: newTree }),

  addNode: (parentId, newNode) => set((state) => {
    const newTree = JSON.parse(JSON.stringify(state.tree));
    const addRecursive = (node: CustomTreeNode) => {
      if (node.id === parentId) {
        node.children.push(newNode);
        return true;
      }
      for (const child of node.children) {
        if (addRecursive(child)) return true;
      }
      return false;
    };
    addRecursive(newTree);
    return { tree: newTree };
  }),

  removeNode: (nodeId) => set((state) => {
    if (nodeId === 'root') return state;
    const newTree = JSON.parse(JSON.stringify(state.tree));
    const removeRecursive = (node: CustomTreeNode) => {
      const index = node.children.findIndex(c => c.id === nodeId);
      if (index !== -1) {
        node.children.splice(index, 1);
        return true;
      }
      for (const child of node.children) {
        if (removeRecursive(child)) return true;
      }
      return false;
    };
    removeRecursive(newTree);
    return { tree: newTree };
  }),

  updateNodeAttributes: (nodeId, attributes) => set((state) => {
    const newTree = JSON.parse(JSON.stringify(state.tree));
    const updateRecursive = (node: CustomTreeNode) => {
      if (node.id === nodeId) {
        Object.assign(node, attributes);
        return true;
      }
      for (const child of node.children) {
        if (updateRecursive(child)) return true;
      }
      return false;
    };
    updateRecursive(newTree);
    return { tree: newTree };
  })
}))
