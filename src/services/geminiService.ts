import { GoogleGenAI, Type } from "@google/genai";
import { SentimentAnalysis } from "../types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
};

export async function analyzeSentiment(headline: string, content: string): Promise<SentimentAnalysis> {
  const ai = getAI();
  
  const prompt = `
    Analyze the following financial news article and provide a detailed sentiment analysis and market impact prediction.
    
    Headline: ${headline}
    Content: ${content}
    
    Score interpretation:
    1–3 = strongly bearish
    4–5 = mildly bearish
    6–7 = neutral to slightly bullish
    8–10 = strongly bullish

    Please categorize the news into one or more of these specific sectors if applicable:
    - Technology
    - Banking
    - Defense
    - Energy
    - Automotive
    - Pharmaceuticals
    - Other

    Also, identify specific companies that are predicted to benefit from this news (Opportunity Radar).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a professional financial analyst. Provide structured, high-quality financial intelligence.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          sentimentScore: { type: Type.NUMBER, description: "1-10" },
          sentimentLabel: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
          explanation: { type: Type.STRING },
          affectedSectors: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
          predictedMarketReaction: { type: Type.STRING },
          bullishProbability: { type: Type.NUMBER, description: "0-100" },
          opportunities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                sector: { type: Type.STRING },
                probability: { type: Type.NUMBER, description: "0-100" },
                reason: { type: Type.STRING }
              },
              required: ["company", "sector", "probability", "reason"]
            }
          },
          reasoning: {
            type: Type.OBJECT,
            properties: {
              up: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Stocks or sectors that may go up" },
              down: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Stocks or sectors that may go down" },
              why: { type: Type.STRING, description: "Detailed financial reasoning" }
            },
            required: ["up", "down", "why"]
          }
        },
        required: ["headline", "sentimentScore", "sentimentLabel", "explanation", "affectedSectors", "keyEntities", "predictedMarketReaction", "bullishProbability", "opportunities", "reasoning"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return result as SentimentAnalysis;
}
