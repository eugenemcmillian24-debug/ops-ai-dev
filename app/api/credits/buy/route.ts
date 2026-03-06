import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  packId: z.enum(["1k", "5k", "10k", "50k", "100k"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const checkoutSession = await createCheckoutSession(
    result.data.packId,
    session.user.id,
    session.user.email
  );

  return NextResponse.json({ url: checkoutSession.url });
}
