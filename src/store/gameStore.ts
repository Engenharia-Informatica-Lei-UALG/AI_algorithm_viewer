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
  boardState?: (string | null)[] | number[] | any; // Para TicTacToe ou 8-Puzzle
  alpha?: number;
  beta?: number;
  isPruned?: boolean; // Indica se este nó/ramo foi cortado
  pruningTriggeredBy?: string; // ID do nó cujo valor causou o corte
  isCutoffPoint?: boolean; // Indica se este foi o nó onde o loop parou

  // Propriedades visuais injetadas durante a renderização
  isVisited?: boolean;
  isCurrent?: boolean;
}

export interface SearchSettings {
  maxDepth: number;
  mctsIterations: number;
  mctsExploration: number;
  useAlphaBeta: boolean;
  heuristicType: 'default' | 'manhattan' | 'misplaced'; // Exemplo para 8-puzzle
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
  savedCustomTree: CustomTreeNode | null // Backup para quando mudar de tipo
  selectedNodeId: string | null

  // Configurações de Busca
  searchSettings: SearchSettings

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
  setSelectedNodeId: (id: string | null) => void
  updateSearchSettings: (settings: Partial<SearchSettings>) => void
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
  savedCustomTree: null,
  selectedNodeId: null,
  admissibilityViolations: [],
  goalState: [1, 2, 3, 4, 5, 6, 7, 8, 0],

  // Default settings
  maxNodeShape: 'triangle',
  minNodeShape: 'circle',
  nodeViewMode: 'shape',
  ticTacToeMaxPlayer: 'X',

  searchSettings: {
    maxDepth: 5,
    mctsIterations: 1000,
    mctsExploration: 1.414,
    useAlphaBeta: true,
    heuristicType: 'default',
  },

  setAlgorithm: (algo) => set((state) => {
    // Se estiver simulando, não permite mudar
    if (state.isSimulating) return state;
    
    // Apenas atualiza o algoritmo, mantendo a árvore intacta
    return { 
        algorithm: algo, 
        admissibilityViolations: [],
        // Resetamos apenas o progresso da simulação, não a árvore
        nodesExplored: 0,
        resetTrigger: state.resetTrigger + 1
    };
  }),

  setProblemType: (type) => set((state) => {
    if (state.isSimulating) return state;

    // Se estamos saindo de 'custom', salvamos a árvore atual
    let savedCustomTree = state.savedCustomTree;
    if (state.problemType === 'custom') {
        savedCustomTree = JSON.parse(JSON.stringify(state.tree));
    }

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
      // Se estamos voltando para 'custom' e temos um backup, restauramos
      if (savedCustomTree) {
        newTree = savedCustomTree;
      } else {
        newTree = { id: 'root', name: 'Start', children: [] };
      }
      newGoalState = null;
    }

    return {
      problemType: type,
      tree: newTree,
      savedCustomTree: savedCustomTree,
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

  updateSearchSettings: (settings) => set((state) => ({
    searchSettings: { ...state.searchSettings, ...settings }
  })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setMaxNodeShape: (shape) => set({ maxNodeShape: shape }),
  setMinNodeShape: (shape) => set({ minNodeShape: shape }),
  setNodeViewMode: (mode) => set({ nodeViewMode: mode }),

  setGoalState: (goal) => set((state) => {
    if (state.isSimulating) return state;
    return { goalState: goal };
  }),

  setTicTacToeMaxPlayer: (player) => set((state) => {
    if (state.isSimulating) return state;
    return { ticTacToeMaxPlayer: player };
  }),

  setAdmissibilityViolations: (ids) => set({ admissibilityViolations: ids }),

  updateTree: (newTree) => set((state) => {
    if (state.isSimulating) return state;
    return { tree: newTree };
  }),

  addNode: (parentId, newNode) => set((state) => {
    if (state.isSimulating) return state;

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
    if (state.isSimulating) return state;
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
    if (state.isSimulating) return state;

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
