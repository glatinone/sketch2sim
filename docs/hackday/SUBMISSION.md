# Sketch2Sim — MLH submission text (final)

Submit at: https://www.mlh.com/events/hacktoberfest-hack-day-kota-batam-x-batam-innovation-center/submissions/new
Deadline: Oct 31, 4:00 PM WIB (target: before 3:00 PM WIB)
Demo screenshots: probe/e2e/*.png, probe/wokwi-check/*.png, sketch2sim/docs/screenshot-live-result.png

**Project name:** Sketch2Sim

**Tagline:** From a paper sketch to a running circuit. Gemma 4 reads your drawing, Sketch2Sim makes it run in Wokwi.

**Links:**
- Demo video (YouTube): https://youtu.be/bYefFiPMhnQ
- Slide deck (PDF): https://glatinone.github.io/sketch2sim/Sketch2Sim-deck.pdf
- Code (public, MIT): https://github.com/glatinone/sketch2sim
- How the engine works + what we learned about Gemma 4: https://github.com/glatinone/sketch2sim/blob/main/src/engine/ENGINE.md
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
