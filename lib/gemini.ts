const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiOptions {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  temperature?: number;
}

export class GeminiNotConfigured extends Error {
  constructor() {
    super("Chưa cấu hình GEMINI_API_KEY");
    this.name = "GeminiNotConfigured";
  }
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Goi Gemini o che do tra ve JSON theo schema */
export async function geminiJson<T>({
  system,
  user,
  schema,
  temperature = 0.35,
}: GeminiOptions): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiNotConfigured();
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
        responseSchema: schema,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về nội dung.");
  return JSON.parse(text) as T;
}

/* ------------------------------------------------------------------ */

const criterionSchema = {
  type: "object",
  properties: {
    key: { type: "string" },
    label: { type: "string" },
    band: { type: "number" },
    comment: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
  },
  required: ["key", "label", "band", "comment"],
};

export const FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    overallBand: { type: "number" },
    criteria: { type: "array", items: criterionSchema },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          reason: { type: "string" },
        },
        required: ["original", "corrected", "reason"],
      },
    },
    upgradedVocabulary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          basic: { type: "string" },
          better: { type: "string" },
        },
        required: ["basic", "better"],
      },
    },
    modelAnswer: { type: "string" },
  },
  required: ["overallBand", "criteria", "strengths", "improvements"],
};
