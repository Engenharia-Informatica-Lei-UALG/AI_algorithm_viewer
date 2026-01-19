import { GoogleGenerativeAI, InlineDataPart } from "@google/generative-ai";
import { TicTacToe } from '../problems/TicTacToe';
import { EightPuzzle } from '../problems/EightPuzzle';
import { CustomTreeNode } from '@/store/gameStore';

// Tipos de resposta
type DetectedState = 
  | { type: 'tictactoe'; board: (string | null)[] }
  | { type: '8puzzle'; board: number[] }
  | { type: 'custom'; tree: CustomTreeNode } 
  | null;

export class ImageAnalysisService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeImage(imageFile: File): Promise<DetectedState> {
    try {
      // FIX: Updated to 'gemini-2.5-flash' (Current Stable Model)
      // 'gemini-1.5-flash' was deprecated in late 2025.
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const base64Data = await this.fileToBase64(imageFile);
      
      const imagePart: InlineDataPart = {
        inlineData: {
          data: base64Data,
          mimeType: imageFile.type || "image/jpeg",
        },
      };

      const prompt = `
      Analise a imagem. Identifique: TicTacToe, 8-Puzzle, ou Grafo.
      Retorne JSON puro:
      - TicTacToe: { "type": "tictactoe", "board": ["X", null, "O", ...] }
      - 8-Puzzle: { "type": "8puzzle", "board": [1, 2, 3, 0, ...] }
      - Grafo: { "type": "custom", "tree": { "id": "root", "name": "A", "children": [] } }
      `;

      console.log("Sending to Gemini 2.5...");
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Sanitização básica para JSON
      const jsonString = text.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString) as DetectedState;

    } catch (error: any) {
      console.error("Gemini 2.5 Analysis Failed:", error);
      throw new Error(`AI Error: ${error.message}`);
    }
  }

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

  createProblemFromAnalysis(result: DetectedState) {
    if (!result) return null;
    if (result.type === 'tictactoe') return new TicTacToe(result.board);
    if (result.type === '8puzzle') return new EightPuzzle(result.board);
    return null; 
  }
}