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
    heuristicType: 'default' | 'manhattan' | 'misplaced';
}
