# Session B — APP (account 2 Claude Code)

Paste this whole file as your first prompt. Read `PLAN.md` and `contract/types.ts` first.

**You own:** `status/B.md`, and everything in `sketch2sim/` **except** `src/engine/**`, `src/presets/cached/**`, `scripts/run-engine.ts`.
**You never edit:** `src/engine/**` (after the one-time stub in B0), `src/contract/types.ts` (frozen), anything in `probe/`.
**You are the only one who:** runs `npm install`, edits `package.json`/configs, pushes to GitHub.

Goal: a clean, projector-friendly 2-panel app that makes the 2-minute demo flawless. Dark theme, big readable text, works at 1366×768.

---

## B0 · Scaffold (12:40–12:55) — do this FIRST, A is waiting on it
```bash
cd C:/Users/kiell.tampubolon/Videos/MLH
npm create vite@latest sketch2sim -- --template react-ts
cd sketch2sim && npm install && npm install tailwindcss @tailwindcss/vite lucide-react
```
- Configure Tailwind v4 (`@tailwindcss/vite` plugin + `@import "tailwindcss";`).
- Copy `../contract/types.ts` → `src/contract/types.ts`.
- Create **engine stub** `src/engine/index.ts` (after this, the folder belongs to A):
  ```ts
  import type { CompileSketch, CompileResult } from "../contract/types.ts";
  export const DEFAULT_MODEL_ID = "gemma-4-PLACEHOLDER";
  export const PRESET_IDS = ["blink-button", "parking-sensor", "servo-pot"] as const;
  export const compileSketch: CompileSketch = async () => { throw new Error("engine not ready"); };
  export function loadCachedResult(_id: string): CompileResult | null { return null; }
  ```
- Make sure `tsconfig.app.json` has `allowImportingTsExtensions: true` (template default) so `.ts` imports work.
- `.gitignore`: add `.env*`, `probe/`.
- `git init`, commit your paths + the stub. `npm run build` must pass.
- Post **`SCAFFOLD READY`** in `status/B.md`.

## B1 · Layout + top bar — `src/App.tsx`, `src/components/TopBar.tsx`
- Top bar: title **Sketch2Sim**, badge "Gemma 4 multimodal", board selector (Arduino Uno only, ESP32 disabled "soon"), settings popover: API key (localStorage, wrapped in try/catch) + editable Model ID (default `DEFAULT_MODEL_ID`), big **Compile** button.
- Body: left = input (≈40%), right = results (≈60%). `h-screen`, no page scroll; panels scroll internally.

## B2 · Sketch canvas — `src/components/SketchCanvas.tsx`
- HTML5 canvas, white strokes on dark, pen + eraser + clear + undo.
- **Label stamps**: click "UNO" / "LED" / "BUTTON" / "BUZZER" / "SERVO" / "POT" / "ULTRASONIC" then click canvas → draws a box with that text (makes Gemma's job much easier, and looks good in the demo).
- Export: `canvas.toDataURL("image/png")` → strip prefix → base64 for `CompileInput`. Export with a **dark→white inverted** or plain white background version if A reports Gemma reads that better (check status/A.md).

## B3 · Upload / webcam — `src/components/ImageInput.tsx`
- Tabs: **Draw** | **Upload** | **Camera** | **Presets**.
- Upload: drag-drop + file picker, preview, downscale to max 1280px (canvas resize) before base64.
- Camera: `getUserMedia`, snapshot button. Camera is the first thing to cut if late.

## B4 · Result panels — `src/components/Result*.tsx`
Tabs on the right:
1. **Circuit** — project title + summary; parts as chips; **wiring table** (from → to, colored dot per wire color, signal badge, rationale on hover/expand); **"Auto-fixed by validator"** chips listing `fixes[]` (this is a judging talking point — make it visible).
2. **diagram.json** — monospace code view, **Copy** + **Download** buttons.
3. **sketch.ino** — same, Copy + Download.
4. **Notes** — `notes[]` as a checklist.
- Header strip: latency (ms), model id, and a loud **CACHED** amber badge when `source === "cached"`.
- **Open Wokwi** button → opens `https://wokwi.com/projects/new/arduino-uno` in a new tab, with a 3-step mini guide: "1. paste diagram.json tab · 2. paste sketch.ino · 3. press ▶".

## B5 · Mock + client — `src/ui/mockCompile.ts`, `src/compileClient.ts`
- `mockCompile` returns a hard-coded realistic `CompileResult` (button + LED on Uno) after 1.5s, so you can build all UI states before the engine exists.
- `compileClient.ts`: `export const compile = USE_MOCK ? mockCompile : compileSketch;` — single switch point.
- States: idle → compiling (animated progress with "Gemma 4 reading sketch…" / "Validating pins…") → result | error (show `CompileError.kind` + message + collapsible raw output).

## Sync 1 (~13:45) — when status/A.md says `ENGINE READY`
- Flip `USE_MOCK` off, test one real compile, post **`INTEGRATED`**. If the engine throws, post the error under `## Requests to other session` — don't fix it in `src/engine/`.

## B6–B9 · Make it real (13:45–14:20)
- B6: **Preset images** `public/presets/blink-button.png`, `parking-sensor.png`, `servo-pot.png` — hand-drawn-looking sketches (draw them with your own canvas + stamps and export, so they look like real user input). Post `PRESETS READY` as soon as they exist (A needs them).
  - blink-button: UNO + BUTTON + LED (button toggles LED)
  - parking-sensor: UNO + ULTRASONIC + BUZZER + LED (closer → beep faster)
  - servo-pot: UNO + POT + SERVO (knob turns servo)
- B7: Presets tab: click → loads image into preview → Compile runs live; if it fails or there's no key → `loadCachedResult(id)` with **CACHED** badge.
- B8: error/empty states polish; keyboard shortcut Ctrl+Enter = Compile.
- B9: projector pass: font sizes up, contrast, check 1366×768 and 1920×1080.

## B10–B11 · Ship (14:20–14:40)
- B10: `README.md`: what it is, GIF/screenshot, how it works (sketch → Gemma 4 → validator → Wokwi), run locally (`npm i && npm run dev`, paste Gemini API key in settings), link `src/engine/ENGINE.md`, **"Built with Claude Code"** (AI tools disclosure, required). `CONTRIBUTING.md` with 3–5 good-first-issues (ESP32 target, more parts, Arduino UNO Q App Lab export, i18n Bahasa Indonesia, Wokwi share-link). MIT `LICENSE`.
- B11: Ask Kiell **once** to confirm creating the public GitHub repo, then `gh repo create sketch2sim --public --source . --push`. Post **`PUSHED <url>`**. Draft the OrganizerHQ submission text (title, tagline, what it does, how built, challenges entered, AI tools used) into `status/B.md` for Kiell to paste.
- Optional if time: deploy to GitHub Pages so judges can try it.
