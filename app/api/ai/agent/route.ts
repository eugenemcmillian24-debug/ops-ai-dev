import { auth } from "@/lib/auth";
import { deductCredits, checkCredits } from "@/lib/credits";
import { runAgentPipeline } from "@/lib/codecraft-graph";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  const hasCredits = await checkCredits(userId, 2000);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", required: 2000, code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const deductResult = await deductCredits(userId, 2000, "agentRun", {
    prompt: result.data.prompt.slice(0, 100),
  });

  if (!deductResult.success) {
    return NextResponse.json(
      { error: "Insufficient credits", code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agentState = await runAgentPipeline(
          result.data.prompt,
          (update) => {
            const data = JSON.stringify(update) + "\n";
            controller.enqueue(encoder.encode(data));
          }
        );

        const finalData =
          JSON.stringify({
            type: "final",
            state: agentState,
            creditsRemaining: deductResult.remaining,
          }) + "\n";

        controller.enqueue(encoder.encode(finalData));
        controller.close();
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Agent pipeline failed";
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "error", message: errMsg }) + "\n")
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Credits-Deducted": "2000",
      "X-Credits-Remaining": String(deductResult.remaining),
    },
  });
}
