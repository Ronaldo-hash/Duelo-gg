import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const validateMatchResult = async (imageBase64: string): Promise<{ winner: string; victory: boolean; confidence: number }> => {
  if (!genAI) {
    console.warn("Gemini API Key missing");
    return { winner: "Unknown", victory: false, confidence: 0 };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Remove header definition if present (data:image/jpeg;base64,)
    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const prompt = `Analise este print de jogo (provavelmente Mobile Legends ou similar).
    Identifique:
    1. Quem venceu a partida? (Procure por "Vitória", "Victory", ou destaque no time vencedor).
    2. Se for uma tela de "Derrota" ou "Defeat", retorne victory: false.
    
    Retorne APENAS um JSON neste formato:
    {
      "victory": boolean,
      "winner_name": "nome do jogador se visivel, senao 'desconhecido'",
      "confidence": 0.0 a 1.0
    }`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Simple cleanup to ensure JSON
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return {
      winner: data.winner_name || "Unknown",
      victory: data.victory,
      confidence: data.confidence || 0.8
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { winner: "Error", victory: false, confidence: 0 };
  }
};

export const generateContent = async (prompt: string) => {
  if (!genAI) return "API Key Missing";
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateFoundationFiles = async (idea: string) => {
  return [];
};
