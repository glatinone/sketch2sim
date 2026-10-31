import { CompileError } from "../contract/types.ts";
import type { CompileResult, CompileSketch } from "../contract/types.ts";
import { callGemma } from "./gemma.ts";
import { extractJson } from "./parse.ts";
import { RETRY_PROMPT, SYSTEM_TEXT, userPrompt } from "./prompt.ts";
import { validateCircuit } from "./validate.ts";
import type { RawCircuit } from "./validate.ts";
import { buildDiagramJson, fallbackSketch, looksLikeArduinoSketch } from "./wokwi.ts";

// Set from the A0 probe (status/A.md).
export const DEFAULT_MODEL_ID = "gemma-4-PLACEHOLDER";
const USE_SYSTEM_INSTRUCTION = false;
const JSON_MODE = false;

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

  let text = await callGemma({ ...base, prompt: userPrompt(input.board) });
  let raw: RawCircuit;
  try {
    raw = extractJson(text) as RawCircuit;
  } catch (err) {
    // one retry, telling the model what went wrong
    text = await callGemma({ ...base, prompt: `${userPrompt(input.board)}\n\n${RETRY_PROMPT((err as Error).message)}` });
    raw = extractJson(text) as RawCircuit;
  }

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
    modelId: base.modelId,
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
