export interface State {
  key: string; // Identificador único do estado para detecção de ciclos/transposição
  isTerminal: boolean;
}

export interface Action {
  name: string;
}

export interface Problem<S extends State, A extends Action> {
  initialState: S;
  getActions(state: S): A[];
  getResult(state: S, action: A): S;
  isGoal(state: S): boolean;
  getCost(state: S, action: A, nextState: S): number;
  getHeuristic(state: S): number; // h(n)
  getUtility?(state: S, player: number): number; // Para jogos adversariais
}

export interface SearchNode<S extends State, A extends Action> {
  state: S;
  parent: SearchNode<S, A> | null;
  action: A | null;
  pathCost: number; // g(n)
  heuristic: number; // h(n)
  depth: number;
  
  // f(n) = g(n) + h(n) (geralmente)
  getScore(): number;
}
