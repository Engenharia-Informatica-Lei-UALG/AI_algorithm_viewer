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
      "cat_adversarial": "Adversarial"
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
      "cat_adversarial": "Adversarial"
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
