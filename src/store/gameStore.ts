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

/**
 * Interface representing the global state of the application.
 * Manages configuration for algorithms, problem settings, tree structure, and simulation status.
 */
interface GameState {
  /** The currently selected search algorithm. */
  algorithm: AlgorithmType
  /** The type of problem being solved (Tic-Tac-Toe, 8-Puzzle, or Custom Tree). */
  problemType: ProblemType
  /** Current search depth (mostly used for visualization). */
  depth: number
  /** Number of nodes explored during the current simulation. */
  nodesExplored: number
  /** Whether the simulation is currently running. */
  isSimulating: boolean
  /** Trigger to force a reset of algorithm instances in hooks. */
  resetTrigger: number
  /** Whether the camera should follow the currently active node. */
  followActiveNode: boolean

  // Visual and Game Configurations
  /** Shape used for Max nodes in adversarial search. */
  maxNodeShape: NodeShape
  /** Shape used for Min nodes in adversarial search. */
  minNodeShape: NodeShape
  /** toggles between standard shapes and game-specific board previews. */
  nodeViewMode: NodeViewMode
  /** Target state for the 8-puzzle problem. */
  goalState: any | null
  /** The player perspective the AI optimizes for in Tic-Tac-Toe. */
  ticTacToeMaxPlayer: 'X' | 'O'

  /** List of node IDs that violate the consistency/admissibility heuristic rules. */
  admissibilityViolations: string[]

  /** Generic container for algorithm-specific metrics (e.g., Frontier size). */
  algorithmStats: Record<string, any>

  /** The root node of the current search tree or game state. */
  tree: CustomTreeNode
  /** Backup of the user's custom tree before simulation modifies values. */
  savedCustomTree: CustomTreeNode | null
  /** The ID of the currently selected node in the UI. */
  selectedNodeId: string | null

  /** Configuration parameters for the search execution. */
  searchSettings: SearchSettings

  setAlgorithm: (algo: AlgorithmType) => void
  setProblemType: (type: ProblemType) => void
  setDepth: (depth: number) => void
  incrementNodes: () => void
  toggleSimulation: () => void
  reset: () => void
  setFollowActiveNode: (val: boolean) => void

  // Configuration Actions
  setMaxNodeShape: (shape: NodeShape) => void
  setMinNodeShape: (shape: NodeShape) => void
  setNodeViewMode: (mode: NodeViewMode) => void
  setGoalState: (state: any) => void
  setTicTacToeMaxPlayer: (player: 'X' | 'O') => void

  // Utility Actions
  setAdmissibilityViolations: (ids: string[]) => void
  toggleAdmissibility: () => void

  setAlgorithmStats: (stats: Record<string, any>) => void

  // Tree Modification Actions
  updateTree: (newTree: CustomTreeNode, isSimulationUpdate?: boolean) => void
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

/**
 * Global store implementation using Zustand.
 * Provides a centralized state for algorithm simulation and UI control.
 */
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
      newTree = savedCustomTree ? savedCustomTree : { id: 'root', name: 'Start', children: [] };
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
    let baseTree = state.tree;
    if (state.problemType === 'custom' && state.savedCustomTree) {
      baseTree = JSON.parse(JSON.stringify(state.savedCustomTree));
    }

    /**
     * Helper to clear runtime-specific fields from node objects during reset.
     */
    const clearSimulationFields = (node: CustomTreeNode): CustomTreeNode => {
      const newNode = { ...node };
      delete newNode.isVisited;
      delete newNode.alpha;
      delete newNode.beta;
      delete newNode.isPruned;
      delete newNode.isCutoffPoint;
      delete newNode.pruningTriggeredBy;

      if (state.problemType === 'tictactoe' || state.problemType === '8puzzle') {
        newNode.children = [];
        delete newNode.value;
      } else {
        newNode.children = node.children.map(clearSimulationFields);
      }
      return newNode;
    };

    return {
      tree: clearSimulationFields(baseTree),
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

  /**
   * Identifies all nodes that violate search consistency rules (monotonicity).
   * A violation occurs if h(n) > cost(n, n') + h(n').
   */
  toggleAdmissibility: () => set((state) => {
    if (state.admissibilityViolations.length > 0) {
      return { admissibilityViolations: [] };
    }

    const violations: string[] = [];
    const checkRecursive = (node: CustomTreeNode) => {
      if (!node.children) return;

      for (const child of node.children) {
        const hCurrent = node.value || 0;
        const hChild = child.value || 0;
        const cost = child.costToParent ?? 1;

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

  /**
   * Updates the global tree structure. 
   * Protects original user configurations from being overwritten by simulation updates.
   */
  updateTree: (newTree, isSimulationUpdate = false) => set((state) => {
    const shouldReset = !isSimulationUpdate;

    const newSavedTree = (state.problemType === 'custom' && !isSimulationUpdate)
      ? newTree
      : state.savedCustomTree;

    return {
      tree: newTree,
      resetTrigger: shouldReset ? state.resetTrigger + 1 : state.resetTrigger,
      savedCustomTree: newSavedTree
    };
  }),

  /**
   * Adds a new child node to a specific parent in the tree.
   */
  addNode: (parentId, newNode) => set((state) => {
    if (state.isSimulating) return state;

    return produce(state, (draft) => {
      draft.resetTrigger += 1;
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

  /**
   * Removes a specific node and its entire subtree.
   */
  removeNode: (nodeId) => set((state) => {
    if (state.isSimulating) return state;
    if (nodeId === 'root') return state;

    return produce(state, (draft) => {
      draft.resetTrigger += 1;
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

  /**
   * Updates the properties (name, value, etc.) of a specific node.
   */
  updateNodeAttributes: (nodeId, attributes) => set((state) => {
    if (state.isSimulating) return state;

    return produce(state, (draft) => {
      draft.resetTrigger += 1;
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

