// QA stills: bundle once, render a still every N seconds (or given frames) → out/qa/
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const id = process.env.COMP || "Sketch2SimDemo";
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const comp = await selectComposition({ serveUrl, id });
const arg = process.argv[2] || "10";
const frames = arg.includes(",") ? arg.split(",").map(Number) : Array.from({ length: Math.floor(comp.durationInFrames / (Number(arg) * 30)) + 1 }, (_, i) => Math.min(comp.durationInFrames - 1, i * Number(arg) * 30 + 15));
mkdirSync(path.join(root, "out/qa"), { recursive: true });
for (const frame of frames) {
  const output = path.join(root, `out/qa/${id}-f${String(frame).padStart(4, "0")}.jpg`);
  await renderStill({ composition: comp, serveUrl, output, frame, imageFormat: "jpeg", jpegQuality: 80, scale: 0.5 });
  console.log("still", frame, (frame / 30).toFixed(1) + "s");
}
