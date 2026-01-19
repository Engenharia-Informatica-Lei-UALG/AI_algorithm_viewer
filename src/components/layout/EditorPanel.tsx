"use client"

import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { useGameStore } from "@/store/gameStore"
import { TreeEditor } from "@/components/editor/TreeEditor"
import { Save } from "lucide-react"
import { ImageUploadPanel } from "./ImageUploadPanel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { AlgorithmSelector } from "@/components/ui/AlgorithmSelector"
import { CustomTreeNode } from "@/types/game"

export function EditorPanel() {
  const { tree, updateTree, nodesExplored, depth, setProblemType } = useGameStore()
  const { t } = useTranslation()
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => {
    setJsonInput(JSON.stringify(tree, null, 2));
  }, [tree]);

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Caso 1: JSON direto da árvore (formato antigo/padrão)
      if (parsed.id && parsed.children) {
        updateTree(parsed as CustomTreeNode);
        alert("Árvore carregada com sucesso!");
        return;
      }

      // Caso 2: JSON gerado pela IA (com wrapper 'tree')
      if (parsed.tree && parsed.tree.id && parsed.tree.children) {
        if (parsed.type === 'custom') {
          setProblemType('custom');
          setTimeout(() => {
            updateTree(parsed.tree as CustomTreeNode);
          }, 50);
        } else {
          updateTree(parsed.tree as CustomTreeNode);
        }
        alert("Árvore importada da IA carregada com sucesso!");
        return;
      }

      alert("JSON inválido: Estrutura de árvore incorreta.");
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('nodes_explored')}</p>
                <p className="text-2xl font-mono font-bold">{nodesExplored}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('depth')}</p>
                <p className="text-2xl font-mono font-bold">{depth}</p>
              </div>
            </div>
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
