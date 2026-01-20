import { GoogleGenerativeAI, InlineDataPart } from "@google/generative-ai";
import { TicTacToe } from '../problems/TicTacToe';
import { EightPuzzle } from '../problems/EightPuzzle';
import { CustomTreeNode } from '@/types/game';

/**
 * Represents the recognized state from an image analysis.
 */
type DetectedState =
  | { type: 'tictactoe'; boardState: (string | null)[]; id: string; name: string; children: any[]; value: number; isGoal: boolean }
  | { type: '8puzzle'; boardState: number[]; id: string; name: string; children: any[]; value: number; isGoal: boolean }
  | { type: 'custom'; tree: CustomTreeNode }
  | null;

/**
 * Supported LLM providers for image analysis.
 */
export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'custom';

/**
 * Configuration structure for AI service providers.
 */
interface AnalysisConfig {
  /** The AI service provider name. */
  provider: LLMProvider;
  /** API key for authentication. */
  apiKey: string;
  /** Optional base URL for custom or local LLM endpoints (e.g., Ollama). */
  baseUrl?: string;
  /** Optional model identifier for custom/local providers. */
  model?: string;
}

/**
 * Service class for analyzing images of board games or search graphs using Large Language Models.
 */
export class ImageAnalysisService {
  private config: AnalysisConfig;

  /**
   * Initializes a new ImageAnalysisService instance.
   * @param config - Analysis configuration including provider and API keys.
   */
  constructor(config: AnalysisConfig) {
    this.config = config;
  }

