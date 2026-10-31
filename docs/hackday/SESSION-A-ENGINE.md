# Session A — ENGINE (account 1 Claude Code)

Paste this whole file as your first prompt. Read `PLAN.md` and `contract/types.ts` first.

**You own:** `probe/**`, `status/A.md`, `sketch2sim/src/engine/**`, `sketch2sim/src/presets/cached/**`, `sketch2sim/scripts/run-engine.ts`.
**You never edit:** anything else. Not `package.json`, not `src/App.tsx`, not components, not README.
**No new npm deps.** Use `fetch`. Run TS directly with Node 24 type stripping: `node scripts/run-engine.ts <image>`.
→ Use `.ts` extensions in relative imports (`import { x } from "./catalog.ts"`) so it works in both Node and Vite. No TS enums, no parameter properties (`erasableSyntaxOnly`).

Goal: `compileSketch(input)` returns a `CompileResult` whose `diagramJson` + `sketchIno` **paste into Wokwi and run on first try**, every time, for the 3 presets.

---

## A0 · Probe Gemma 4 (12:40–12:55) — in `probe/`, before the app exists
API key: env `GEMINI_API_KEY` (Kiell gives it; never commit it, never write it to any file in `sketch2sim/`).
1. `GET https://generativelanguage.googleapis.com/v1beta/models?key=$KEY&pageSize=200` → list every model whose name contains `gemma`. Record the exact Gemma 4 ids (prefer the largest multimodal instruction-tuned one).
2. Send one `generateContent` with a small PNG (`inline_data`) + "describe this image" → confirm **image input works** for that model.
3. Test whether `generationConfig.responseMimeType: "application/json"` is accepted. Test whether `systemInstruction` is accepted. (Older Gemma on this API rejected both → then put the instructions inside the user turn and parse JSON from text.)
4. Measure latency.
5. Write to `status/A.md`: model ids, image ok?, JSON mode ok?, systemInstruction ok?, latency, the exact request shape that works.

**If image input doesn't work for any Gemma 4 model:** post `BLOCKED A0` with details and stop — Kiell decides the fallback (CircuitLens).

## A1 · Part catalog — `src/engine/catalog.ts` (wait for `SCAFFOLD READY` in status/B.md)
Whitelist of ~8 Wokwi parts with **exact pin names**. Verify each against https://docs.wokwi.com/parts/<type> (fetch the docs page; don't trust memory). Starting draft — **verify, don't assume**:

| type | pins (draft) | notes |
|---|---|---|
| `wokwi-arduino-uno` | `0`..`13`, `A0`..`A5`, `5V`, `3.3V`, `GND.1`, `GND.2`, `GND.3`, `VIN` | id always `uno` |
| `wokwi-led` | `A`, `C` | attrs `color` |
| `wokwi-resistor` | `1`, `2` | attrs `value` (ohms) |
| `wokwi-pushbutton` | `1.l`, `1.r`, `2.l`, `2.r` | attrs `color` |
| `wokwi-buzzer` | `1`, `2` | |
| `wokwi-potentiometer` | `GND`, `SIG`, `VCC` | |
| `wokwi-servo` | `GND`, `V+`, `PWM` | |
| `wokwi-hc-sr04` | `VCC`, `TRIG`, `ECHO`, `GND` | |
| `wokwi-dht22` | `VCC`, `SDA`, `NC`, `GND` | optional |
| `board-ssd1306` | `GND`, `VCC`, `SCL`, `SDA` | optional, needs library — skip if time is short |

Also per part: which Uno pins are legal (PWM pins 3,5,6,9,10,11; analog A0–A5; I2C A4/A5), default wire color by signal, default position (`top`/`left`) for layout.

