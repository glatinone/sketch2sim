# Sketch2Sim — MLH Hacktoberfest Hack Day Batam (31 Oct 2026)

**One line:** draw a rough circuit sketch (or photo of paper) → Gemma 4 reads it → Sketch2Sim outputs a Wokwi `diagram.json` + `sketch.ino` that **actually runs in the real Wokwi simulator** on stage.

**Hard deadline:** build ends **15:00 WIB** (= 16:00 on the laptop clock, which is UTC+8). Feature freeze **14:40 WIB**.

**Challenges entered:** Best Use of Gemma 4 · Best Open-Source AI Project.
**Rules that matter:** code must be public on GitHub, list AI tools used in submission (Claude Code), live demo, no pitch deck.

---

## Two Claude Code sessions, zero overlap

| | Session A — **account 1** account | Session B — **account 2** account |
|---|---|---|
| Role | **Engine** (brain): Gemma call, prompt, Wokwi part catalog, validator/repair, firmware | **App** (face): scaffold, UI, canvas, upload/webcam, result panels, presets, README, GitHub |
| Brief | `SESSION-A-ENGINE.md` | `SESSION-B-APP.md` |
| Status file (only this session writes it) | `status/A.md` | `status/B.md` |

Both sessions work in the **same folder on the same laptop**. No branches, no worktrees. Overlap is prevented by **file ownership**, not by git.

### File ownership (the boundary)

```
Videos/MLH/
├── PLAN.md, SESSION-*.md        ← nobody edits during build (Kiell/orchestrator only)
├── contract/types.ts            ← frozen contract (B copies it into the app at Phase 0)
├── status/A.md                  ← A only
├── status/B.md                  ← B only
├── probe/                       ← A only (API probe scripts, throwaway)
└── sketch2sim/                  ← the app + git repo
    ├── package.json, vite/ts config, index.html, .gitignore   ← B only
    ├── README.md, CONTRIBUTING.md, LICENSE                    ← B only
    ├── public/presets/*.png      ← B only (preset sketch images)
    ├── src/contract/types.ts     ← FROZEN (change = note in both status files first)
    ├── src/engine/**             ← A only  (B creates the stub once, then hands over)
    ├── src/presets/cached/*.json ← A only  (last-good results for presets)
    ├── scripts/run-engine.ts     ← A only  (CLI to test engine on an image)
    └── src/** everything else    ← B only  (App.tsx, components/, ui/, styles, compileClient.ts)
```

**Rule of thumb:** if a file isn't yours, don't open it for writing. Need a change in the other side's file → write the request in **your** status file under `## Requests to other session`, the other session picks it up.

### The only interface between A and B

```ts
// sketch2sim/src/engine/index.ts  (A)
export const DEFAULT_MODEL_ID: string;
export const compileSketch: CompileSketch;          // see contract/types.ts
export function loadCachedResult(presetId: string): CompileResult | null;
export const PRESET_IDS: readonly string[];         // e.g. ["blink-button","parking-sensor","servo-pot"]
```

B never imports anything else from `src/engine/`. A never imports anything from outside `src/engine/` and `src/contract/`.

### Git rules (same working tree, two sessions)
- B runs `git init` in Phase 0.
- **Commit only your own paths**: `git add <your paths> && git commit -m "..."`. Never `git add -A` / `git add .`.
- `index.lock` error → the other session is committing; wait a few seconds and retry.
- **Only B** runs `npm install` / edits `package.json`. A's engine uses `fetch` only, **no new deps**. If A truly needs a dep → request in `status/A.md`.
- **Only B** pushes to GitHub (needs Kiell's OK once for creating the public repo).
- Neither session runs formatters/linters across the whole repo.

---

## Timeline (WIB)

| Time (WIB) | Phase | Session A (Engine) | Session B (App) |
|---|---|---|---|
| 12:40–12:55 | **0 · Setup** | A0: Probe Gemma 4 on Gemini API (model id, image input, JSON mode) in `probe/`. Write findings to `status/A.md`. | B0: Scaffold Vite React-TS + Tailwind in `sketch2sim/`, git init, copy contract, create **engine stub**, first commit. Post `SCAFFOLD READY` in `status/B.md`. |
| 12:55–13:45 | **1 · Build core** | A1–A5: catalog → prompt → gemma client → parse/validate/repair → diagram.json + .ino builder → CLI test. | B1–B5: layout + top bar → sketch canvas → upload/webcam → result panels (wiring table, diagram.json, sketch.ino, fixes) → mock compile. |
| **13:45** | **Sync 1** | Post `ENGINE READY` in `status/A.md` (CLI works on ≥1 image). | Switch `compileClient.ts` from mock to real engine. Post `INTEGRATED`. |
| 13:45–14:20 | **2 · Make it real** | A6–A8: run 3 preset PNGs, tune prompt until all 3 pass validator, save cached results, verify in real Wokwi (paste + Play). | B6–B9: preset images, loading/error/"cached" states, "Open Wokwi" flow, polish for projector. |
| 14:20–14:40 | **3 · Ship** | A9: engine bug fixes only, write `ENGINE.md` (how the validator works — "Learning" story). | B10–B11: README + CONTRIBUTING (good-first-issues), push public repo, OrganizerHQ submission text. |
| **14:40** | **Freeze** | No new features. Bug fixes only. | Same. |
| 14:40–15:00 | **4 · Rehearse** | Run the demo end-to-end twice (see `DEMO.md` section below). | Same, on the projector resolution. |

If you're behind at Sync 1: **cut scope, not the deadline**. Cut order: webcam → canvas stamps → fixes panel → BOM tab. Never cut: upload/canvas → compile → diagram.json + sketch.ino → works in Wokwi.

---

## Status protocol

Each session keeps its own status file. Append lines, newest at bottom, format:
```
[HH:MM WIB] <TASK-ID> DONE|BLOCKED|NOTE — one line
```
Signals the other session waits for: `SCAFFOLD READY` (B), `ENGINE READY` (A), `INTEGRATED` (B), `CACHED READY` (A), `PUSHED <repo url>` (B).

Read the other session's status file **before each new task**.

---

## After freeze: media
Deck, demo video, motion graphics → spec in `MEDIA-SPEC.md`. Not built until the app works. During rehearsal (14:40–15:00) record the raw clips listed there.

## Demo (2 minutes, live, no slides)

1. **0:00–0:15** — "From a paper sketch to a running circuit."
2. **0:15–0:40** — Draw on the canvas: box "UNO", box "BUTTON", box "LED", lines between. (Or hold paper to webcam / upload photo.) Press **Compile**.
3. **0:40–1:05** — Show wiring table with pin rationales + the "auto-fixed by validator" chips (proves we don't blindly trust the model).
4. **1:05–1:40** — **Copy diagram.json + sketch.ino → Wokwi tab (pre-opened) → paste → Play → press the button, LED lights.** This is the wow moment.
5. **1:40–2:00** — "Gemma 4 does the vision + reasoning; a deterministic validator guarantees the output is a valid Wokwi circuit. Open source, built today with Claude Code."

Backup if Wi-Fi/API dies: load a preset → result marked **CACHED** (honest label) → still paste into Wokwi.
