import { create } from 'zustand'
import { produce } from 'immer'
import {
  AlgorithmType,
  ProblemType,
  NodeShape,
  NodeViewMode,
  CustomTreeNode,
  SearchSettings
} from '@/types/game'

interface GameState {
  algorithm: AlgorithmType
  problemType: ProblemType
  depth: number
  nodesExplored: number
  isSimulating: boolean
  resetTrigger: number
  followActiveNode: boolean

  // Configurações Visuais e de Jogo
  maxNodeShape: NodeShape
  minNodeShape: NodeShape
  nodeViewMode: NodeViewMode
  goalState: any | null
  ticTacToeMaxPlayer: 'X' | 'O'

  // IDs de nós que violam a admissibilidade
  admissibilityViolations: string[]

  // Estatísticas dinâmicas do algoritmo (ex: Lista de Abertos, Fechados, UCB)
  algorithmStats: Record<string, any>

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
  setFollowActiveNode: (val: boolean) => void

  // Ações de Configuração
  setMaxNodeShape: (shape: NodeShape) => void
  setMinNodeShape: (shape: NodeShape) => void
  setNodeViewMode: (mode: NodeViewMode) => void
  setGoalState: (state: any) => void
  setTicTacToeMaxPlayer: (player: 'X' | 'O') => void

  // Ações de Admissibilidade
  setAdmissibilityViolations: (ids: string[]) => void
  toggleAdmissibility: () => void

  setAlgorithmStats: (stats: Record<string, any>) => void
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

export const useGameStore = create<GameState>()((set) => ({
  algorithm: null,
  problemType: 'custom',
  depth: 0,
  nodesExplored: 0,
  isSimulating: false,
  resetTrigger: 0,
  followActiveNode: true,
  tree: initialTree,
  savedCustomTree: null,
  selectedNodeId: null,
  admissibilityViolations: [],
  algorithmStats: {},
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
    if (state.isSimulating) return state;
    return {
      algorithm: algo,
      admissibilityViolations: [],
      nodesExplored: 0,
      resetTrigger: state.resetTrigger + 1,
      algorithmStats: {}
    };
  }),

  setProblemType: (type) => set((state) => {
    if (state.isSimulating) return state;

    // Se o tipo for o mesmo, apenas garantimos que a simulação seja resetada
    // para aceitar novos dados (como um novo JSON colado)
    if (state.problemType === type) {
      return {
        nodesExplored: 0,
        depth: 0,
        isSimulating: false,
        resetTrigger: state.resetTrigger + 1,
        admissibilityViolations: [],
        algorithmStats: {}
      };
    }

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
    } else {
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
      algorithmStats: {}
    };
  }),

  setDepth: (depth) => set({ depth }),
  incrementNodes: () => set((state) => ({ nodesExplored: state.nodesExplored + 1 })),
  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),

  reset: () => set((state) => {
    // Se for um jogo, limpamos os filhos da árvore para voltar ao estado inicial do tabuleiro
    const cleanedTree = (state.problemType === 'tictactoe' || state.problemType === '8puzzle')
      ? { ...state.tree, children: [], value: undefined }
      : state.tree;

    return {
      tree: cleanedTree,
      depth: 0,
      nodesExplored: 0,
      isSimulating: false,
      resetTrigger: state.resetTrigger + 1,
      admissibilityViolations: [],
      algorithmStats: {},
      selectedNodeId: null
    };
  }),

  setFollowActiveNode: (val) => set({ followActiveNode: val }),

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

  setAlgorithmStats: (stats) => set({ algorithmStats: stats }),

  toggleAdmissibility: () => set((state) => {
    // Se já houver violações sendo exibidas, limpa (toggle off) para remover a animação
    if (state.admissibilityViolations.length > 0) {
      return { admissibilityViolations: [] };
    }

    // Caso contrário, calcula as violações
    const violations: string[] = [];
    const checkRecursive = (node: CustomTreeNode) => {
      if (!node.children) return;
      
      for (const child of node.children) {
        const hCurrent = node.value || 0;
        const hChild = child.value || 0;
        const cost = child.costToParent ?? 1; // Assume custo 1 se não definido, para evitar falsos positivos

        // Violação se a heurística do pai for maior que o custo real + heurística do filho
        if (hCurrent > cost + hChild) {
          if (!violations.includes(node.id)) {
            violations.push(node.id);
          }
        }
        checkRecursive(child);
      }
    };

    checkRecursive(state.tree);
    return { admissibilityViolations: violations };
  }),

  updateTree: (newTree) => set((state) => {
    if (state.isSimulating) return state;
    
    // Ao atualizar a árvore, se estivermos no modo custom, 
    // salvamos como o novo "estado mestre" para persistência na sessão
    return { 
      tree: newTree,
      savedCustomTree: state.problemType === 'custom' ? newTree : state.savedCustomTree
    };
  }),

  addNode: (parentId, newNode) => set((state) => {
    if (state.isSimulating) return state;

    return produce(state, (draft) => {
      const findAndAdd = (node: CustomTreeNode) => {
        if (node.id === parentId) {
          node.children.push(newNode);
          return true;
        }
        return node.children.some(findAndAdd);
      };
      findAndAdd(draft.tree);
    });
  }),

  removeNode: (nodeId) => set((state) => {
    if (state.isSimulating) return state;
    if (nodeId === 'root') return state;

    return produce(state, (draft) => {
      const removeRecursive = (node: CustomTreeNode) => {
        const index = node.children.findIndex(c => c.id === nodeId);
        if (index !== -1) {
          node.children.splice(index, 1);
          return true;
        }
        return node.children.some(removeRecursive);
      };
      removeRecursive(draft.tree);
    });
  }),

  updateNodeAttributes: (nodeId, attributes) => set((state) => {
    if (state.isSimulating) return state;

    return produce(state, (draft) => {
      const updateRecursive = (node: CustomTreeNode) => {
        if (node.id === nodeId) {
          Object.assign(node, attributes);
          return true;
        }
        return node.children.some(updateRecursive);
      };
      updateRecursive(draft.tree);
    });
  })
}))
