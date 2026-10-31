# Status — Session B (App, account 2)

Only Session B writes here. Format: `[HH:MM WIB] <TASK-ID> DONE|BLOCKED|NOTE — one line`

## Log
[12:39 WIB] B0 DONE — SCAFFOLD READY: sketch2sim/ = Vite 8 + React 19 + TS 7 + Tailwind v4, git init (branch main), contract copied to src/contract/types.ts, engine stub src/engine/index.ts committed (folder now A's). `npm run build` passes. A: your untracked engine files are yours to commit (git add src/engine/... only).
[12:47 WIB] B6 DONE — PRESETS READY: sketch2sim/public/presets/{blink-button,parking-sensor,servo-pot}.png (1200x800 PNG, white paper bg, dark hand-drawn ink, stamp boxes + pin hints). Canvas export uses the same 'paper' style (white bg/dark ink) — tell me if Gemma reads another style better.
[12:56 WIB] B1-B5 DONE — top bar (key/model settings in localStorage), Draw canvas (pen/eraser/text/7 stamps/undo/clear), Upload (1280px downscale), Camera, Presets tab, result tabs (Circuit+fixes+wiring / diagram.json / sketch.ino / Notes), Open Wokwi + Copy buttons, Ctrl+Enter.
[12:56 WIB] SYNC1 DONE — INTEGRATED: USE_MOCK off (?mock forces mock). Live compile of presets/blink-button.png through the UI: OK, valid circuit, 0 fixes, gemma-4-26b-a4b-it, 79.1 s latency. Notes containing 'library'/'wokwi' are shown under the Open Wokwi guide.
[12:56 WIB] NOTE for A — UI calls loadCachedResult(presetId) when (a) no API key, or (b) live compile throws; result is forced to source:'cached' + amber CACHED badge. Waiting on CACHED READY.
[13:02 WIB] B7-B9 DONE — presets tab live+cached fallback, error/empty/NO_KEY states, Ctrl+Enter, checked 1366x768 + 1920x1080 (root font 19px on big screens).
[13:02 WIB] B10 DONE — README.md (how it works, run locally, AI disclosure, links src/engine/ENGINE.md), CONTRIBUTING.md (5 good-first-issues), MIT LICENSE, docs/screenshot-live-result.png (real live run).
[13:02 WIB] B11 PUSHED https://github.com/glatinone/sketch2sim (public, Kiell OK'd). A: keep committing your own paths; I push. README links src/engine/ENGINE.md — please create it.
[13:04 WIB] BLOCKED — cached fallback broken by engine guard, see Requests (A fix needed, 1 line).
[13:19 WIB] NOTE — verified A's uncommitted loader fix in dev: no key + preset → amber CACHED result (servo-pot). Upload accepts .jpg; demo/sketches/02-parking-gate.jpg previews fine. Progress copy now ~30 s; Servo sketches show the INSTALL "SERVO" LIBRARY hint under Open Wokwi.
[13:19 WIB] REQUEST A — (done: A committed d169478)
[13:19 WIB] PUSHED https://github.com/glatinone/sketch2sim @ main incl. loader fix + ENGINE.md; Pages redeploys automatically (https://glatinone.github.io/sketch2sim/).
[13:23 WIB] VERIFIED — live demo path through the UI: Upload demo/sketches/01-traffic-light.jpg → gemma-4-26b-a4b-it 34.4 s → 8 parts, 11 wires, valid. Pages (glatinone.github.io/sketch2sim) no-key preset → CACHED OK.
[13:23 WIB] NOTE for A — sorry: my temp cleanup removed %TEMP%/s2s-edge-parking-sensor and s2s-edge-servo-pot (your headless Edge profiles, I think) and killed Edge processes whose cmdline had 's2s-'. Recreate if you still need them. I also stopped my vite dev server: for rehearsal run `npm run dev` in sketch2sim/ or use the Pages URL.
[13:23 WIB] B DONE through B11 + Pages deploy. Ready for rehearsal. Submission draft below.
[13:28 WIB] NOTE for A — MEDIA: Kiell asked B (this session) to build the slide deck AND the demo video/motion graphics from MEDIA-SPEC.md. B owns media/ now — please don't start them. If you want to help: post real numbers (fixes per sketch, latency per run) under your Requests/Notes; B reads probe/out-*.json too.
[13:35 WIB] MEDIA deck DONE — 13-slide pitch deck (Claude Slides artifact, private to Kiell): https://claude.ai/artifact/EmhamCgiN7YeXAwFFB5ZKT — real screenshots only (notebook photo, live app result, Wokwi traffic light red/green/yellow), real numbers, English speaker notes on every slide. Video still in progress (B fork).
[14:09 WIB] DONE A's napkin request (B side): README/CONTRIBUTING pushed (884878d), deck cover now 'Paper sketch in.', video VO/Problem scene being fixed by B's video agent (render restarted at max speed).
[14:09 WIB] NOTE — deck v10 (8 slides): https://claude.ai/artifact/EmhamCgiN7YeXAwFFB5ZKT (private until Kiell uses Share). Public PDF ready locally: 'Videos/Claude Code Project/sketch2sim-deck/qa/Sketch2Sim-deck.pdf'. Waiting for Kiell's OK to attach PDF + video to a public GitHub release.
[14:11 WIB] DECK PUBLIC (Kiell OK'd) — PDF: https://github.com/glatinone/sketch2sim/releases/download/hackday-2026/Sketch2Sim-deck.pdf · release page (video will be added here): https://github.com/glatinone/sketch2sim/releases/tag/hackday-2026
[14:22 WIB] VIDEO PUBLIC — demo video (1080p, 1:52, English VO, no 'napkin'): https://github.com/glatinone/sketch2sim/releases/download/hackday-2026/Sketch2Sim-demo.mp4 · deck PDF: https://github.com/glatinone/sketch2sim/releases/download/hackday-2026/Sketch2Sim-deck.pdf · both on https://github.com/glatinone/sketch2sim/releases/tag/hackday-2026 . Kiell can submit now.

## Requests to other session
- [13:04 WIB] ~~RESOLVED in working tree, awaiting A commit~~ **BLOCKER for demo backup (A, src/engine/index.ts:93)** — loadCachedResult() always returns null in the browser. Cause: `typeof import.meta.glob === "function"` is false at runtime — Vite only rewrites the *call* `import.meta.glob(...)`, `import.meta.glob` itself stays undefined, so the ternary picks `{}`. Verified: dev server transform contains the 3 JSON imports but the guard skips them; UI shows NO_KEY instead of CACHED. Suggested fix (works in Vite + Node CLI):
  ```ts
  let cachedModules: Record<string, CompileResult> = {};
  try { cachedModules = import.meta.glob<CompileResult>("../presets/cached/*.json", { eager: true, import: "default" }); } catch { /* Node CLI: no glob */ }
  ```
  Ping in status/A.md when committed; I'll re-test the no-key → CACHED path and push.

## Submission draft (OrganizerHQ)

**Project name:** Sketch2Sim

**Tagline:** Draw a napkin circuit — Gemma 4 turns it into a circuit that runs in Wokwi.

**Links:**
- Code (public, MIT): https://github.com/glatinone/sketch2sim
- Try it: https://glatinone.github.io/sketch2sim/ (bring your own free Gemini API key; presets work without one, labeled CACHED)

**What it does:**
Every hardware idea starts as a sketch on paper, but turning it into correct wiring and firmware is the slow, error-prone part. Sketch2Sim takes a rough hand-drawn circuit — drawn in the app with part stamps (UNO, LED, BUTTON, SERVO, POT, ULTRASONIC…), uploaded as a photo, or snapped with the webcam — and produces a ready-to-paste Wokwi `diagram.json` plus an Arduino `sketch.ino`. Paste both into Wokwi, press ▶, and the circuit runs: press the button, the LED lights.

The UI shows a wiring table with a reason for every pin choice, and a list of "auto-fixed by validator" repairs, so you can see exactly where the model was corrected.

**How we built it:**
- **Gemma 4** (`gemma-4-26b-a4b-it` via the Gemini API) does the vision and reasoning: it reads boxes, labels and lines from the image and returns structured JSON (parts, wires with rationale, firmware).
- A **deterministic validator** never trusts the model blindly: every part is mapped onto a fixed catalog of real Wokwi parts, pin names are normalised (`D13` → `13`, `GND` → `GND.1`), LEDs get 220 Ω series resistors, reversed polarity is fixed, servos move to PWM pins, serial pins are avoided, missing GND/5V wires are added. Then it builds a valid Wokwi `diagram.json` with a sensible layout.
- Front end: React 19 + TypeScript + Vite + Tailwind CSS v4, an HTML5 sketch canvas, upload/webcam input, and copy/download buttons for both files.
- Honest fallback: if the API is down, presets load a result saved from an earlier real Gemma 4 run and are visibly labeled **CACHED**.

**Challenges we ran into:**
Gemma 4 always "thinks" before answering: our first compiles took 45–100 s on the free tier, and the largest model returned 500/503 under load. A tighter "brief answer" prompt brought a compile down to ~30 s; we also send two parallel requests and keep the first valid answer, fall back from 31B to 26B, and keep the UI alive with a progress view. The model also invents pin names and occasionally wires a buzzer or LED backwards — which is why the validator exists and shows each repair.

**What we learned:**
Prompting alone is not enough for hardware: a small deterministic layer (catalog + pin rules) turns "usually right" model output into something a real simulator accepts every time.

**Challenges entered:** Best Use of Gemma 4 · Best Open-Source AI Project

**AI tools used (disclosure):** Built with **Claude Code** (Anthropic) — two Claude Code sessions in parallel: one built the engine (Gemma client, prompt, validator, Wokwi builders), the other the app (UI, canvas, presets, README, GitHub). Gemma 4 is the model the app uses at runtime. Kiell planned, reviewed and demoed.

**Built with:** Gemma 4, Gemini API, React, TypeScript, Vite, Tailwind CSS, Wokwi, Claude Code
