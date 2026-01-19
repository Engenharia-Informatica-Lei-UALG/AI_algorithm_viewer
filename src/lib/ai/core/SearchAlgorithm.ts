import { Problem, SearchNode, State, Action } from './types';

export enum SearchStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export abstract class SearchAlgorithm<S extends State, A extends Action> {
  protected problem: Problem<S, A>;
  protected status: SearchStatus = SearchStatus.IDLE;
  protected nodesExplored: number = 0;
  protected currentDepth: number = 0;
  
  // Observadores para a UI
  protected onStep?: (node: SearchNode<S, A>) => void;

  constructor(problem: Problem<S, A>) {
    this.problem = problem;
  }

  // Método principal que deve ser implementado para avançar UM passo
  abstract step(): SearchNode<S, A> | null;

  // Executa até o fim
  run(): SearchNode<S, A> | null {
    this.status = SearchStatus.RUNNING;
    let result: SearchNode<S, A> | null = null;
    
    while (this.status === SearchStatus.RUNNING) {
      result = this.step();
      // The step can change the status to COMPLETED or FAILED.
      // If the status is no longer RUNNING, we should exit the loop.
      // The 'result' check is implicit in the status change.
      if (this.status !== SearchStatus.RUNNING) break;
    }
    
    return result;
  }

  getStatus(): SearchStatus {
    return this.status;
  }

  getMetrics() {
    return {
      nodesExplored: this.nodesExplored,
      currentDepth: this.currentDepth,
      status: this.status
    };
  }

  reset(): void {
    this.status = SearchStatus.IDLE;
    this.nodesExplored = 0;
    this.currentDepth = 0;
    this.initialize();
  }

  // Configuração inicial específica do algoritmo
  protected abstract initialize(): void;

  // Retorna estatísticas específicas do algoritmo para a UI (ex: Fronteira, Lista Fechada)
  public getAttributes(): Record<string, string | number | string[]> {
    return {};
  }
}
