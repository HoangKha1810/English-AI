import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Chuyen giong noi thanh van ban bang Whisper tren Groq (free tier) */
export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Chưa cấu hình GROQ_API_KEY nên không tự động chuyển giọng nói thành văn bản được. Bạn có thể tự gõ lại phần mình nói vào ô bên dưới.",
        code: "no_key",
      },
      { status: 503 }
    );
  }

  let inbound: FormData;
  try {
    inbound = await req.formData();
  } catch {
    return NextResponse.json({ error: "Không đọc được dữ liệu âm thanh." }, { status: 400 });
  }

  const file = inbound.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Thiếu file âm thanh." }, { status: 400 });
  }
  if (file.size > 24 * 1024 * 1024) {
    return NextResponse.json({ error: "File ghi âm quá lớn (giới hạn 24MB)." }, { status: 413 });
  }

  const outbound = new FormData();
  outbound.append("file", file, "speech.webm");
  outbound.append("model", process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo");
  outbound.append("language", "en");
  outbound.append("response_format", "json");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: outbound,
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("groq transcribe:", res.status, body.slice(0, 300));
      return NextResponse.json(
        { error: "Groq trả về lỗi khi chuyển giọng nói thành văn bản." },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: (data.text ?? "").trim() });
  } catch (err) {
    console.error("transcribe:", err);
    return NextResponse.json({ error: "Không kết nối được tới Groq." }, { status: 502 });
  }
}
