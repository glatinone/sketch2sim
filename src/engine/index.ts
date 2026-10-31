import { CompileError } from "../contract/types.ts";
import type { CompileResult, CompileSketch } from "../contract/types.ts";
import { callGemma } from "./gemma.ts";
import { extractJson } from "./parse.ts";
import { RETRY_PROMPT, SYSTEM_TEXT, userPrompt } from "./prompt.ts";
import { validateCircuit } from "./validate.ts";
import type { RawCircuit } from "./validate.ts";
import { buildDiagramJson, fallbackSketch, looksLikeArduinoSketch } from "./wokwi.ts";

// Set from the A0 probe (status/A.md).
export const DEFAULT_MODEL_ID = "gemma-4-26b-a4b-it"; // 8/8 ok in probe; 31b was 3/8 (500/503) and ~60s
const FALLBACK_MODEL_ID = "gemma-4-26b-a4b-it";
const USE_SYSTEM_INSTRUCTION = true;
const JSON_MODE = true;

// 500/503 ("high demand") are common on Gemma 4: retry once, on the fallback model if a different one was asked for.
async function callWithFallback(req: Parameters<typeof callGemma>[0]): Promise<{ text: string; modelId: string }> {
  try {
    return { text: await callGemma(req), modelId: req.modelId };
  } catch (err) {
    const status = (err as CompileError).raw;
    if ((err as CompileError).kind !== "API" || (status !== "500" && status !== "503")) throw err;
    const modelId = FALLBACK_MODEL_ID;
    return { text: await callGemma({ ...req, modelId }), modelId };
  }
}

// JSON mode sometimes returns a top-level array instead of the object we asked for.
function asCircuit(value: unknown): RawCircuit {
  if (Array.isArray(value)) return (value.find((v) => v && typeof v === "object" && !Array.isArray(v)) ?? {}) as RawCircuit;
  return (value ?? {}) as RawCircuit;
}

export const PRESET_IDS = ["blink-button", "parking-sensor", "servo-pot"] as const;

export const compileSketch: CompileSketch = async (input) => {
  const started = Date.now();
  const base = {
    apiKey: input.apiKey,
    modelId: input.modelId || DEFAULT_MODEL_ID,
    image: { base64: input.imageBase64, mimeType: input.mimeType },
    systemText: SYSTEM_TEXT,
    useSystemInstruction: USE_SYSTEM_INSTRUCTION,
    jsonMode: JSON_MODE,
  };

  // Gemma 4 latency has a long tail (45s typical, >90s sometimes), so fire two identical requests
  // and keep whichever returns parseable JSON first.
  const attempt = async (prompt: string) => {
    const r = await callWithFallback({ ...base, prompt });
    return { ...r, raw: asCircuit(extractJson(r.text)) };
  };
  let winner: { text: string; modelId: string; raw: RawCircuit };
  try {
    winner = await Promise.any([attempt(userPrompt(input.board)), attempt(userPrompt(input.board))]);
  } catch (err) {
    const first = (err as AggregateError).errors?.[0] ?? err;
    if ((first as CompileError).kind !== "PARSE") throw first;
    // both answers were broken JSON: one retry, telling the model what went wrong
    winner = await attempt(`${userPrompt(input.board)}\n\n${RETRY_PROMPT((first as Error).message)}`);
  }
  const { text, modelId, raw } = winner;

  const circuit = validateCircuit(raw, text);
  let sketchIno = circuit.sketchIno;
  if (!looksLikeArduinoSketch(sketchIno)) {
    circuit.fixes.push({ what: "Replaced invalid firmware with generated template", before: "missing setup()/loop()", after: "template sketch" });
    sketchIno = fallbackSketch(circuit.parts, circuit.wires);
  }

  // Wokwi needs the Servo library added in the Library Manager tab
  const notes = [...circuit.notes];
  if (sketchIno.includes("Servo.h")) notes.unshift("In Wokwi: open Library Manager and add \"Servo\".");

  return {
    projectTitle: circuit.projectTitle,
    summary: circuit.summary,
    board: input.board,
    parts: circuit.parts,
    wires: circuit.wires,
    diagramJson: buildDiagramJson(circuit.parts, circuit.wires),
    sketchIno,
    notes,
    fixes: circuit.fixes,
    source: "live",
    latencyMs: Date.now() - started,
    modelId,
  };
};

// Last-good results for the presets (src/presets/cached/<id>.json). import.meta.glob only exists under Vite;
// the CLI (Node) never calls this.
const cachedModules: Record<string, CompileResult> =
  typeof import.meta.glob === "function"
    ? import.meta.glob<CompileResult>("../presets/cached/*.json", { eager: true, import: "default" })
    : {};

export function loadCachedResult(presetId: string): CompileResult | null {
  const hit = Object.entries(cachedModules).find(([path]) => path.endsWith(`/${presetId}.json`));
  return hit ? { ...hit[1], source: "cached" } : null;
}

export { CompileError };
