console.log("API KEY:", import.meta.env.VITE_GEMINI_API_KEY);
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

export async function generateAutoTitle(text: string): Promise<string> {
  if (!text || text.trim().length < 10) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a very short, poetic title (max 5 words) for this diary entry: "${text}"`,
      config: {
        systemInstruction: "You are a creative assistant that generates evocative titles for personal diary entries. Keep it concise and meaningful.",
      },
    });
    
    return response.text?.replace(/["']/g, "").trim() || "Untitled Moment";
  } catch (error) {
    console.error("AI Title Generation error:", error);
    return "New Moment";
  }
}

export async function suggestMood(text: string): Promise<string> {
  if (!text || text.trim().length < 5) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the sentiment and mood of this diary entry and pick the best matching emotion from this list: 
      Joyful, Grateful, Inspired, Excited, Peaceful, Thoughtful, Melancholy, Sad, Anxious, Angry, Lovesick, Nostalgic, Productive, Tired, Brave, Wanderlust.
      Entry: "${text}"`,
      config: {
        systemInstruction: "Select ONLY one word from the provided list that best describes the mood of the text. Respond with just the word. If unsure, default to Thoughtful.",
      },
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("AI Mood Suggestion error:", error);
    return "";
  }
}

export async function summarizeEntry(text: string): Promise<string> {
  if (!text || text.trim().length < 5) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this diary entry in 1–2 meaningful, emotion-aware sentences based ONLY on the user's input: "${text}"`,
      config: {
        systemInstruction: "You are a thoughtful reflection assistant. Provide a short, relevant, and emotion-aware summary of the user's input. Do not add outside information. Keep it to 1-2 sentences.",
      },
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("AI Summarization error:", error);
    return "";
  }
}
