# 🧠 Algorithm AI Labs

Um laboratório interativo para visualização e experimentação de algoritmos de Inteligência Artificial e Teoria dos Grafos. Construído com tecnologias modernas para proporcionar uma experiência de aprendizado fluida e visualmente atraente.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## ✨ Funcionalidades

- **Visualização Dinâmica:** Árvores de busca interativas com suporte a zoom e pan.
- **Editor de Árvore em Tempo Real:** 
  - Adicione ou remova nós diretamente no gráfico ou no painel lateral.
  - Edite nomes, valores de heurística (`h`) e custos de arestas (`g`) com um clique.
  - Marque nós como objetivos (`Goal`) com feedback visual animado.
- **Simulação Passo a Passo:** 
  - Controle total sobre a execução do algoritmo (Avançar, Voltar, Reset).
  - Destaque visual do nó atual (foco em roxo) e do histórico de exploração.
- **Algoritmos Suportados:**
  - Busca Cega: BFS, DFS, UCS.
  - Busca Informada: A*, Greedy Search.
  - Jogos/Adversários: Minimax, Alpha-Beta Pruning, MCTS.
- **Interface Moderna:** Suporte nativo a Modo Escuro/Claro e internacionalização (PT/EN).

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Visualização:** [@visx](https://airbnb.io/visx/) para renderização de alta performance de estruturas de dados.
- **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) para gerenciamento de estado leve e reativo.
- **Animações:** [Framer Motion](https://www.framer.com/motion/) para transições suaves e feedback interativo.
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com suporte a temas dinâmicos.
- **Ícones:** [Lucide React](https://lucide.dev/)

## 🛠️ Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone https://github.com/kanekitakitos/algorithm_ia.git
   ```

2. Instale as dependências:
   ```bash
   bun install
   # ou
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   bun dev
   # ou
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🙏 Agradecimentos

Este projeto foi inspirado e baseado na ideia original do repositório [minimax](https://github.com/lerneumann/minimax) de **lerneumann**. Um agradecimento especial por fornecer a base conceitual para esta ferramenta.

## 👤 Autor

Desenvolvido por **Brandon Mejia**.

- **GitHub:** [@kanekitakitos](https://github.com/kanekitakitos)
- **Instagram:** [@brandonmejia4](https://www.instagram.com/brandonmejia4/)

---
© 2026 Algorithm AI Labs
