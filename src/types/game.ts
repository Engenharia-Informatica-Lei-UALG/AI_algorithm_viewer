/**
 * Supported search and adversarial algorithms.
 */
export type AlgorithmType =
    | 'bfs' | 'dfs' | 'ids' | 'ucs' | 'greedy' | 'astar' | 'idastar'
    | 'minimax' | 'alpha-beta' | 'mcts'
    | null;

/**
 * Supported problem domains for visualization.
 */
export type ProblemType = 'custom' | 'tictactoe' | '8puzzle';

/**
 * Geometric shapes for representing nodes in adversarial search trees.
 */
export type NodeShape = 'circle' | 'triangle' | 'square';

/**
 * visualization modes for nodes.
 */
export type NodeViewMode = 'shape' | 'game';

/**
 * Represents a node within the visualization tree.
 * Contains both domain-specific data (state, value) and 
 * simulation metadata (alpha/beta, visited status).
 */
export interface CustomTreeNode {
    /** Unique identifier for the node. */
    id: string;
    /** Human-readable name or label for the node. */
    name: string;
    /** Stored heuristic score (h) or utility value (v). */
    value?: number;
    /** List of child nodes. */
    children: CustomTreeNode[];
    /** Whether this node satisfies the goal condition. */
    isGoal?: boolean;
    /** The edge cost (g) from the parent node to this node. */
    costToParent?: number;
    /** serialized game state (e.g., board configuration) for games. */
    boardState?: (string | null)[] | number[] | any;
    /** Alpha value for Alpha-Beta pruning (Max's best score). */
    alpha?: number;
    /** Beta value for Alpha-Beta pruning (Min's best score). */
    beta?: number;
    /** Whether this branch has been pruned by the algorithm. */
    isPruned?: boolean;
    /** ID of the node whose value triggered the pruning of this branch. */
    pruningTriggeredBy?: string;
    /** Whether this node was the point where a search cutoff occurred. */
    isCutoffPoint?: boolean;

    /** Whether the algorithm has visited this node during the current step. */
    isVisited?: boolean;
    /** Whether this node is the current focus of the simulation. */
    isCurrent?: boolean;
}

/**
 * Configuration parameters for algorithm execution.
 */
export interface SearchSettings {
    /** Maximum depth reached by trees or depth-limited searches. */
    maxDepth: number;
    /** Number of simulation rollouts for MCTS. */
    mctsIterations: number;
    /** Exploration constant (C param) for UCB1 in MCTS. */
    mctsExploration: number;
    /** globally toggle Alpha-Beta pruning for Minimax. */
    useAlphaBeta: boolean;
    /** The heuristic function selected for specific problems. */
    heuristicType: 'default' | 'manhattan' | 'misplaced';
}

