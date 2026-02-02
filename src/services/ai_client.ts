import { GoogleGenerativeAI } from "@google/generative-ai";

// NOTE: In a production environment, you should NOT expose your API key on the client side.
// This client is provided for demonstration purposes or for internal tools where security is managed.
// For the main application, we use the backend proxy to handle AI requests.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

export const getGenAIClient = () => {
    if (!genAI) {
        console.warn("Google Generative AI SDK not initialized. Missing API Key.");
        return null;
    }
    return genAI;
};

export const directGeminiChat = async (message: string) => {
    const client = getGenAIClient();
    if (!client) return "AI Service Unavailable (Client)";

    try {
        const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Direct Gemini Error:", error);
        return "Error connecting to Gemini directly.";
    }
};
