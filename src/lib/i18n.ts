import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "title": "Algorithm AI Lab",
      "subtitle": "Explore and visualize artificial intelligence algorithms.",
      "settings": "Settings",
      "algorithm": "Algorithm",
      "start_sim": "Start Simulation",
      "stop_sim": "Stop Simulation",
      "reset": "Reset",
      "stats": "Real-time Statistics",
      "nodes_explored": "Nodes Explored",
      "depth": "Depth",
      "visualization": "Visualization",
      "performance": "Performance Comparison",
      "step": "Step",
      "step_back": "Back",
      "fast_forward": "Fast Forward",
      "change_algo": "Change Algorithm",
      "search_placeholder": "Search algorithm...",
      "cat_all": "All",
      "cat_blind": "Blind",
      "cat_heuristic": "Heuristic",
      "cat_adversarial": "Adversarial",
      "footer_text": "© 2026 Algorithm AI Labs",
      "docs_link": "JSON Documentation",
      "graph_mode": "Graph Mode (Force-Directed)",
      "view_hint": "Tip: Switch between Tree and Graph views here!",
      "center_view": "Center View",
      "stats_hint": "Tip: Track the nodes the AI is processing in real-time here!",
      "follow_node": "Follow Active Node",
      "editor": {
        "title": "Tree Editor",
        "structure_title": "Search Structure",
        "badge": "Editor",
        "node_name": "Name",
        "heuristic": "Heur(h)",
        "cost": "Cost(g)",
        "is_goal": "Is Goal?",
        "utility": "Utility",
        "add_child": "Add Child",
        "remove_node": "Remove Node",
        "edit_node": "Edit Node",
        "config_board": "Configure Initial Board",
        "tictactoe_instr": "1. Select piece (X/O) or eraser. 2. Click on cell.",
        "8puzzle_instr": "Click on tiles adjacent to empty space to move them.",
        "clear_board": "Clear Board",
        "reset_positions": "Reset Positions",
        "tictactoe_hint": "Tip: In Tic-Tac-Toe, click on mini-board cells to toggle between X and O.",
        "move_prefix": "Move"
      },
      "docs": {
        "back": "Back to Lab",
        "title": "JSON Documentation",
        "intro": "Understand the data structure powering the visualization and algorithms of Algorithm AI Labs.",
        "node_struct_title": "Node Structure (CustomTreeNode)",
        "node_struct_desc": "The tree is composed of recursive nodes. Each node has properties defining both algorithm behavior and visualization.",
        "identifiers_title": "Identifiers and Names",
        "identifiers_desc": "The 'id' must be unique across the tree to avoid rendering bugs. The 'name' is used only for display.",
        "values_title": "Values and Heuristics",
        "values_desc": "The 'value' field is vital for algorithms like A* (heuristic h(n)) and Minimax (utility/score).",
        "problem_specifics": "Problem Specifics",
        "productivity_tip": "Productivity Tip",
        "productivity_desc": "You can copy the JSON directly from the JSON tab in the project editor, modify it, and paste it back to create complex structures quickly.",
        "footer": "Brandon Mejia — Developed with a focus on education and AI."
      }
    }
  },
  pt: {
    translation: {
      "title": "Laboratório de IA",
      "subtitle": "Explore e visualize algoritmos de inteligência artificial.",
      "settings": "Configurações",
      "algorithm": "Algoritmo",
      "start_sim": "Iniciar Simulação",
      "stop_sim": "Parar Simulação",
      "reset": "Resetar",
      "stats": "Estatísticas em Tempo Real",
      "nodes_explored": "Nós Explorados",
      "depth": "Profundidade",
      "visualization": "Visualização",
      "performance": "Comparativo de Desempenho",
      "step": "Passo",
      "step_back": "Voltar",
      "fast_forward": "Avançar Rápido",
      "change_algo": "Mudar Algoritmo",
      "search_placeholder": "Procurar algoritmo...",
      "cat_all": "Todos",
      "cat_blind": "Cega",
      "cat_heuristic": "Heurística",
      "cat_adversarial": "Adversarial",
      "footer_text": "© 2026 Algorithm AI Labs",
      "docs_link": "Documentação JSON",
      "graph_mode": "Modo Grafo (Force-Directed)",
      "view_hint": "Dica: Alterne entre vista de Árvore e Grafo aqui!",
      "center_view": "Centralizar Vista",
      "stats_hint": "Dica: Acompanhe aqui os nós que a IA está a processar em tempo real!",
      "follow_node": "Seguir Nó Ativo",
      "editor": {
        "title": "Editor de Árvore",
        "structure_title": "Estrutura da Busca",
        "badge": "Editor",
        "node_name": "Nome",
        "heuristic": "Heur(h)",
        "cost": "Custo(g)",
        "is_goal": "É Objetivo?",
        "utility": "Utilidade",
        "add_child": "Adicionar Filho",
        "remove_node": "Remover Nó",
        "edit_node": "Editar Nó",
        "config_board": "Configurar Tabuleiro Inicial",
        "tictactoe_instr": "1. Selecione a peça (X/O) ou a borracha. 2. Clique na célula.",
        "8puzzle_instr": "Clique nas peças adjacentes ao vazio para movê-las",
        "clear_board": "Limpar Tabuleiro",
        "reset_positions": "Resetar Posições",
        "tictactoe_hint": "Dica: No Tic-Tac-Toe, clique nas células do mini-tabuleiro para alternar entre X e O.",
        "move_prefix": "Movimento"
      },
      "docs": {
        "back": "Voltar para o Laboratório",
        "title": "Documentação JSON",
        "intro": "Compreenda a estrutura de dados que alimenta a visualização e os algoritmos do Algorithm AI Labs.",
        "node_struct_title": "Estrutura do Nó (CustomTreeNode)",
        "node_struct_desc": "A árvore é composta por nós recursivos. Cada nó possui propriedades que definem tanto o comportamento do algoritmo quanto a visualização.",
        "identifiers_title": "Identificadores e Nomes",
        "identifiers_desc": "O 'id' deve ser único em toda a árvore para evitar bugs de renderização. O 'name' é usado apenas para exibição.",
        "values_title": "Valores e Heurísticas",
        "values_desc": "O campo 'value' é vital para algoritmos como A* (heurística h(n)) e Minimax (valor de utilidade/score).",
        "problem_specifics": "Especificidades por Problema",
        "productivity_tip": "Dica de Produtividade",
        "productivity_desc": "Você pode copiar o JSON diretamente da aba JSON no editor do projeto, modificá-lo e colá-lo novamente para criar estruturas complexas rapidamente.",
        "footer": "Brandon Mejia — Desenvolvido com foco em educação e IA."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "pt", // idioma padrão
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
