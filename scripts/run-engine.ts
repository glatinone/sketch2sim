// Usage: node scripts/run-engine.ts <image.png|jpg> [modelId]
// Reads GEMINI_API_KEY from env or ../probe/.env. Writes ../probe/out-<name>.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { compileSketch, DEFAULT_MODEL_ID } from "../src/engine/index.ts";

const [imagePath, modelArg] = process.argv.slice(2);
if (!imagePath) {
  console.error("usage: node scripts/run-engine.ts <image> [modelId]");
  process.exit(1);
}

let apiKey = process.env.GEMINI_API_KEY ?? "";
const envFile = resolve(import.meta.dirname, "../../probe/.env");
if (!apiKey && existsSync(envFile)) {
  apiKey = readFileSync(envFile, "utf8").match(/^GEMINI_API_KEY=(.+)$/m)?.[1].trim() ?? "";
}

const ext = extname(imagePath).toLowerCase();
try {
  const result = await compileSketch({
    imageBase64: readFileSync(imagePath).toString("base64"),
    mimeType: ext === ".png" ? "image/png" : "image/jpeg",
    board: "uno",
    apiKey,
    modelId: modelArg ?? DEFAULT_MODEL_ID,
  });
  const out = resolve(import.meta.dirname, `../../probe/out-${basename(imagePath, ext)}.json`);
  writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(`${result.projectTitle} — ${result.parts.length} parts, ${result.wires.length} wires, ${result.fixes.length} fixes, ${result.latencyMs} ms`);
  for (const f of result.fixes) console.log(`  fix: ${f.what}: ${f.before} -> ${f.after}`);
  console.log(`saved ${out}`);
} catch (err) {
  const e = err as Error & { kind?: string; raw?: string };
  console.error(`FAILED [${e.kind ?? "?"}] ${e.message}`);
  if (e.raw) console.error(`raw:\n${e.raw.slice(0, 2000)}`);
  process.exit(1);
}
