import { auth } from "@/lib/auth";
import { deductCredits, checkCredits } from "@/lib/credits";
import { MODELS, SYSTEM_PROMPT } from "@/lib/ai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(10000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

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

  const deductResult = await deductCredits(userId, 50, "terminalMessage");
  if (!deductResult.success) {
    return NextResponse.json(
      { error: "Insufficient credits", code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  try {
    const response = await generateText({
      model: MODELS.primary,
      system: SYSTEM_PROMPT,
      prompt: result.data.prompt,
    });

    return NextResponse.json({
      text: response.text,
      creditsRemaining: deductResult.remaining,
    });
  } catch {
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 500 }
    );
  }
}
