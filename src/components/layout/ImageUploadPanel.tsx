"use client"

import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import { ImageAnalysisService, LLMProvider } from "@/lib/ai/services/ImageAnalysisService"
import { useGameStore } from "@/store/gameStore"
import { CustomTreeNode, AlgorithmType } from "@/types/game"
import { Upload, Loader2, Key, Settings2, Copy, Check, Server, Box, Edit2, RotateCcw } from "lucide-react"

/**
 * Component for analyzing board images using LLM-based vision models.
 * Supports multiple providers (Google, OpenAI, Anthropic, Custom/Ollama) to extract
 * structured search problem data (Tic-Tac-Toe, 8-Puzzle, custom trees) from screenshots or photos.
 */
export function ImageUploadPanel() {
  const { t } = useTranslation()
  const { setProblemType, updateTree, setAlgorithm } = useGameStore()

  // Configuration State
  const [provider, setProvider] = useState<LLMProvider>('google')
  const [apiKey, setApiKey] = useState("")
  const [customBaseUrl, setCustomBaseUrl] = useState("")
  const [customModel, setCustomModel] = useState("")
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType | "">("")

  // Execution State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedJson, setGeneratedJson] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Prompt Configuration
  const [prompt, setPrompt] = useState("")
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)

  // Load persistence data from localStorage on mount
  useEffect(() => {
    const storedProvider = localStorage.getItem("llm_provider") as LLMProvider;
    if (storedProvider) setProvider(storedProvider);

    const storedKey = localStorage.getItem(`api_key_${storedProvider || 'google'}`);
    if (storedKey) setApiKey(storedKey);

    const storedBaseUrl = localStorage.getItem("custom_base_url");
    if (storedBaseUrl) setCustomBaseUrl(storedBaseUrl);

    const storedModel = localStorage.getItem("custom_model");
    if (storedModel) setCustomModel(storedModel);

    const storedJson = localStorage.getItem("last_analysis_json");
    if (storedJson) setGeneratedJson(storedJson);

    // Initialize with default standard prompt
    setPrompt(ImageAnalysisService.getPrompt());
  }, []);

  // Sync API Key when provider changes
  useEffect(() => {
    const storedKey = localStorage.getItem(`api_key_${provider}`);
    setApiKey(storedKey || "");
    localStorage.setItem("llm_provider", provider);
  }, [provider]);

  /** Persists the API key to localStorage for the specific provider. */
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem(`api_key_${provider}`, newKey);
  };

  /**
   * Processes the uploaded image using the selected LLM provider.
   * Maps the raw LLM output to internal problem structures (Tree, Tic-Tac-Toe, 8-Puzzle).
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!apiKey && provider !== 'custom') { // Custom providers might use local endpoints without keys.
      setError("Please enter your API Key.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setGeneratedJson(null)

    try {
      const service = new ImageAnalysisService({
        provider,
        apiKey,
        baseUrl: customBaseUrl,
        model: customModel
      })

      const result = await service.analyzeImage(file, prompt)

      if (result) {
        if (selectedAlgo) setAlgorithm(selectedAlgo)

        let finalTreeForDisplay: CustomTreeNode | any = result;
        const resultType = result.type ? result.type.toLowerCase().trim() : '';

        // Normalize structured output into game store format
        if (resultType === 'tictactoe') {
          setProblemType('tictactoe')
          // Handle variations in LLM response keys
          const boardData = (result as any).boardState || (result as any).board || Array(9).fill(null);

          finalTreeForDisplay = {
            id: 'root',
            name: 'Start',
            children: [],
            boardState: boardData
          };

          setTimeout(() => {
            updateTree(finalTreeForDisplay);
          }, 100);
        } else if (resultType === '8puzzle') {
          setProblemType('8puzzle')
          const boardData = (result as any).boardState || (result as any).board || [1, 2, 3, 4, 5, 6, 7, 8, 0];

          finalTreeForDisplay = {
            id: 'root',
            name: 'Start',
            children: [],
            boardState: boardData
          };

          setTimeout(() => {
            updateTree(finalTreeForDisplay);
          }, 100);
        } else if (resultType === 'custom') {
          setProblemType('custom')
          finalTreeForDisplay = (result as any).tree;
          setTimeout(() => {
            updateTree((result as any).tree);
          }, 100);
        }

        // Store for persistence and visibility
        const jsonStr = JSON.stringify(finalTreeForDisplay, null, 2);
        setGeneratedJson(jsonStr);
        localStorage.setItem("last_analysis_json", jsonStr);
      } else {
        setError("Could not identify the problem structure in the image.")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred during image analysis.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  /** Copies generated JSON result to clipboard. */
  const copyToClipboard = () => {
    if (generatedJson) {
      navigator.clipboard.writeText(generatedJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  /** Copies system prompt to clipboard. */
  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(prompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  /** Resets system prompt to the hardcoded default. */
  const resetPrompt = () => {
    setPrompt(ImageAnalysisService.getPrompt())
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">

      {/* Provider Selector */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        {(['google', 'openai', 'anthropic', 'custom'] as LLMProvider[]).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${provider === p
                ? "bg-background text-primary shadow-sm border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Configuration Fields */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-muted-foreground shrink-0" />
          <input
            type="password"
            placeholder={`API Key for ${provider.toUpperCase()}`}
            value={apiKey}
            onChange={handleApiKeyChange}
            className="flex-1 text-xs p-2 rounded border bg-background focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        {provider === 'custom' && (
          <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Base URL (e.g. http://localhost:11434/v1)"
                value={customBaseUrl}
                onChange={(e) => {
                  setCustomBaseUrl(e.target.value);
                  localStorage.setItem("custom_base_url", e.target.value);
                }}
                className="flex-1 text-xs p-2 rounded border bg-background focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Box size={16} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Model (e.g. llama3)"
                value={customModel}
                onChange={(e) => {
                  setCustomModel(e.target.value);
                  localStorage.setItem("custom_model", e.target.value);
                }}
                className="flex-1 text-xs p-2 rounded border bg-background focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Prompt Configuration */}
      <div className="border rounded-lg p-2 bg-card shadow-sm">
        <button
          onClick={() => setIsEditingPrompt(!isEditingPrompt)}
          className="flex items-center justify-between w-full text-xs font-medium hover:text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <Edit2 size={14} />
            <span>System Prompt</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isEditingPrompt ? "Hide" : "Edit"}
          </span>
        </button>

        {isEditingPrompt && (
          <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex justify-end gap-2">
              <button
                onClick={resetPrompt}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={12} /> Restore
              </button>
              <button
                onClick={copyPromptToClipboard}
                className="flex items-center gap-1 text-[10px] text-primary hover:underline transition-colors"
              >
                {promptCopied ? <Check size={12} /> : <Copy size={12} />}
                {promptCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 text-[11px] p-2 rounded border bg-background focus:ring-1 focus:ring-primary outline-none font-mono resize-y"
              placeholder="Enter the instruction for the AI..."
            />
          </div>
        )}
      </div>

      {/* Algorithm Selector */}
      <div className="flex items-center gap-2">
        <Settings2 size={16} className="text-muted-foreground shrink-0" />
        <select
          value={selectedAlgo || ""}
          onChange={(e) => setSelectedAlgo(e.target.value as AlgorithmType)}
          className="flex-1 text-xs p-2 rounded border bg-background focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">(Optional) Choose Algorithm...</option>
          <optgroup label="Uninformed Search">
            <option value="bfs">Breadth-First Search (BFS)</option>
            <option value="dfs">Depth-First Search (DFS)</option>
            <option value="ids">Iterative Deepening (IDS)</option>
            <option value="ucs">Uniform Cost Search (UCS)</option>
          </optgroup>
          <optgroup label="Heuristic Search">
            <option value="greedy">Greedy Best-First</option>
            <option value="astar">A* Search</option>
            <option value="idastar">IDA*</option>
          </optgroup>
          <optgroup label="Adversarial Search">
            <option value="minimax">Minimax</option>
            <option value="alpha-beta">Alpha-Beta Pruning</option>
            <option value="mcts">Monte Carlo Tree Search</option>
          </optgroup>
        </select>
      </div>

      {/* Upload Area */}
      <div className="relative min-h-[100px]">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isAnalyzing || (!apiKey && provider !== 'custom')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />
        <div className="absolute inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors bg-muted/10">
          {isAnalyzing ? (
            <>
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-xs font-medium animate-pulse">Analyzing with {provider.toUpperCase()}...</span>
            </>
          ) : (
            <>
              <Upload size={24} />
              <span className="text-xs text-center px-4 font-medium">
                Click or drag an image here<br />
                <span className="text-[10px] opacity-70 font-normal">(Tic-Tac-Toe, 8-Puzzle, Graphs)</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* JSON Result Area */}
      {generatedJson && (
        <div className="flex flex-col gap-1 flex-1 min-h-0">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">JSON Result</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex-1 bg-muted/50 rounded border p-2 overflow-auto max-h-[150px]">
            <pre className="text-[10px] font-mono whitespace-pre-wrap break-all">
              {generatedJson}
            </pre>
          </div>
          <p className="text-[10px] text-green-600 font-medium mt-1">
            ✓ Automatically applied.
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>
      )}
    </div>
  )
}
