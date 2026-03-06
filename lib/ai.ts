import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const MODELS = {
  primary: groq("llama-3.1-70b-versatile"),
  speed: groq("llama-3.1-8b-instant"),
  reasoning: groq("deepseek-r1-distill-llama-70b"),
  fallback: openrouter("qwen/qwen3-coder:free"),
} as const;

export const SYSTEM_PROMPT = `You are CodeCraft AI, an expert full-stack developer assistant. You help users build, debug, and deploy production-ready applications. 

When generating code:
- Write clean, production-ready TypeScript/JavaScript
- Follow modern best practices
- Include proper error handling
- Prefer Next.js App Router patterns
- Use Tailwind CSS for styling
- Be concise but thorough in explanations

Always respond with actionable code and clear explanations.`;
