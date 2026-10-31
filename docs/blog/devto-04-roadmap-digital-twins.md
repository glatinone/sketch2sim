---
title: "From Arduino sketches to digital twins: where Sketch2Sim goes next, and how to get involved"
published: true
description: "The pattern behind Sketch2Sim (AI reads intent, code guarantees validity) works beyond Arduino. A roadmap, and an open call."
tags: opensource, ai, iot, showdev
cover_image: https://glatinone.github.io/sketch2sim/blog/cover-4.png
series: Hackathon log
---

*Hackathon log, part 4. Parts 1 to 3 cover what Sketch2Sim is, how two AI coding sessions built it in one hack day, and how the Gemma 4 engine works. This last part looks forward.*

Sketch2Sim does one narrow thing today. You photograph a circuit sketch, Gemma 4 reads it, a validator makes the result correct, and you get a project that runs in the Wokwi Arduino simulator. One board, nine parts, one simulator, built in about two and a half hours.

I think the narrow version hides a general pattern, and this post is about that pattern: where it could go, what's realistic, and where I'd like help.

## The pattern underneath

> A vision model reads intent from a picture. Deterministic code turns that intent into something a simulator is guaranteed to accept.

The model is good at understanding a messy drawing. It's unreliable on exact details like pin names and polarity. The validator is the opposite: it understands nothing, but it never lets an invalid circuit through. Every repair it makes is shown to the user, so trust is earned instead of assumed.

None of that is specific to Arduino. Here is what changes and what stays when you point the pipeline at a different simulator:

![Diagram: what stays the same (input, Gemma 4 call, parsing, fixes shown, phone UI) and what is swapped per target (catalog, rules, builder, prompt)](https://glatinone.github.io/sketch2sim/blog/add-target.png)

In the code that's four files: `catalog.ts` (parts and exact pin names), `validate.ts` (target-specific repairs), `wokwi.ts` (the output format) and `prompt.ts` (the catalog table plus one example). Today each of those has exactly one implementation.

## The roadmap

![Roadmap: today Arduino Uno in Wokwi; next ESP32, Pi Pico and Arduino UNO Q; later SPICE, PLC and MQTT simulators; vision: digital twins](https://glatinone.github.io/sketch2sim/blog/roadmap.png)

### Next: same simulator, more hardware

These are small, well-defined pieces of work, and most are already open as [good first issues](https://github.com/glatinone/sketch2sim/labels/good%20first%20issue):

- **ESP32 and Raspberry Pi Pico.** Both are supported in Wokwi. Each needs a board entry in the catalog with its real pin names, plus validator rules for which pins can do PWM, analog input or I2C.
- **Arduino UNO Q.** It was one of the hack day's featured resources: a board that pairs a Linux processor with a microcontroller. Supporting it means generating two programs (a Python app and a sketch) instead of one.
- **More parts.** Displays, relays, more sensors. Each part is a catalog entry and, sometimes, one validator rule.
- **Classroom mode.** A teacher shares a target behavior, students photograph their own sketches, and the validator's list of fixes becomes feedback: "your LED had no resistor" is a repair and a lesson at the same time.
- **A Bahasa Indonesia interface,** because the first users I have in mind are students at vocational campuses like the one that hosted the hack day.

### Later: other simulators

The same split should work for any simulator with a strict input format:

- **Analog circuits.** A sketch of a filter or an amplifier becomes a SPICE netlist. The validator checks that every node connects and every component has a value.
- **PLC ladder logic.** A sketch of a conveyor with sensors and a motor becomes ladder logic for an open-source PLC runtime.
- **Pneumatics and IoT flows.** Valve and cylinder diagrams, or sensor-to-dashboard message flows over MQTT.

I haven't built any of these yet. They're where I think the pattern fits, based on what worked for Arduino.

### The long-term vision: digital twins

A digital twin is a simulated copy of a real system that you can test changes on before touching the real thing. Building one is usually slow, specialist work.

The piece Sketch2Sim could contribute is the first step: **from a picture of the real setup to a valid simulated model**. Photograph a control panel, a production line segment or a lab bench, and get a model that runs, which an engineer then refines. Live sensor data and syncing a model with a running machine are separate, much bigger problems, and I don't claim to solve them.

This matters to me because of where the project started. Batam is an industrial city with a large vocational campus. Training a new technician on a simulated copy of the exact equipment they'll maintain, before they touch a live panel, is a very concrete use case here.

## Where this honestly stands

- It's a one-day hackathon prototype.
- It was tested on six sketches and verified in Wokwi on five circuits.
- It depends on a hosted model (Gemma 4 through the Gemini API). Gemma is open-weights, so a self-hosted version for schools or factories without reliable internet is possible, but I haven't done it.
- Nothing on the roadmap past "Next" is started.

## How you can get involved

**If you write code:** the repo has five [good first issues](https://github.com/glatinone/sketch2sim/labels/good%20first%20issue) (ESP32 target, more parts, Arduino UNO Q export, Bahasa Indonesia UI, one-click Wokwi). The engine is a few small TypeScript files with no dependencies beyond `fetch`, and a new board is mostly a catalog entry plus a few rules. Start with [CONTRIBUTING.md](https://github.com/glatinone/sketch2sim/blob/main/CONTRIBUTING.md).

**If you teach:** try it with students and send me the sketches it got wrong. Real classroom drawings are the best test data I could ask for.

**If you build simulators or work on industrial training:** I'd like to hear which target you would want first, and what format your simulator accepts.

**If you'd like to sponsor the next stage:** the useful things are concrete. API credits for a classroom pilot, a few ESP32 and UNO Q boards to test generated firmware on real hardware, and time to build the classroom mode with a partner school or a training center. Open an issue on the repo or message me here on dev.to.

Links:

- Try it: [glatinone.github.io/sketch2sim](https://glatinone.github.io/sketch2sim/)
- Code (MIT): [github.com/glatinone/sketch2sim](https://github.com/glatinone/sketch2sim)
- Demo video: [youtu.be/bYefFiPMhnQ](https://youtu.be/bYefFiPMhnQ)
- Slide deck: [Sketch2Sim deck (PDF)](https://glatinone.github.io/sketch2sim/Sketch2Sim-deck.pdf)

If you read all four parts: thank you. Tell me in the comments which simulator you'd point this at first. The most requested one goes to the top of the list.

---

**Hackathon log: building Sketch2Sim**

1. [From a paper sketch to a running circuit: building Sketch2Sim with Gemma 4 in one hack day](https://dev.to/kielltampubolon/from-a-paper-sketch-to-a-running-circuit-building-sketch2sim-with-gemma-4-in-one-hack-day-2ndm)
2. [Two Claude Code sessions, one folder, no merge conflicts: how I split a hackathon build between AI agents](https://dev.to/kielltampubolon/two-claude-code-sessions-one-folder-no-merge-conflicts-how-i-split-a-hackathon-build-between-ai-3d5n)
3. [What Gemma 4 vision gets right about circuit sketches, and the validator that fixes the rest](https://dev.to/kielltampubolon/what-gemma-4-vision-gets-right-about-circuit-sketches-and-the-validator-that-fixes-the-rest-g18)
4. [From Arduino sketches to digital twins: where Sketch2Sim goes next, and how to get involved](https://dev.to/kielltampubolon/from-arduino-sketches-to-digital-twins-where-sketch2sim-goes-next-and-how-to-get-involved-2bcb)
