# 🧠 Algorithm AI Labs

Um laboratório interativo para visualização e experimentação de algoritmos de Inteligência Artificial e Teoria dos Grafos. Construído com tecnologias modernas para proporcionar uma experiência de aprendizado fluida e visualmente atraente.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Bun](https://img.shields.io/badge/Bun-1.0-orange?style=flat-square&logo=bun)

<p align="center">
  <img src="assets/presentacion.gif" alt="Algorithm AI Labs Demo" width="800">
</p>

## ✨ Funcionalidades

- **Visualização Dinâmica:** Árvores de busca e grafos interativos com suporte a zoom e pan (Force-Directed Layout para grafos).
- **Editor de Estruturas em Tempo Real:** 
  - Adicione ou remova nós diretamente no gráfico ou no painel lateral.
  - Edite nomes, valores de heurística (`h`) e custos de arestas (`g`) com um clique.
  - Configure estados iniciais para problemas clássicos como Tic-Tac-Toe e 8-Puzzle.
  <p align="center">
    <img src="assets/edit_arvore.gif" alt="Editor de Árvores" width="600">
  </p>
  - **Importação Inteligente via IA:** Transforme desenhos de grafos ou tabuleiros em estruturas digitais interativas usando Visão Computacional (suporte a Gemini, OpenAI, Anthropic).
  <p align="center">
    <img src="assets/upload_exemplos.gif" alt="Importação via IA" width="600">
  </p>
- **Simulação Passo a Passo:** 
  - Controle total sobre a execução do algoritmo (Avançar, Voltar, Fast Forward).
  - Destaque visual do nó atual e do histórico de exploração.
  - **Foco Automático:** Acompanhamento automático do nó ativo durante a simulação.
  <p align="center">
    <img src="assets/iterative.gif" alt="Simulação Iterativa" width="600">
  </p>
- **Algoritmos Suportados:**
  - Busca Cega: BFS, DFS, UCS, IDS.
  - Busca Informada: A*, Greedy Search, IDA*.
  - Jogos/Adversários: Minimax, Alpha-Beta Pruning, MCTS.
  <p align="center">
    <img src="assets/minimax.gif" alt="Minimax Visualization" width="600">
  </p>
  <p align="center">
    <img src="assets/json.gif" alt="Data Structure Visualization" width="600">
  </p>
- **Análise de Heurística:** Verificação de admissibilidade em tempo real para problemas customizados, com destaque visual de violações.
- **Internacionalização (i18n):** Suporte completo para Inglês (EN) e Português (PT).

## 🏗️ Arquitetura e Modularidade

O projeto foi refatorado para seguir padrões modernos de desenvolvimento modular:

- **Tipagem Centralizada:** Todas as interfaces de domínio (`CustomTreeNode`, `AlgorithmType`, etc.) estão em `src/types/game.ts`, garantindo consistência em toda a aplicação.
- **Componentes de UI Encapsulados:** Implementação de componentes genéricos (como `Tabs`) para facilitar a reutilização e manter o código DRY.
- **Lógica de IA Desacoplada:** O núcleo de simulação utiliza interfaces abstratas (`Problem`, `State`, `Action`), permitindo a fácil adição de novos problemas sem alterar a visualização.

## 📂 Estrutura do Projeto

```text
src/
├── app/            # Rotas e layout principal do Next.js
├── components/     # Componentes React organizados por responsabilidade
│   ├── layout/     # Painéis principais e organização da página
│   ├── ui/         # Componentes de interface reutilizáveis
│   ├── editor/     # Lógica do editor de estruturas
│   ├── visualization/ # Renderização de árvores (Visx) e grafos (D3)
│   └── game/       # Visualizações específicas de jogos (Tabuleiros)
├── hooks/          # Hooks customizados (useSimulation, etc)
├── lib/            # Núcleo de IA (Algoritmos), Serviços (IA) e i18n
├── store/          # Gerenciamento de estado global (Zustand + Immer)
└── types/          # Definições de tipos centrais do projeto
```

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Visualização:** [@visx](https://airbnb.io/visx/) e [D3.js](https://d3js.org/) para gráficos de alta performance.
- **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) para um gerenciamento de estado leve e reativo.
- **Animações:** [Framer Motion](https://www.framer.com/motion/) para transições suaves.
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com temas modernos e profissionais.

## 🛠️ Instalação e Execução

1. Clone o repositório:
   ```bash
   git clone https://github.com/kanekitakitos/AI_algorithm_viewer.git
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
   ```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🙏 Agradecimentos

Este projeto foi inspirado e baseado na ideia original do repositório [minimax](https://github.com/lerneumann/minimax) de **lerneumann**.

## 👤 Autor

Desenvolvido por **Brandon Mejia**.

- **GitHub:** [@kanekitakitos](https://github.com/kanekitakitos)
- **Instagram:** [@brandonmejia4](https://www.instagram.com/brandonmejia4/)

## 📜 Licença

Este projeto está licenciado sob a **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**.

Sinta-se à vontade para:
- **Compartilhar:** Copiar e redistribuir o material em qualquer suporte ou formato.
- **Adaptar:** Remixar, transformar e criar a partir do material.

Sob as seguintes condições:
- **Atribuição:** Você deve dar o crédito apropriado e indicar se foram feitas alterações.
- **Não Comercial:** Você não pode usar o material para fins comerciais.
- **Compartilhamento pela mesma Licença:** Se você adaptar o material, deve distribuir suas contribuições sob a mesma licença que o original.

Para mais detalhes, consulte o arquivo [LICENSE](LICENSE).

---
© 2026 Algorithm AI Labs - Todos os direitos reservados.
