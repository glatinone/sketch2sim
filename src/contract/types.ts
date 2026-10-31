// SHARED CONTRACT between Session A (engine) and Session B (UI).
// Frozen at Phase 0. Changing this file needs a note in BOTH status files first.
// Session B copies this file to sketch2sim/src/contract/types.ts during scaffold;
// after that, the copy inside sketch2sim/ is the single source of truth.

export type Board = "uno"; // MVP: Arduino Uno only. "esp32" is a stretch goal.

export interface CompileInput {
  imageBase64: string; // PNG/JPEG data, WITHOUT the "data:image/...;base64," prefix
  mimeType: "image/png" | "image/jpeg";
  board: Board;
  apiKey: string;
  modelId: string; // editable in UI, default comes from engine DEFAULT_MODEL_ID
}

export interface Part {
  id: string; // e.g. "uno", "led1", "r1"
  type: string; // exact Wokwi type, e.g. "wokwi-led"
  label: string; // human name shown in UI, e.g. "Red LED"
  attrs?: Record<string, string>; // e.g. { color: "red" } or { value: "220" }
}

export interface Wire {
  from: string; // "partId:pin", e.g. "uno:13"
  to: string; // "partId:pin", e.g. "r1:1"
  color: string; // Wokwi wire color: red | black | green | blue | yellow | orange | purple
  signal: "POWER" | "GND" | "DIGITAL" | "ANALOG" | "PWM" | "I2C";
  rationale: string; // why this pin, shown in UI tooltip / pin table
}

export interface Fix {
  // a repair the validator applied to Gemma's raw output (shown in UI as "auto-fixed")
  what: string;
  before: string;
  after: string;
}

export interface CompileResult {
  projectTitle: string;
  summary: string; // 1-2 sentences, what the circuit does
  board: Board;
  parts: Part[];
  wires: Wire[];
  diagramJson: string; // ready-to-paste Wokwi diagram.json (pretty printed)
  sketchIno: string; // ready-to-paste sketch.ino
  notes: string[]; // electrical notes: resistors, pull-ups, current
  fixes: Fix[]; // what the validator repaired; empty if Gemma was already valid
  source: "live" | "cached"; // "cached" MUST be labeled visibly in the UI
  latencyMs: number;
  modelId: string;
}

export type CompileErrorKind = "NO_KEY" | "API" | "PARSE" | "VALIDATION" | "TIMEOUT";

// No TS parameter properties here on purpose: Vite's template enables erasableSyntaxOnly
// and Node's type stripping rejects them.
export class CompileError extends Error {
  kind: CompileErrorKind;
  raw?: string; // raw model text, for the debug drawer
  constructor(message: string, kind: CompileErrorKind, raw?: string) {
    super(message);
    this.kind = kind;
    this.raw = raw;
  }
}

// The ONE function the UI calls. Implemented by Session A in sketch2sim/src/engine/index.ts
export type CompileSketch = (input: CompileInput) => Promise<CompileResult>;