  /**
   * Processes an image file and extracts the game/graph state.
   * 
   * @param imageFile - The image to analyze.
   * @param promptOverride - Optional custom prompt for the AI.
   * @returns {Promise<DetectedState>} The detected structured state.
   */
  async analyzeImage(imageFile: File, promptOverride?: string): Promise<DetectedState> {
    const base64Data = await this.fileToBase64(imageFile);
    const prompt = promptOverride || ImageAnalysisService.getPrompt();

    try {
      let jsonString = "";

      switch (this.config.provider) {
        case 'google':
          jsonString = await this.analyzeWithGoogle(base64Data, imageFile.type, prompt);
          break;
        case 'openai':
          jsonString = await this.analyzeWithOpenAI(base64Data, imageFile.type, prompt);
          break;
        case 'anthropic':
          jsonString = await this.analyzeWithAnthropic(base64Data, imageFile.type, prompt);
          break;
        case 'custom':
          jsonString = await this.analyzeWithCustom(base64Data, imageFile.type, prompt);
          break;
        default:
          throw new Error("Unsupported AI provider.");
      }

      const cleanJson = jsonString.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson) as DetectedState;

    } catch (error: any) {
      console.error(`${this.config.provider} Analysis Failed:`, error);
      throw new Error(this.formatErrorMessage(error));
    }
  }

  /**
   * Translates technical API errors into user-friendly English messages.
   * 
   * @param error - The raw error object.
   * @returns {string} User-facing error message.
   */
  private formatErrorMessage(error: any): string {
    const msg = error.message || "";

    if (msg.includes("429") || msg.includes("Quota exceeded")) {
      return "Usage limit exceeded (Quota Exceeded). Please try again later or check your billing plan.";
    }
    if (msg.includes("401") || msg.includes("API key not valid")) {
      return "Invalid API key. Please check your configuration.";
    }
    if (msg.includes("404") || msg.includes("not found")) {
      return "Model not found. Ensure your account has access to the requested model.";
    }
    if (msg.includes("403") || msg.includes("permission")) {
      return "Permission denied. Check your API key settings.";
    }
    if (msg.includes("SAFETY")) {
      return "The image was blocked by the AI's safety filters.";
    }
    if (msg.includes("Failed to fetch")) {
      return "Connection error. Please check your internet or if the provider endpoint is accessible.";
    }

    return `AI Error: ${msg.substring(0, 100)}...`;
  }

  /**
   * Executes analysis using Google's Gemini Pro Vision model.
   */
  private async analyzeWithGoogle(base64: string, mimeType: string, prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.config.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const imagePart: InlineDataPart = {
      inlineData: { data: base64, mimeType: mimeType || "image/jpeg" },
    };

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  }

  /**
   * Executes analysis using OpenAI's GPT-4 Turbo with Vision.
   */
  private async analyzeWithOpenAI(base64: string, mimeType: string, prompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Executes analysis using Anthropic's Claude 3.5 Sonnet.
   */
  private async analyzeWithAnthropic(base64: string, mimeType: string, prompt: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType as any, data: base64 } },
              { type: "text", text: prompt }
            ]
          }
        ]
      })
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Executes analysis using a custom/local endpoint (OpenAI-compatible).
   */
  private async analyzeWithCustom(base64: string, mimeType: string, prompt: string): Promise<string> {
    const baseUrl = this.config.baseUrl || "http://localhost:11434/v1";
    const url = baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey || "dummy"}`
      },
      body: JSON.stringify({
        model: this.config.model || "llama3",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
            ]
          }
        ],
        stream: false,
      })
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Returns the system prompt used for instructing the LLM on how to extract and format data.
   */
  public static getPrompt(): string {
    return `
      You are a strict Computer Vision API. Your ONLY task is to extract structured data from the image.
      Output MUST be raw JSON. Do NOT use Markdown formatting (no \`\`\`json). Do NOT add explanations.

      Analyze the image and match it to one of the following 3 schemas exactly.

      --- SCHEMA 1: Tic-Tac-Toe ---
      If the image shows a 3x3 grid with X and O:
      Return exactly this COMPLETE JSON structure with all node properties:
      { 
        "type": "tictactoe", 
        "id": "root",
        "name": "Start",
        "value": 0,
        "isGoal": false,
        "children": [],
        "boardState": ["X", null, "O", "X", null, null, "O", null, null]
      }
      Rule: Use null for empty cells. Array length must be 9.

      --- SCHEMA 2: 8-Puzzle ---
      If the image shows a 3x3 sliding tile puzzle with numbers:
      Return exactly this COMPLETE JSON structure with all node properties:
      { 
        "type": "8puzzle", 
        "id": "root",
        "name": "Start",
        "value": 0,
        "isGoal": false,
        "children": [],
        "boardState": [1, 2, 3, 8, 0, 4, 7, 6, 5]
      }
      Rule: Use 0 for the empty space. Array length must be 9.

      --- SCHEMA 3: Search Graph / Tree ---
      If the image shows nodes and edges (circles/squares connected by lines):
      Return exactly this recursive JSON structure:
      { 
        "type": "custom", 
        "tree": {
            "id": "root",
            "name": "S",
            "value": 10,
            "isGoal": false,
            "children": [
                { "id": "child1", "name": "A", "costToParent": 5, "value": 4, "isGoal": false, "children": [] }
            ]
        }
      }

      CRITICAL RULES FOR GRAPHS/TREES:
      1. **Edge Costs (g):** Look for numbers written on the lines/arrows between nodes. Assign this to 'costToParent' in the child node.
      2. **Heuristic/Value (h):** Look for numbers written inside or very close to the nodes. Assign to 'value'.
      3. **Goal:** Identify destination nodes (double circles, filled, or text 'G'/'Goal') and set "isGoal": true.
      4. **CYCLES & CONNECTIONS (Crucial):** 
         - If a node connects to an EXISTING node (e.g., A -> B -> A), create a NEW child node instance representing that connection.
      5. **IDs:** Generate unique IDs for every node object (e.g., "node-A-1", "node-A-2") to avoid rendering collisions.
    `;
  }

  /**
   * Helper utility to convert a File object to a base64 string.
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Creates a concrete Problem instance from the analysis result.
   */
  createProblemFromAnalysis(result: DetectedState) {
    if (!result) return null;
    if (result.type === 'tictactoe') return new TicTacToe(result.boardState);
    if (result.type === '8puzzle') return new EightPuzzle(result.boardState);
    return null;
  }
}

