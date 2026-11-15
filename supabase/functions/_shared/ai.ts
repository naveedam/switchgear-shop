// One place to configure the chat model used by the assistant and BOM parser.
// Uses Google's OpenAI-compatible Gemini endpoint with the GEMINI_API_KEY
// secret (already used by extract-catalog). Override with AI_MODEL if needed.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
export const AI_MODEL = Deno.env.get("AI_MODEL") ?? "gemini-2.5-flash";
const AI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

export function aiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

export function chatCompletion(body: Record<string, unknown>): Promise<Response> {
  return fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GEMINI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: AI_MODEL, ...body }),
  });
}

/**
 * Send a file (drawing PDF, photo) to Gemini's native API with a prompt and get
 * text back. Inline upload: keep files under ~15 MB (request limit is 20 MB).
 */
export async function generateFromFile(
  bytes: Uint8Array,
  mimeType: string,
  prompt: string,
  opts: { json?: boolean; temperature?: number } = {},
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: mimeType, data: toBase64(bytes) } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: opts.temperature ?? 0.1,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}