## A2 · Prompt — `src/engine/prompt.ts`
- Tell Gemma: read the sketch, choose parts **only from the catalog** (include the catalog table in the prompt), assign Uno pins, give rationale per wire, write the Arduino sketch.
- Output: **one JSON object**, no prose. Schema = `{ projectTitle, summary, parts[], wires[], sketchIno, notes[] }` (mirror of contract, minus fields the engine computes).
- Rules in prompt: LEDs always get a 220Ω resistor in series; buttons use `INPUT_PULLUP` wired to GND; servo on a PWM pin; never use pins 0/1.
- Include **one short worked example** (button + LED) to anchor the format.

## A3 · Gemma client — `src/engine/gemma.ts`
- `fetch` to `.../v1beta/models/${modelId}:generateContent?key=${apiKey}` using the shape that worked in A0.
- Timeout 45s via `AbortController` → `CompileError("…","TIMEOUT")`. Non-200 → `"API"`. Missing key → `"NO_KEY"`.
- Low temperature (0.2).

## A4 · Parse + validate + repair — `src/engine/parse.ts`, `src/engine/validate.ts`
This is the "Learning"/"Technology" story — make it solid.
- Parse: strip ``` fences, take the first balanced `{…}`, `JSON.parse`. Fail → one retry call with "Return ONLY valid JSON" + the error. Still fail → `CompileError("…","PARSE", raw)`.
- Validate & **repair**, recording every change into `fixes[]`:
  - unknown part type → map to closest catalog type (e.g. `led` → `wokwi-led`) or drop it
  - unknown pin name → map by alias (`GND` on uno → `GND.1`, `D13` → `13`, `+`/`anode` → `A`) else drop the wire
  - LED without resistor → insert `r_ledX` 220Ω between pin and anode
  - servo on non-PWM pin → move to a free PWM pin, **and patch the pin number in sketchIno**
  - duplicate pin use, wires to missing parts → fix or drop
  - ensure every part has GND/power wired
- If after repair there's no MCU or zero valid wires → `CompileError("…","VALIDATION", raw)`.

## A5 · Builders + entry — `src/engine/wokwi.ts`, `src/engine/index.ts`
- `diagramJson`: `{ version: 1, author: "Sketch2Sim", editor: "wokwi", parts: [{type,id,top,left,attrs}], connections: [["uno:13","r1:1","green",[]], …], dependencies: {} }` — check exact shape against a real Wokwi example project.
- Auto-layout: Uno at center, peripherals in a ring / column to the right; positions from catalog defaults + index offset. Doesn't need to be pretty, needs to not overlap.
- `sketchIno`: from Gemma, but after pin patches. Sanity check it contains `setup(` and `loop(`; if not → fall back to a generated template per part set.
- `index.ts` exports exactly what PLAN.md lists (`DEFAULT_MODEL_ID`, `compileSketch`, `loadCachedResult`, `PRESET_IDS`). Replace B's stub, keep the signatures.
- `scripts/run-engine.ts <image>` → prints the result + writes `probe/out-<name>.json`.
→ When it works on ≥1 image: commit your paths, post **`ENGINE READY`** in `status/A.md`.

## A6–A8 · Make it real (after B posts preset PNGs in `public/presets/`)
- A6: run all 3 presets (`blink-button`, `parking-sensor`, `servo-pot`). Tune prompt/validator until all 3 are valid.
- A7: save each result as `src/presets/cached/<id>.json` with `source: "cached"`. `loadCachedResult` imports them. Post **`CACHED READY`**.
- A8: **verify in real Wokwi**: open https://wokwi.com/projects/new/arduino-uno (use the browser-skill / jevbsk in Kiell's Edge), paste diagram.json + sketch.ino, press Play, confirm it behaves. Record pass/fail per preset in status. Fail → fix validator, rerun.

## A9 · Ship (14:20–14:40)
- Write `sketch2sim/src/engine/ENGINE.md` (short: pipeline diagram, what the validator repairs, what we learned about Gemma 4 vision). B links it from README.
- Bug fixes only after 14:40.
