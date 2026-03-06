import { auth } from "@/lib/auth";
import { getUserCredits } from "@/lib/credits";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credits = await getUserCredits(parseInt(session.user.id));
  return NextResponse.json({ credits });
}
