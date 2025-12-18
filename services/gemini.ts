
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getNameInsights(nameHebrew: string, meaning: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Explain the spiritual and cultural significance of the Hebrew baby name "${nameHebrew}" (meaning: ${meaning}). Keep it concise, poetic, and in Hebrew. Provide 3 bullet points.`,
      config: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "לא ניתן היה לטעון תובנות נוספות כרגע.";
  }
}

export async function getRelatedNames(nameHebrew: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 5 similar or related Hebrew baby names to "${nameHebrew}". Return only the Hebrew names separated by commas.`,
    });
    return response.text.split(',').map(n => n.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}
