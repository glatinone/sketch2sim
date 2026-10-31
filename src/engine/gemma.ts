import { CompileError } from "../contract/types.ts";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 90_000; // gemma-4-31b-it takes ~60s when busy

export interface GemmaRequest {
  apiKey: string;
  modelId: string;
  prompt: string;
  image?: { base64: string; mimeType: string };
  // Gemma on the Gemini API may reject these; flags are set from the A0 probe findings.
  useSystemInstruction?: boolean;
  systemText?: string;
  jsonMode?: boolean;
}

export async function callGemma(req: GemmaRequest): Promise<string> {
  if (!req.apiKey) throw new CompileError("Gemini API key is missing", "NO_KEY");

  const parts: Array<Record<string, unknown>> = [];
  if (req.systemText && !req.useSystemInstruction) parts.push({ text: req.systemText });
  if (req.image) parts.push({ inline_data: { mime_type: req.image.mimeType, data: req.image.base64 } });
  parts.push({ text: req.prompt });

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      thinkingConfig: { includeThoughts: false }, // budget/level are rejected for Gemma 4
      ...(req.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (req.systemText && req.useSystemInstruction) {
    body.systemInstruction = { parts: [{ text: req.systemText }] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    // AI Studio's new "AQ." keys are only accepted as ?key=, not via the x-goog-api-key header
    const url = `${API_BASE}/${encodeURIComponent(req.modelId)}:generateContent?key=${encodeURIComponent(req.apiKey)}`;
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new CompileError(`Gemma did not answer within ${TIMEOUT_MS / 1000}s`, "TIMEOUT");
    }
    throw new CompileError(`Network error: ${(err as Error).message}`, "API");
  } finally {
    clearTimeout(timer);
  }

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
  };
  if (!res.ok) {
    const e = new CompileError(`Gemini API ${res.status}: ${data.error?.message ?? "unknown error"}`, "API");
    e.raw = String(res.status);
    throw e;
  }

  // Skip "thought" parts if the model emits reasoning traces.
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");
  if (!text.trim()) {
    const reason = data.candidates?.[0]?.finishReason ?? "no candidates";
    throw new CompileError(`Gemma returned an empty answer (${reason})`, "API", JSON.stringify(data));
  }
  return text;
}
