"use client"

import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { ImageAnalysisService } from "@/lib/ai/services/ImageAnalysisService"
import { useGameStore, AlgorithmType } from "@/store/gameStore"
import { Upload, Loader2, Key, Settings2, Copy, Check } from "lucide-react"

export function ImageUploadPanel() {
  const { t } = useTranslation()
  const { setProblemType, updateTree, setAlgorithm } = useGameStore()
  const [apiKey, setApiKey] = useState("")
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType | "">("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedJson, setGeneratedJson] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Carregar dados do localStorage ao montar
  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) setApiKey(storedKey);

    const storedJson = localStorage.getItem("last_analysis_json");
    if (storedJson) setGeneratedJson(storedJson);
  }, []);

  // Salvar API Key quando mudar
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem("gemini_api_key", newKey);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!apiKey) {
      setError("Por favor, insira sua API Key primeiro.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setGeneratedJson(null)

    try {
      const service = new ImageAnalysisService(apiKey)
      const result = await service.analyzeImage(file)

      if (result) {
        const jsonStr = JSON.stringify(result, null, 2);
        setGeneratedJson(jsonStr);
        localStorage.setItem("last_analysis_json", jsonStr);

        // 1. Configurar o Algoritmo se selecionado
        if (selectedAlgo) {
            setAlgorithm(selectedAlgo)
        }

        // 2. Configurar o Problema e a Árvore
        if (result.type === 'tictactoe') {
            setProblemType('tictactoe')
            setTimeout(() => {
                const rootNode = {
                    id: 'root',
                    name: 'Start',
                    children: [],
                    boardState: result.board
                };
                updateTree(rootNode);
            }, 100);
        } else if (result.type === '8puzzle') {
             setProblemType('8puzzle')
             setTimeout(() => {
                const rootNode = {
                    id: 'root',
                    name: 'Start',
                    children: [],
                    boardState: result.board
                };
                updateTree(rootNode);
             }, 100);
        } else if (result.type === 'custom') {
            setProblemType('custom')
            setTimeout(() => {
                updateTree(result.tree);
            }, 100);
        }
        
      } else {
        setError("Não foi possível identificar o problema na imagem.")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Ocorreu um erro durante a análise.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedJson) {
      navigator.clipboard.writeText(generatedJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* API Key Input */}
      <div className="flex items-center gap-2">
          <Key size={16} className="text-muted-foreground shrink-0" />
          <input 
              type="password" 
              placeholder="Sua API Key (Gemini/OpenAI)" 
              value={apiKey}
              onChange={handleApiKeyChange}
              className="flex-1 text-xs p-2 rounded border bg-background focus:ring-1 focus:ring-primary outline-none"
          />
      </div>

      {/* Algorithm Selector (Optional) */}
      <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-muted-foreground shrink-0" />
          <select 
            value={selectedAlgo || ""} 
            onChange={(e) => setSelectedAlgo(e.target.value as AlgorithmType)}
            className="flex-1 text-xs p-2 rounded border bg-background focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">(Opcional) Escolher Algoritmo...</option>
            <optgroup label="Busca Cega">
                <option value="bfs">Breadth-First Search (BFS)</option>
                <option value="dfs">Depth-First Search (DFS)</option>
                <option value="ids">Iterative Deepening (IDS)</option>
                <option value="ucs">Uniform Cost Search (UCS)</option>
            </optgroup>
            <optgroup label="Heurística">
                <option value="greedy">Greedy Best-First</option>
                <option value="astar">A* Search</option>
                <option value="idastar">IDA*</option>
            </optgroup>
            <optgroup label="Adversarial">
                <option value="minimax">Minimax</option>
                <option value="alpha-beta">Alpha-Beta Pruning</option>
                <option value="mcts">Monte Carlo Tree Search</option>
            </optgroup>
          </select>
      </div>

      {/* Upload Area */}
      <div className="relative min-h-[120px]">
          <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isAnalyzing || !apiKey}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <div className="absolute inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors bg-muted/10">
              {isAnalyzing ? (
                  <>
                      <Loader2 size={24} className="animate-spin text-primary" />
                      <span className="text-xs font-medium animate-pulse">Analisando imagem com IA...</span>
                  </>
              ) : (
                  <>
                      <Upload size={24} />
                      <span className="text-xs text-center px-4 font-medium">
                        Clique ou arraste uma imagem<br/>
                        <span className="text-[10px] opacity-70 font-normal">(Tic-Tac-Toe, 8-Puzzle, Grafos/Árvores)</span>
                      </span>
                  </>
              )}
          </div>
      </div>

      {/* JSON Result Area */}
      {generatedJson && (
        <div className="flex flex-col gap-1 flex-1 min-h-0">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Resultado JSON</span>
                <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copiado!" : "Copiar"}
                </button>
            </div>
            <div className="flex-1 bg-muted/50 rounded border p-2 overflow-auto">
                <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">
                    {generatedJson}
                </pre>
            </div>
            <p className="text-[10px] text-green-600 font-medium mt-1">
                ✓ Aplicado automaticamente ao visualizador.
            </p>
        </div>
      )}

      {error && (
          <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>
      )}
      
      {!generatedJson && (
        <p className="text-[10px] text-muted-foreground text-center opacity-70 mt-auto">
            Sua chave é usada apenas localmente e enviada diretamente para o Google.
        </p>
      )}
    </div>
  )
}
