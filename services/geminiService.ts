
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize GoogleGenAI using a named parameter and the mandatory environment variable
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeCode(filename: string, content: string): Promise<string> {
    const prompt = `You are a senior React engineer. Analyze this file named "${filename}". 
    Evaluate its architecture, suggest performance improvements, and find potential bugs.
    
    Code:
    ${content}`;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 2000 }
        }
      });
      // Extract the text output using the .text property (not a method)
      return response.text || "No analysis generated.";
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return "Analysis failed. Ensure your API key is correctly configured.";
    }
  }

  async chatWithCode(message: string, contextFile?: string, contextCode?: string): Promise<string> {
    const contextPrompt = contextCode 
      ? `We are looking at file "${contextFile}". Context code:\n${contextCode}\n\nUser Question: ${message}`
      : message;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contextPrompt,
        config: {
          systemInstruction: "You are a world-class frontend mentor assistant. Be concise, technical, and helpful."
        }
      });
      // Extract the text output using the .text property (not a method)
      return response.text || "No response received.";
    } catch (error) {
      console.error("Gemini chat error:", error);
      return "I encountered an error processing your request.";
    }
  }
}

export const gemini = new GeminiService();
