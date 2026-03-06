import { auth } from "@/lib/auth";
import { checkCredits } from "@/lib/credits";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const hasCredits = await checkCredits(userId, 50);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  const formData = await req.formData();
  const audio = formData.get("audio") as Blob | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  try {
    const groqFormData = new FormData();
    groqFormData.append("file", audio, "audio.webm");
    groqFormData.append("model", "distil-whisper-large-v3-en");
    groqFormData.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: groqFormData,
      }
    );

    if (!response.ok) {
      throw new Error("Groq transcription failed");
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transcription failed" },
      { status: 500 }
    );
  }
}
