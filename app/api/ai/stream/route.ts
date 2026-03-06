import { auth } from "@/lib/auth";
import { deductCredits, checkCredits } from "@/lib/credits";
import { MODELS, SYSTEM_PROMPT } from "@/lib/ai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(10000),
    })
  ),
  model: z.enum(["primary", "speed", "reasoning", "fallback"]).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  const rateLimitResult = await checkRateLimit(`user:${userId}`);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const hasCredits = await checkCredits(userId, 50);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", required: 50, code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, model = "primary" } = result.data;

  const deductResult = await deductCredits(userId, 50, "terminalMessage");
  if (!deductResult.success) {
    return NextResponse.json(
      { error: "Insufficient credits", code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  let selectedModel = MODELS[model];

  try {
    const response = streamText({
      model: selectedModel,
      system: SYSTEM_PROMPT,
      messages,
      maxTokens: 4096,
      onFinish: () => {},
    });

    return response.toDataStreamResponse({
      headers: {
        "X-Credits-Remaining": String(deductResult.remaining),
        "X-Credits-Deducted": "50",
      },
    });
  } catch {
    try {
      selectedModel = MODELS.fallback;
      const fallbackResponse = streamText({
        model: selectedModel,
        system: SYSTEM_PROMPT,
        messages,
        maxTokens: 4096,
      });

      return fallbackResponse.toDataStreamResponse({
        headers: {
          "X-Credits-Remaining": String(deductResult.remaining),
          "X-Model": "fallback",
        },
      });
    } catch (fallbackError) {
      const errorMsg =
        fallbackError instanceof Error
          ? fallbackError.message
          : "AI service unavailable";
      await deductCredits(userId, -50, "terminalMessage");
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }
}
