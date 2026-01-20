"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from 'react-i18next'
import { useGameStore } from "@/store/gameStore"
import { TreeEditor } from "@/components/editor/TreeEditor"
import { Save, TreePine, Gamepad2, Puzzle, Sparkles, List, Activity, X, GitGraph } from "lucide-react"
import { ImageUploadPanel } from "./ImageUploadPanel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { AlgorithmSelector } from "@/components/ui/AlgorithmSelector"
import { CustomTreeNode, ProblemType, AlgorithmType } from "@/types/game"
import { motion, AnimatePresence } from "framer-motion"

const JSON_EXAMPLES = {
  tree: {
    "id": "node-S",
    "name": "S",
    "value": 5,
    "isGoal": false,
    "children": [
      {
        "id": "node-A",
        "name": "A",
        "costToParent": 1,
        "value": 7,
        "isGoal": false,
        "children": [
          {
            "id": "node-D",
            "name": "D",
            "costToParent": 5,
            "value": 4,
            "isGoal": false,
            "children": [
              {
                "id": "node-H-from-D",
                "name": "H",
                "costToParent": 2,
                "value": 6,
                "isGoal": false,
                "children": [
                  {
                    "id": "node-J-from-H-D",
                    "name": "J",
                    "costToParent": 4,
                    "value": 8,
                    "isGoal": false,
                    "children": [
                      {
                        "id": "node-G2-from-J-H-D",
                        "name": "G2",
                        "costToParent": 2,
                        "value": 0,
                        "isGoal": true,
                        "children": []
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "node-B",
        "name": "B",
        "costToParent": 8,
        "value": 10,
        "isGoal": false,
        "children": [
          {
            "id": "node-G1-from-B",
            "name": "G1",
            "costToParent": 4,
            "value": 0,
            "isGoal": true,
            "children": []
          }
        ]
      }
    ]
  },
  tictactoe: {
    "type": "tictactoe",
    "id": "root",
    "name": "Start",
    "value": 0,
    "isGoal": false,
    "children": [],
    "boardState": [null, "X", "O", null, null, "O", "X", "O", "X"]
  },
  puzzle: {
    "type": "8puzzle",
    "id": "root",
    "name": "Start",
    "value": 0,
    "isGoal": false,
    "children": [
      { "type": "8puzzle", "id": "node-up", "name": "UP", "value": 0, "isGoal": false, "children": [], "boardState": [6, 0, 7, 8, 4, 1, 3, 5, 2] },
      { "type": "8puzzle", "id": "node-down", "name": "DOWN", "value": 0, "isGoal": false, "children": [], "boardState": [6, 4, 7, 8, 5, 1, 3, 0, 2] },
      { "type": "8puzzle", "id": "node-right", "name": "RIGHT", "value": 0, "isGoal": false, "children": [], "boardState": [6, 4, 7, 8, 1, 0, 3, 5, 2] },
      { "type": "8puzzle", "id": "node-left", "name": "LEFT", "value": 0, "isGoal": false, "children": [], "boardState": [6, 4, 7, 0, 8, 1, 3, 5, 2] }
    ],
    "boardState": [6, 4, 7, 8, 0, 1, 3, 5, 2]
  }
  ,
  minimax: {
    "type": "custom",
    "tree": {
      "id": "root",
      "name": "MAX",
      "value": 0,
      "isGoal": false,
      "children": [
        {
          "id": "L1-Min-1",
          "name": "MIN",
          "value": 0,
          "isGoal": false,
          "costToParent": 0,
          "children": [
            {
              "id": "L2-Max-1-1",
              "name": "MAX",
              "value": 0,
              "isGoal": false,
              "children": [
                { "id": "leaf-5-1", "name": "5", "value": 5, "isGoal": false, "children": [] },
                { "id": "leaf-n3-1", "name": "-3", "value": -3, "isGoal": false, "children": [] }
              ]
            },
            {
              "id": "L2-Max-1-2",
              "name": "MAX",
              "value": 0,
              "isGoal": false,
              "children": [
                { "id": "leaf-3-1", "name": "3", "value": 3, "isGoal": false, "children": [] },
                { "id": "leaf-2-1", "name": "2", "value": 2, "isGoal": false, "children": [] }
              ]
            }
          ]
        },
        {
          "id": "L1-Min-2",
          "name": "MIN",
          "value": 0,
          "isGoal": false,
          "costToParent": 0,
          "children": [
            {
              "id": "L2-Max-2-1",
              "name": "MAX",
              "value": 0,
              "isGoal": false,
              "children": [
                { "id": "leaf-2-2", "name": "2", "value": 2, "isGoal": false, "children": [] },
                { "id": "leaf-n5-1", "name": "-5", "value": -5, "isGoal": false, "children": [] }
              ]
            },
            {
              "id": "L2-Max-2-2",
              "name": "MAX",
              "value": 0,
              "isGoal": false,
              "children": [
                { "id": "leaf-0-3", "name": "0", "value": 0, "isGoal": false, "children": [] },
                { "id": "leaf-5-4", "name": "5", "value": 5, "isGoal": false, "children": [] }
              ]
            }
          ]
        }
      ]
    }
  }
};

// --- SUB-COMPONENT PARA A ABA DE STATS ---
function StatsTabContent() {
  const { t } = useTranslation();
  const { nodesExplored, depth, algorithmStats, algorithm, tree } = useGameStore();
  const [showHint, setShowHint] = useState(false);

  // Cálculos da estrutura
  const treeMetrics = useMemo(() => {
    let totalChildren = 0;
    let maxDepth = 0;
    const traverse = (node: CustomTreeNode, currentDepth: number) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      if (node.children) {
        totalChildren += node.children.length;
        node.children.forEach(child => traverse(child, currentDepth + 1));
      }
    };
    traverse(tree, 0);
    return { totalChildren, maxDepth };
  }, [tree]);

  // Verifica se deve mostrar a dica (apenas uma vez)
  useEffect(() => {
    const hasSeen = localStorage.getItem("has_seen_stats_hint");
    if (!hasSeen) {
      setShowHint(true);
    }
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem("has_seen_stats_hint", "true");
  };

  // Lista de algoritmos que usam Fronteira/Explorados
  const isSearchAlgo = algorithm && ['bfs', 'dfs', 'ids', 'ucs', 'greedy', 'astar', 'idastar'].includes(algorithm);

  // Prepara as estatísticas para exibição, garantindo que as listas apareçam para algoritmos de busca
  const displayStats = { ...algorithmStats };
  if (isSearchAlgo) {
    if (!displayStats["Lista Aberta (Frontier)"]) displayStats["Lista Aberta (Frontier)"] = ["(Aguardando simulação)"];
    if (!displayStats["Lista Fechada (Explored)"]) displayStats["Lista Fechada (Explored)"] = ["(Aguardando simulação)"];
  }

  return (
    <div className="space-y-4 relative h-full overflow-y-auto pb-10 pr-1 custom-scrollbar">
      <AnimatePresence>
        {showHint && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="bg-primary text-primary-foreground p-3 rounded-lg shadow-lg text-[11px] font-bold flex items-start gap-2 mb-2 border border-primary-foreground/20"
          >
            <Sparkles size={14} className="text-yellow-400 shrink-0 animate-pulse" />
            <p className="flex-1 leading-tight">{t('stats_hint') as string}</p>
            <button onClick={dismissHint} className="hover:bg-white/20 rounded p-0.5"><X size={12} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <h3 className="font-semibold">{t('stats')}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg border shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">{(t('nodes_explored') as string)}</p>
          <p className="text-2xl font-mono font-bold">{nodesExplored}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg border shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Prof. Simulação</p>
          <p className="text-2xl font-mono font-bold">{depth}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg border shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Prof. Máxima Real</p>
          <p className="text-2xl font-mono font-bold">{treeMetrics.maxDepth}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg border shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Total de Filhos</p>
          <p className="text-2xl font-mono font-bold">{treeMetrics.totalChildren}</p>
        </div>
      </div>

      {Object.keys(displayStats).length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Activity size={16} /> Detalhes da Execução
          </h4>
          <div className="space-y-2">
            {Object.entries(displayStats).map(([key, value]) => (
              <div key={key} className="bg-card border-2 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-3 py-1.5 border-b flex items-center gap-2">
                  <List size={12} className="text-primary" />
                  <span className="text-xs font-bold uppercase">{key}</span>
                </div>
                <div className="p-2">
                  {Array.isArray(value) && typeof value[0] === 'string' ? (
                    <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto custom-scrollbar p-1">
                      {value.map((item, i) => (
                        <span key={i} className="text-sm font-mono bg-muted/50 px-4 py-3 rounded border-l-4 border-l-primary truncate shadow-md hover:bg-muted transition-colors">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-base font-mono font-bold px-1">{(value as React.ReactNode)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function EditorPanel() {
  const { tree, updateTree, setProblemType } = useGameStore()
  const { t } = useTranslation()
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => {
    setJsonInput(JSON.stringify(tree, null, 2));
  }, [tree]);

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      let targetTree = parsed;
      let detectedType: ProblemType = 'custom';

      // Lógica de Detecção Inteligente
      if (parsed.tree && parsed.tree.id) {
        targetTree = parsed.tree;
        detectedType = parsed.type || 'custom';
      } else if (parsed.type === 'tictactoe' || parsed.type === '8puzzle') {
        detectedType = parsed.type;
      } else if (parsed.boardState && Array.isArray(parsed.boardState)) {
        // Fallback: detecta pelo conteúdo do boardState se o type estiver ausente
        const is8Puzzle = parsed.boardState.some((x: any) => typeof x === 'number');
        detectedType = is8Puzzle ? '8puzzle' : 'tictactoe';
      }

      // Aplica o tipo de problema (isso muda a visualização automaticamente)
      setProblemType(detectedType);

      // Pequeno delay para garantir que o store processou a mudança de tipo antes da árvore
      setTimeout(() => {
        updateTree(targetTree as CustomTreeNode);
      }, 50);

      alert(`Sucesso! Problema do tipo "${detectedType}" carregado.`);
    } catch (e) {
      alert("Erro ao analisar JSON.");
    }
  };

  return (
    <section className="flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="algo">
        <TabsList>
          <TabsTrigger value="algo">Algorithm</TabsTrigger>
          <TabsTrigger value="editor">Tree Editor</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="algo">
          <div className="h-full overflow-y-auto pb-4">
            <h3 className="font-semibold mb-3">Select Algorithm</h3>
            <AlgorithmSelector />
          </div>
        </TabsContent>

        <TabsContent value="editor">
          <div className="h-full overflow-y-auto pb-20">
            <TreeEditor />
          </div>
        </TabsContent>

        <TabsContent value="json">
          <div className="flex flex-col gap-2 h-full pb-4">
            <div className="flex flex-col gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Sparkles size={10} /> Exemplos Rápidos
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setJsonInput(JSON.stringify(JSON_EXAMPLES.tree, null, 2))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-muted hover:bg-accent rounded border text-[10px] font-bold transition-colors"
                >
                  <TreePine size={12} /> Árvore
                </button>
                <button 
                  onClick={() => setJsonInput(JSON.stringify(JSON_EXAMPLES.minimax, null, 2))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-muted hover:bg-accent rounded border text-[10px] font-bold transition-colors"
                >
                  <GitGraph size={12} /> Minimax
                </button>
                <button 
                  onClick={() => setJsonInput(JSON.stringify(JSON_EXAMPLES.tictactoe, null, 2))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-muted hover:bg-accent rounded border text-[10px] font-bold transition-colors"
                >
                  <Gamepad2 size={12} /> TicTacToe
                </button>
                <button 
                  onClick={() => setJsonInput(JSON.stringify(JSON_EXAMPLES.puzzle, null, 2))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-muted hover:bg-accent rounded border text-[10px] font-bold transition-colors"
                >
                  <Puzzle size={12} /> 8-Puzzle
                </button>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="flex-1 text-xs font-mono bg-muted p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Cole seu JSON de árvore aqui..."
            />
            <button
              onClick={handleLoadJson}
              className="flex items-center justify-center gap-2 w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shrink-0"
            >
              <Save size={16} />
              Carregar JSON
            </button>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <StatsTabContent />
        </TabsContent>

        <TabsContent value="upload">
          <div className="h-full overflow-y-auto pb-4">
            <ImageUploadPanel />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
