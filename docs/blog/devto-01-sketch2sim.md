---
title: "From a paper sketch to a running circuit: building Sketch2Sim with Gemma 4 in one hack day"
published: true
description: "A photo of a circuit sketch goes in, a Wokwi project that runs comes out. Built solo at MLH Hacktoberfest Hack Day Batam."
tags: hackathon, ai, arduino, opensource
cover_image: https://glatinone.github.io/sketch2sim/blog/cover.png
series: Hackathon log
---

*Hackathon log, part 1. In this series I write up the hackathons I join: what I built, what broke, and where the project goes next.*

Every hardware idea I've seen starts the same way: boxes and lines on paper. "UNO" in one box, "LED" in another, a line between them. Turning that drawing into something that runs is the slow part. You pick pins, remember the resistor, write the firmware, then spend twenty minutes finding the jumper you put in backwards.

On 31 October 2026 I joined the **MLH Hacktoberfest Hack Day** in Batam, Indonesia, hosted by Batam Innovation Center at Politeknik Negeri Batam. I had about two and a half hours of build time, no teammate, and two Claude Code sessions. By the demo I had **Sketch2Sim**: take a photo of a circuit sketch, Gemma 4 reads it, and you get a project that runs in the real Wokwi Arduino simulator.

![A hand-drawn traffic light sketch on notebook paper, and the same circuit running in the Wokwi simulator](https://glatinone.github.io/sketch2sim/blog/before-after.png)

Here is the two-minute demo:

{% youtube bYefFiPMhnQ %}

This post covers what I built, what I learned about Gemma 4 vision, how two AI coding sessions worked in parallel without stepping on each other, and why I think this is the first step of something bigger. If you're a maker, a teacher, or someone who builds simulators or digital twins, the last two sections are for you.

## What Sketch2Sim does

You draw a circuit the way you would on a whiteboard, with labeled boxes and lines. You can take a photo of paper with your phone, upload an image, draw on a canvas in the app, or pick a preset. Sketch2Sim returns two files:

- `diagram.json`: the circuit in Wokwi's format (parts, positions, wires)
- `sketch.ino`: the Arduino firmware that makes the drawn behavior work

Paste both into [Wokwi](https://wokwi.com), press play, and the circuit runs. In the demo, my handwritten note "red > green > yellow, button = pedestrian crossing" became a working traffic light with three LEDs, three resistors and a button.

![Sketch2Sim result view: parts, wiring table with a reason for every pin, and the generated files](https://glatinone.github.io/sketch2sim/blog/app-result.png)

## How it works

![Pipeline: Sketch, then Gemma 4, then the validator, then Wokwi, plus examples of what the validator repairs](https://glatinone.github.io/sketch2sim/blog/pipeline.png)

1. **Gemma 4 reads the image.** I used `gemma-4-26b-a4b-it` through the Gemini API. The prompt contains a catalog of nine Wokwi parts with their exact pin names, a few wiring rules (every LED gets a 220 Ω resistor, buttons use `INPUT_PULLUP`, servos go on PWM pins) and one worked example. The model answers with JSON: parts, wires with a one-line reason per pin, and the firmware.
2. **A validator checks everything.** This is plain TypeScript, with no AI involved. It maps invented part types onto real ones, fixes pin names, adds missing resistors, moves servos to PWM pins, wires forgotten GND and 5V pins, and swaps parts wired with reversed polarity. Every repair is shown in the UI, so you can see exactly where the model was corrected.
3. **Wokwi runs it.** The output is a normal Wokwi project. Nothing about it is specific to my app.

Before I even had an API key, I fed the validator a deliberately broken answer. It made 20 repairs and produced a valid circuit. Later, on real sketches, it caught Gemma wiring a buzzer backwards twice.

![The validator flagging and fixing a reversed buzzer on the air piano sketch](https://glatinone.github.io/sketch2sim/blog/app-autofix.png)

## What I learned about Gemma 4 vision

**It reads topology well.** All six sketches I tested turned into the right parts and connections, including handwritten behavior notes that ended up correctly in the firmware.

**It's weak on electrical details.** Pin names and polarity are where it slips. My takeaway: let the model work out what the sketch *means*, and let deterministic code guarantee the circuit is *valid*. That split is the core idea of the whole project.

**Latency came from thinking, and the API knobs didn't help.** My first compiles took 45 to 104 seconds, which is far too long for a live demo. I logged the token usage of one slow run: 3,209 thought tokens and 1,637 answer tokens at about 47 tokens per second. Gemma 4 on the Gemini API rejected both `thinkingBudget` and `thinkingLevel`. What worked was two lines in the prompt asking for a brief answer: no long deliberation, no code comments, short rationales.

![Bar chart: 104 seconds before prompt tuning, 35 seconds after, with zero thinking tokens](https://glatinone.github.io/sketch2sim/blog/latency.png)

Thought tokens dropped to zero and compiles now take 26 to 34 seconds, with the same output quality.

**The bigger model wasn't the better choice on the day.** On the free tier, `gemma-4-31b-it` succeeded on 3 of 8 calls (the rest returned 500 or 503) and took about 60 seconds when it worked. The 26B model succeeded on 8 of 8. To cut tail latency further, the engine sends two identical requests and keeps whichever returns valid JSON first.

A few smaller things that cost me time, in case they save you some:

- New AI Studio keys (starting with `AQ.`) worked as a `?key=` query parameter but were rejected in the `x-goog-api-key` header.
- An old proxy key in my `GEMINI_API_KEY` environment variable made every call fail with "API key not valid" while the new key was fine.
- Gemma sometimes puts raw line breaks inside JSON strings (the Arduino code), so the parser escapes them before `JSON.parse`.
- In Vite, `typeof import.meta.glob === "function"` is false at runtime, because Vite only rewrites the call itself. My guard around it silently disabled the offline fallback.

## Two Claude Code sessions, one folder, no merge conflicts

I ran two Claude Code sessions in parallel. Session A built the engine (Gemma client, prompt, part catalog, validator, Wokwi builders). Session B built the app (Vite, React and Tailwind, the sketch canvas, camera input, result panels, README, GitHub Pages, and later the slide deck and the demo video).

![Two Claude Code sessions coordinating through one frozen contract file and separate status files](https://glatinone.github.io/sketch2sim/blog/two-sessions.png)

Both worked in the same folder on the same laptop, with no branches and no worktrees. What kept them apart was written down before any code existed:

- **One owner per file.** `src/engine/**` belonged to A, everything else in `src/` to B.
- **A frozen contract.** One TypeScript file with the input and output types and a single function, `compileSketch(input) → CompileResult`. B built the whole UI against a mock and flipped one switch when the engine was ready.
- **Two status files.** Each session wrote only to its own (`status/A.md`, `status/B.md`), with a "Requests to other session" section for anything it needed from the other side.
- **Commit only your own paths.** Never `git add -A`.

My favorite moment: Session B found a bug in Session A's code, wrote the cause and a one-line fix into its *own* status file, and didn't touch the engine. A picked it up and committed the fix a few minutes later. That half page of planning is what let two AI sessions work at full speed without me refereeing them.

## Built for the phone camera

The most natural input is a photo of paper, so the phone is the main device. The mobile layout opens on the camera, uses the phone's native camera app (sharper photos, autofocus, no permission quirks), keeps one big Compile button under your thumb, and scrolls to the result when it's ready. A live compile from a phone took 17.9 seconds in testing.

![Sketch2Sim on a phone: snap the paper, compile with Gemma 4, read the wires with reasons](https://glatinone.github.io/sketch2sim/blog/mobile.png)

## Why this is step one

Sketch2Sim is small on purpose: one board, nine parts, one simulator. But the pattern underneath is general, and that's the part I'm most excited about:

> **A vision model reads intent from a picture. Deterministic code turns that intent into something a simulator is guaranteed to accept.**

Swap the part catalog and the output format, and the same pipeline can target other simulators:

![Roadmap: today Arduino Uno in Wokwi; next ESP32, Pi Pico and Arduino UNO Q; later other simulators like SPICE, PLC ladder logic and MQTT flows; vision: digital twins](https://glatinone.github.io/sketch2sim/blog/roadmap.png)

- **Next, same pipeline with new catalogs:** ESP32 and Raspberry Pi Pico (both already in Wokwi), the Arduino UNO Q, more sensors and displays, a classroom mode, and a Bahasa Indonesia interface.
- **Later, other simulators:** analog circuits (SPICE netlists), PLC ladder logic, pneumatics, IoT message flows. Each one needs its own catalog and validator, while the vision step stays the same.
- **The long-term vision is digital twins.** Point a phone at a control panel, a production line or a lab bench and get a simulated model you can test "what if" scenarios on before anyone touches a wire. Batam is an industrial city with a large vocational campus, so training technicians on a simulated copy of real equipment is a very concrete use case here.

Where this stands today: a one-day hackathon prototype. The roadmap is the direction I want to take it, and every step on it reuses the same split that already works: AI for understanding, code for correctness.

## How you can help

I'd like to keep building this, and it will go faster with other people:

- **Developers:** the repo has five [good first issues](https://github.com/glatinone/sketch2sim/labels/good%20first%20issue), including an ESP32 target, more parts, an Arduino UNO Q export and a Bahasa Indonesia UI. The engine is small and has no dependencies beyond `fetch`, so it's easy to get into.
- **Teachers and lab instructors:** try it with students and tell me where it breaks. Real classroom sketches are the best test data I could get.
- **Companies, labs and sponsors:** if you work on simulation, industrial training or digital twins, or you'd like to support the next stage (API credits, test hardware, a pilot with a school or a factory training center), open an issue or message me on dev.to. I'm happy to talk.

Links:

- Try it: [glatinone.github.io/sketch2sim](https://glatinone.github.io/sketch2sim/) (bring a free Gemini API key, or use a preset without one)
- Code (MIT): [github.com/glatinone/sketch2sim](https://github.com/glatinone/sketch2sim)
- How the engine works: [ENGINE.md](https://github.com/glatinone/sketch2sim/blob/main/src/engine/ENGINE.md)
- Slide deck: [Sketch2Sim deck (PDF)](https://glatinone.github.io/sketch2sim/Sketch2Sim-deck.pdf)

The project is submitted to the **Best Use of Gemma 4** and **Best Open-Source AI Project** challenges. I'll update this post when the results are out.

If you've ever lost an afternoon to a backwards LED, I'd love to hear what you'd want Sketch2Sim to simulate next. Leave a comment, or star the repo if you want to follow along.

---

**Hackathon log: building Sketch2Sim**

1. [From a paper sketch to a running circuit: building Sketch2Sim with Gemma 4 in one hack day](https://dev.to/kielltampubolon/from-a-paper-sketch-to-a-running-circuit-building-sketch2sim-with-gemma-4-in-one-hack-day-2ndm)
2. [Two Claude Code sessions, one folder, no merge conflicts: how I split a hackathon build between AI agents](https://dev.to/kielltampubolon/two-claude-code-sessions-one-folder-no-merge-conflicts-how-i-split-a-hackathon-build-between-ai-3d5n)
3. [What Gemma 4 vision gets right about circuit sketches, and the validator that fixes the rest](https://dev.to/kielltampubolon/what-gemma-4-vision-gets-right-about-circuit-sketches-and-the-validator-that-fixes-the-rest-g18)
4. [From Arduino sketches to digital twins: where Sketch2Sim goes next, and how to get involved](https://dev.to/kielltampubolon/from-arduino-sketches-to-digital-twins-where-sketch2sim-goes-next-and-how-to-get-involved-2bcb)
