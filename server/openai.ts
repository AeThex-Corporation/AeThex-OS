import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are the AeThex Assistant, a helpful AI guide for the AeThex ecosystem - "The Operating System for the Metaverse."

About AeThex:
- AeThex is built on a dual-entity model: The Foundation (non-profit, training) and The Corporation (for-profit, security)
- The "Holy Trinity" consists of: Axiom (The Law - foundational protocol), Codex (The Standard - certification system), and Aegis (The Shield - security layer)
- Architects are certified professionals trained through the Codex curriculum
- The platform offers gamified learning, XP progression, and verified credentials

You help users with:
- Navigating the platform features (Passport, Terminal, Curriculum, Dashboard)
- Understanding the certification process and how to become an Architect
- Explaining the Aegis security features
- Answering questions about the ecosystem and its mission

Be concise, friendly, and helpful. Use the platform's terminology when appropriate. If you don't know something specific about the platform, be honest about it.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getChatResponse(userMessage: string, history?: ChatMessage[]): Promise<string> {
  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT }
    ];
    
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    
    messages.push({ role: "user", content: userMessage });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("OpenAI chat error:", error);
    throw new Error("Failed to get AI response");
  }
}
