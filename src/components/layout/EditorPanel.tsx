"use client"

import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { useGameStore } from "@/store/gameStore"
import { TreeEditor } from "@/components/editor/TreeEditor"
import { Save, TreePine, Gamepad2, Puzzle, Sparkles, List, Activity } from "lucide-react"
import { ImageUploadPanel } from "./ImageUploadPanel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { AlgorithmSelector } from "@/components/ui/AlgorithmSelector"
import { CustomTreeNode, ProblemType } from "@/types/game"

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
};

export function EditorPanel() {
  const { tree, updateTree, nodesExplored, depth, setProblemType, algorithmStats } = useGameStore()
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
              <div className="flex gap-2">
                <button 
                  onClick={() => setJsonInput(JSON.stringify(JSON_EXAMPLES.tree, null, 2))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-muted hover:bg-accent rounded border text-[10px] font-bold transition-colors"
                >
                  <TreePine size={12} /> Árvore
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
          <div className="space-y-4">
            <h3 className="font-semibold">{t('stats')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{(t('nodes_explored') as string)}</p>
                <p className="text-2xl font-mono font-bold">{nodesExplored}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{(t('depth') as string)}</p>
                <p className="text-2xl font-mono font-bold">{depth}</p>
              </div>
            </div>

            {/* Estatísticas Dinâmicas do Algoritmo */}
            {Object.keys(algorithmStats).length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Activity size={14} /> Detalhes da Execução
                </h4>
                <div className="space-y-2">
                  {Object.entries(algorithmStats).map(([key, value]) => (
                    <div key={key} className="bg-card border rounded-lg overflow-hidden">
                      <div className="bg-muted/30 px-3 py-1.5 border-b flex items-center gap-2">
                        <List size={12} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase">{key}</span>
                      </div>
                      <div className="p-2">
                        {Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-1">
                            {value.map((item, i) => (
                              <span key={i} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border truncate max-w-full">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm font-mono font-medium">{(value as React.ReactNode)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
