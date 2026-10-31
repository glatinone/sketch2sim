import { CompileError } from "../contract/types.ts";

// Gemma often wraps JSON in ``` fences or adds a sentence before/after it.
// Strip fences, then take the first balanced {...} block (string-aware) and parse it.
export function extractJson(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  if (start === -1) throw new CompileError("Model reply contains no JSON object", "PARSE", text);

  // Copy the object out while escaping raw newlines/tabs inside strings
  // (Gemma often puts the Arduino sketch in a string with literal line breaks).
  let depth = 0;
  let inString = false;
  let escaped = false;
  let candidate = "";
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      candidate += ch === "\n" ? "\\n" : ch === "\r" ? "" : ch === "\t" ? "\\t" : ch;
      continue;
    }
    candidate += ch;
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate);
        } catch {
          // trailing commas are the most common Gemma JSON mistake
          try {
            return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
          } catch (err) {
            throw new CompileError(`Model JSON is malformed: ${(err as Error).message}`, "PARSE", text);
          }
        }
      }
    }
  }
  throw new CompileError("Model JSON is truncated (unbalanced braces)", "PARSE", text);
}
