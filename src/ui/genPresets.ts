// Dev-only entry for tools/gen-presets.html: renders every preset sketch to a PNG data URL
// and prints them as JSON in <pre id="out"> so a headless browser can dump them.
import { PRESET_SKETCHES } from "./presetSketches.ts";
import { opsToDataUrl } from "./sketchOps.ts";

async function main() {
  await document.fonts.ready;
  const out: Record<string, string> = {};
  const gallery = document.getElementById("gallery")!;
  for (const [id, ops] of Object.entries(PRESET_SKETCHES)) {
    out[id] = opsToDataUrl(ops, "paper");
    const img = document.createElement("img");
    img.src = out[id];
    img.title = id;
    gallery.appendChild(img);
  }
  document.getElementById("out")!.textContent = JSON.stringify(out);
}

void main();
