import { generateText } from "ai";
import { MODELS, SYSTEM_PROMPT } from "@/lib/ai";

export type AgentStage =
  | "router"
  | "planner"
  | "coder"
  | "critic"
  | "deployer"
  | "complete"
  | "error";

export interface AgentState {
  stage: AgentStage;
  prompt: string;
  plan?: string;
  code?: Record<string, string>;
  review?: string;
  output?: string;
  error?: string;
  stageOutputs: Partial<Record<AgentStage, string>>;
}

export type AgentUpdate = {
  stage: AgentStage;
  message: string;
  data?: Record<string, unknown>;
};

async function routerAgent(
  prompt: string
): Promise<{ intent: string; complexity: string }> {
  const result = await generateText({
    model: MODELS.speed,
    system:
      "You are a router agent. Analyze the user request and return JSON with 'intent' (build|debug|explain|deploy) and 'complexity' (simple|medium|complex). Return only valid JSON.",
    prompt,
  });

  try {
    return JSON.parse(result.text);
  } catch {
    return { intent: "build", complexity: "medium" };
  }
}

async function plannerAgent(
  prompt: string,
  intent: string
): Promise<string> {
  const result = await generateText({
    model: MODELS.primary,
    system: `${SYSTEM_PROMPT}\n\nYou are the Planner agent. Create a detailed implementation plan for the user's request. Break it into clear steps with file structure.`,
    prompt: `Intent: ${intent}\n\nRequest: ${prompt}`,
    maxTokens: 1000,
  });

  return result.text;
}

async function coderAgent(
  prompt: string,
  plan: string
): Promise<Record<string, string>> {
  const result = await generateText({
    model: MODELS.primary,
    system: `${SYSTEM_PROMPT}\n\nYou are the Coder agent. Generate complete, production-ready code files based on the plan. Return a JSON object where keys are file paths and values are file contents.`,
    prompt: `Plan:\n${plan}\n\nOriginal request: ${prompt}\n\nGenerate the code files as JSON:`,
    maxTokens: 4000,
  });

  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(result.text);
  } catch {
    return {
      "index.tsx": result.text,
    };
  }
}

async function criticAgent(
  code: Record<string, string>,
  prompt: string
): Promise<string> {
  const codeStr = Object.entries(code)
    .map(([file, content]) => `### ${file}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");

  const result = await generateText({
    model: MODELS.speed,
    system: `${SYSTEM_PROMPT}\n\nYou are the Critic agent. Review the generated code for bugs, security issues, and best practice violations. Provide a brief review with suggestions.`,
    prompt: `Original request: ${prompt}\n\nGenerated code:\n${codeStr}`,
    maxTokens: 500,
  });

  return result.text;
}

export async function runAgentPipeline(
  prompt: string,
  onUpdate: (update: AgentUpdate) => void
): Promise<AgentState> {
  const state: AgentState = {
    stage: "router",
    prompt,
    stageOutputs: {},
  };

  try {
    onUpdate({ stage: "router", message: "Analyzing your request..." });
    const routing = await routerAgent(prompt);
    state.stageOutputs.router = `Intent: ${routing.intent}, Complexity: ${routing.complexity}`;

    onUpdate({
      stage: "planner",
      message: "Creating implementation plan...",
      data: routing,
    });
    state.stage = "planner";
    const plan = await plannerAgent(prompt, routing.intent);
    state.plan = plan;
    state.stageOutputs.planner = plan;

    onUpdate({ stage: "coder", message: "Generating code..." });
    state.stage = "coder";
    const code = await coderAgent(prompt, plan);
    state.code = code;
    state.stageOutputs.coder = JSON.stringify(code, null, 2);

    onUpdate({ stage: "critic", message: "Reviewing code quality..." });
    state.stage = "critic";
    const review = await criticAgent(code, prompt);
    state.review = review;
    state.stageOutputs.critic = review;

    state.stage = "complete";
    state.output = Object.entries(code)
      .map(([file, content]) => `### ${file}\n\`\`\`\n${content}\n\`\`\``)
      .join("\n\n");

    onUpdate({ stage: "complete", message: "Code generation complete!" });

    return state;
  } catch (error) {
    state.stage = "error";
    state.error = error instanceof Error ? error.message : "Unknown error";
    onUpdate({ stage: "error", message: state.error });
    return state;
  }
}
