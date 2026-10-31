# Sketch2Sim build log

The full record of how Sketch2Sim was planned, built, shipped and shared, starting at MLH Hacktoberfest Hack Day Batam on 31 October 2026. All times are WIB (UTC+7). Numbers come from the status files, engine runs and commit history in this repo.

- **What it is:** take a photo of a hand-drawn circuit sketch, Gemma 4 reads it, a deterministic validator repairs the result, and you get a Wokwi `diagram.json` + `sketch.ino` that run in the real simulator.
- **Who:** Kiell Tampubolon (solo entrant), working with two Claude Code sessions plus subagents.
- **Event:** MLH Hacktoberfest Hack Day, Kota Batam x Batam Innovation Center, Politeknik Negeri Batam. Build 11:00 to 15:00, submissions closed 16:00.
- **Challenges entered:** Best Use of Gemma 4, Best Open-Source AI Project. Result: pending at the time of writing.

## Links

| What | Where |
|---|---|
| Web app | https://glatinone.github.io/sketch2sim/ |
| Demo video (2 min, unlisted) | https://youtu.be/bYefFiPMhnQ |
| Vertical short (36 s) | YouTube Shorts https://youtube.com/shorts/26oKRjytSj4 · TikTok https://www.tiktok.com/@glatinone/video/7702759250539367701 |
| Slide deck | https://glatinone.github.io/sketch2sim/Sketch2Sim-deck.pdf |
| Engine write-up | [src/engine/ENGINE.md](../src/engine/ENGINE.md) |
| dev.to series "Hackathon log" | [1](https://dev.to/kielltampubolon/from-a-paper-sketch-to-a-running-circuit-building-sketch2sim-with-gemma-4-in-one-hack-day-2ndm) · [2](https://dev.to/kielltampubolon/two-claude-code-sessions-one-folder-no-merge-conflicts-how-i-split-a-hackathon-build-between-ai-3d5n) · [3](https://dev.to/kielltampubolon/what-gemma-4-vision-gets-right-about-circuit-sketches-and-the-validator-that-fixes-the-rest-g18) · [4](https://dev.to/kielltampubolon/from-arduino-sketches-to-digital-twins-where-sketch2sim-goes-next-and-how-to-get-involved-2bcb) |
| Good first issues | [#1 to #5](https://github.com/glatinone/sketch2sim/labels/good%20first%20issue) |

## Choosing the idea

The event page listed exactly three resources: Gemma 4 docs, the Wokwi simulator and the Arduino UNO Q. Judging weighed technology, design, completion and learning equally and explicitly did not judge pitch or idea quality. Candidates considered: a prompt-injection linter, an MFA anomaly proxy, an offline QR ticket validator, CircuitLens (debug a breadboard photo), Sketch2Sim, and a sketch-to-threat-model variant.

Sketch2Sim was the only idea using all three resources. Its first spec (custom SVG simulator, UNO Q hybrid firmware, three-panel CAD UI) was too big for about 2.5 hours of build time. A decision model (`typesafe/jev-1.13`) picked the trimmed version with 0.73 probability and put the full spec's chance of finishing at 0.03. The cut: Wokwi itself is the simulator, Arduino Uno only, and Gemma may only use a fixed catalog of Wokwi parts.

## How the work was split

Two Claude Code sessions on two accounts, one folder, no branches. The plan, briefs and protocol are in [`docs/hackday/`](hackday/):

- [PLAN.md](hackday/PLAN.md): file ownership table, timeline, status protocol, demo outline.
- [SESSION-A-ENGINE.md](hackday/SESSION-A-ENGINE.md) and [SESSION-B-APP.md](hackday/SESSION-B-APP.md): the two briefs.
- [contract-types.ts](hackday/contract-types.ts): the frozen interface between engine and app.
- [status-A-engine.md](hackday/status-A-engine.md) and [status-B-app.md](hackday/status-B-app.md): the live coordination logs from the day, unedited apart from account names.

Session A built the engine and later the mobile UI; Session B built the app, README, Pages deploy, slide deck and demo video. Subagents handled the Gemini API key and Gemma probe, Wokwi pin research, verification in the real Wokwi editor, an end-to-end test, mobile QA, YouTube and TikTok uploads, and filling the submission form (stopped before submit; Kiell reviewed and submitted himself).

## Timeline

| WIB | Event |
|---|---|
| ~12:31 | Plan, contract and both briefs written |
| 12:39 | Session B: scaffold ready (Vite 8, React 19, Tailwind v4), engine stub committed |
| 12:43 | Gemini API key created; Gemma 4 confirmed: image input, JSON mode, system instruction |
| ~12:45 | Engine code complete; offline test turned one broken model answer into a valid circuit with 20 repairs |
| 12:52 | Engine ready: first live compile of a hand-drawn sketch |
| 12:56 | App switched from mock to the real engine |
| 13:02 | README, CONTRIBUTING, MIT license, public repo |
| 13:08 | Three presets plus cached fallbacks; reversed-polarity rule added after Gemma wired a buzzer backwards |
| ~13:11 | Prompt tuning: compile time from 45 to 104 s down to 26 to 34 s |
| 13:18 | Cached-fallback bug (found by Session B) fixed; ENGINE.md written |
| 13:35 | 5 of 5 generated circuits verified running in Wokwi; deck done |
| 13:48 | End-to-end test on the live app passes (38.7 s live compile) |
| ~14:10 | Mobile-first UI (camera first, native capture, sticky Compile) shipped and QA'd |
| 14:22 | Demo video done |
| ~14:35 | Video on YouTube, deck online, submission form filled for review |
| ~14:50 | Kiell submits |
| 15:02 | dev.to series parts 1 to 4 published; 5 good first issues opened |
| ~16:00 | Vertical short rendered and posted to YouTube Shorts and TikTok |

## Results from the engine

| Sketch | Parts | Wires | Validator fixes | Compile time |
|---|---|---|---|---|
| Button and LED | 4 | 5 | 0 | 45.2 s (before tuning) |
| Potentiometer and servo | 3 | 6 | 0 | 51.7 s (before tuning) |
| Parking sensor | 5 | 9 | 1, reversed buzzer | 92.3 s (before tuning) |
| Traffic light | 8 | 11 | 0 | 33.6 s |
| Parking gate | 7 | 11 | 0 | 31.7 s |
| Air piano | 4 | 9 | 1, reversed buzzer | 26.4 s |

- `gemma-4-26b-a4b-it`: 8 of 8 probe calls succeeded. `gemma-4-31b-it`: 3 of 8 (500/503 otherwise), 54 to 61 s when it worked.
- One slow run: 3,209 thought tokens + 1,637 answer tokens, 104 s. `thinkingBudget` and `thinkingLevel` are rejected for Gemma 4. A two-line "be brief" instruction in the prompt brought thought tokens to 0 and the same sketch to 34.6 s.
- Wokwi verification screenshots exist for button/LED, servo/pot, parking sensor, traffic light and parking gate.

## Changes, commit by commit

Times converted to WIB.

| Commit | WIB | Change |
|---|---|---|
| 9526fbf | 12:39 | Scaffold Vite React-TS + Tailwind v4, contract, engine stub |
| c8c78fa | 12:39 | oxlint config |
| a8bb254 | 12:41 | Engine: Gemma client, JSON parser, Wokwi catalog, validator/repair, diagram + firmware builders |
| c5ef932 | 12:43 | Catalog aligned with verified Wokwi pins, wire palette, Servo library note |
| d00fc57 | 12:47 | Hand-drawn preset sketches + generator |
| 26e0e1d | 12:49 | Gemma 4 26B default, JSON mode, 500/503 fallback, `?key=` auth |
| f7d8fbe | 12:54 | Top bar, sketch canvas with stamps, upload/camera/presets, result panels, mock compile |
| fd64e45 | 12:56 | Switch UI to the real engine, progress stages, Wokwi notes |
| 8f7e6ac | 12:58 | Hedged double request, reversed-polarity fix, cached preset results |
| 7431b5b | 12:59 | Header-aware layout (digital parts above the Uno, analog below) |
| 68b19fc | 12:59 | README, CONTRIBUTING, MIT license, live screenshot |
| b770aef | 13:03 | GitHub Pages deploy workflow |
| cd1d027 | 13:11 | Brief-answer prompt: latency ~100 s to ~30 s, 150 s timeout |
| d169478 | 13:18 | Fix cached presets in the browser (`import.meta.glob` guard) |
| ec68094 | 13:18 | ENGINE.md |
| 25cdc63 | 13:19 | Servo library hint, ~30 s progress copy |
| 501e259 | 13:26 | GND routed to the nearest header so wires don't cross the chip |
| 884878d | 14:06 | "Paper sketch" wording in README and CONTRIBUTING |
| 8dd3367 | 14:10 | Mobile-first layout |
| 00e8db5 | 14:15 | Mobile polish (scrollbars, settings backdrop, aria labels) |
| ec14727 | 14:40 | Deck PDF on GitHub Pages |
| 6d4b1e9 | 14:52 | Blog illustrations |
| 5ebc759 | 14:58 | Series covers, timeline, add-a-target diagram |

## What broke, and what we learned

1. **Gemma 4 is good at meaning, weak on electrical detail.** It read topology and handwriting correctly every time, and made pin-name and polarity mistakes. The deterministic validator is the core of the design for that reason.
2. **Latency was thinking, not output.** Prompt wording fixed what API parameters couldn't.
3. **API key gotchas.** New `AQ.` keys work as `?key=` but not in the `x-goog-api-key` header, and a stale `GEMINI_API_KEY` env var (an unrelated proxy key) made every call fail until the CLI read `.env` first.
4. **`import.meta.glob` is not a runtime value** in Vite; a `typeof` guard silently disabled the offline fallback.
5. **Parallel AI sessions need file ownership, a frozen contract and one status file each.** Zero merge conflicts all day.
6. **Cleanup must be scoped to what you created.** One session's cleanup deleted the other's temp browser profiles.
7. **Unsaved state in an agent-owned browser window is fragile.** The submission form was lost once when a browser session ended and had to be filled again.
8. **Agents prepare, humans press submit.** The submission was stopped before sending so Kiell could review it.
9. **Wokwi details.** Servo sketches need the one-click "Install Servo library"; simulation speed drops to 3 to 10 percent when the CPU is busy.

## Media and distribution

- Demo video (Remotion, English TTS voice-over, real screen recordings) and a 4:5 social cut; source in [`media/video/`](../media/video/).
- Vertical 9:16 short (composition `Sketch2SimShort`, `npm run render:short`), with word-highlighted captions and a "creator labeled as AI-generated" label on TikTok because the narration is synthetic.
- Slide deck (PDF) and blog illustrations in [`public/blog/`](../public/blog/).
- dev.to series sources in [`docs/blog/`](blog/).

## Next

See part 4 of the series and the good first issues: ESP32 and Pi Pico targets, Arduino UNO Q export, more parts, a Bahasa Indonesia UI, a one-click Wokwi flow, then other simulators (SPICE, PLC, MQTT) and, long term, digital twins for technician training.
