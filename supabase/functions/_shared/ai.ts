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
