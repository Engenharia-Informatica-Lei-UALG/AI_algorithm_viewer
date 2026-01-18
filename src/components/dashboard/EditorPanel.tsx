"use client"

import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { useGameStore, CustomTreeNode } from "@/store/gameStore"
import { TreeEditor } from "@/components/tree-editor/TreeEditor"
import { Save } from "lucide-react"

// Componente Tabs simplificado
function SimpleTabs({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex border-b mb-4 shrink-0">
        {(children as any[]).find((c: any) => c.type === SimpleTabsList)?.props.children.map((trigger: any) => (
          <button
            key={trigger.props.value}
            onClick={() => setActive(trigger.props.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active === trigger.props.value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {trigger.props.children}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {(children as any[]).map((child: any) => {
          if (child.type === SimpleTabsContent && child.props.value === active) {
            return child;
          }
          return null;
        })}
      </div>
    </div>
  )
}

function SimpleTabsList({ children }: { children: React.ReactNode }) { return <>{children}</> }
function SimpleTabsTrigger({ children, value }: { children: React.ReactNode, value: string }) { return <>{children}</> }
function SimpleTabsContent({ children, value }: { children: React.ReactNode, value: string }) { return <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</div> }

import { AlgorithmSelector } from "@/components/controls/AlgorithmSelector"

// ... imports anteriores

export function EditorPanel() {
  const { tree, updateTree, nodesExplored, depth } = useGameStore()
  const { t } = useTranslation()
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => {
    setJsonInput(JSON.stringify(tree, null, 2));
  }, [tree]);

  const handleLoadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.id && parsed.children) {
        updateTree(parsed as CustomTreeNode);
        alert("Árvore carregada com sucesso!");
      } else {
        alert("JSON inválido: Estrutura de árvore incorreta.");
      }
    } catch (e) {
      alert("Erro ao analisar JSON.");
    }
  };

  return (
    <section className="xl:col-span-3 flex flex-col h-full overflow-hidden">
      <SimpleTabs defaultValue="algo">
        <SimpleTabsList>
          <SimpleTabsTrigger value="algo">Algorithm</SimpleTabsTrigger>
          <SimpleTabsTrigger value="editor">Tree Editor</SimpleTabsTrigger>
          <SimpleTabsTrigger value="json">JSON</SimpleTabsTrigger>
          <SimpleTabsTrigger value="stats">Stats</SimpleTabsTrigger>
        </SimpleTabsList>

        <SimpleTabsContent value="algo">
          <div className="h-full overflow-y-auto pb-4">
            <h3 className="font-semibold mb-3">Select Algorithm</h3>
            <AlgorithmSelector />
          </div>
        </SimpleTabsContent>

        <SimpleTabsContent value="editor">
          <div className="h-full overflow-y-auto pb-20">
            <TreeEditor />
          </div>
        </SimpleTabsContent>

        <SimpleTabsContent value="json">
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
        </SimpleTabsContent>

        <SimpleTabsContent value="stats">
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
        </SimpleTabsContent>
      </SimpleTabs>
    </section>
  )
}
