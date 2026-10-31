// Renders src/ui/presetSketches.ts → public/presets/*.png using headless Edge/Chrome.
// Needs the dev server running:  npm run dev   then   node tools/gen-presets.mjs [baseUrl]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.argv[2] ?? "http://localhost:5173";
const candidates = [
  process.env.BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) throw new Error("No Chromium-based browser found; set BROWSER=/path/to/chrome");

const html = execFileSync(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    `--user-data-dir=${join(tmpdir(), "s2s-gen-presets")}`,
    "--virtual-time-budget=8000",
    "--dump-dom",
    `${base}/tools/gen-presets.html`,
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

const m = /<pre id="out">([\s\S]*?)<\/pre>/.exec(html);
if (!m || !m[1].trim()) throw new Error("Generator page produced no output — is the dev server running?");
const presets = JSON.parse(m[1].replaceAll("&quot;", '"').replaceAll("&amp;", "&"));

mkdirSync("public/presets", { recursive: true });
for (const [id, dataUrl] of Object.entries(presets)) {
  const file = `public/presets/${id}.png`;
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("wrote", file);
}
