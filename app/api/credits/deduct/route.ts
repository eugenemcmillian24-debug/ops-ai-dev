import { auth } from "@/lib/auth";
import { deductCredits, predictCost, ActionType } from "@/lib/credits";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum([
    "terminalMessage",
    "agentRun",
    "webcontainerMinute",
    "deployment",
    "mobileExport",
    "securityScan",
    "projectSave",
  ]),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { action, metadata } = result.data;
  const cost = predictCost(action as ActionType);
  const userId = parseInt(session.user.id);

  const deductResult = await deductCredits(
    userId,
    cost,
    action as ActionType,
    metadata as Record<string, unknown>
  );

  if (!deductResult.success) {
    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: cost,
        remaining: deductResult.remaining,
      },
      { status: 402 }
    );
  }

  return NextResponse.json({
    success: true,
    deducted: cost,
    remaining: deductResult.remaining,
  });
}
