---
title: "What Gemma 4 vision gets right about circuit sketches, and the validator that fixes the rest"
published: true
description: "Six hand-drawn circuits through gemma-4-26b-a4b-it: what it reads well, where it slips, and how a 100-second compile became 30."
tags: ai, gemini, arduino, typescript
cover_image: https://glatinone.github.io/sketch2sim/blog/cover-3.png
series: Hackathon log
---

*Hackathon log, part 3. Sketch2Sim turns a photo of a hand-drawn circuit into a Wokwi project that runs. Part 1 is the overview, part 2 is how two AI coding sessions built it. This part is the engine.*

I gave Gemma 4 six hand-drawn circuit sketches during a hack day. It got the parts and connections right on all six, and it wired a buzzer backwards on two of them. That split, good at meaning and shaky on electrical detail, decided how the whole engine is built.

Below: the request that works, the prompt, the validator code, the latency problem and how prompt wording fixed it, and the Gemini API quirks that cost me time. The code is from the [Sketch2Sim repo](https://github.com/glatinone/sketch2sim) (MIT).

![Pipeline: Sketch, then Gemma 4, then the validator, then Wokwi, plus six kinds of repairs](https://glatinone.github.io/sketch2sim/blog/pipeline.png)

## The request that works

The Gemini API exposes two Gemma 4 models. A probe at the start of the day found `gemma-4-31b-it` and `gemma-4-26b-a4b-it`, both with a 262,144 token input limit. Image input, JSON mode and system instructions all work on 26B:

```json
{
  "systemInstruction": { "parts": [{ "text": "<catalog + rules + example>" }] },
  "contents": [{ "role": "user", "parts": [
    { "inline_data": { "mime_type": "image/jpeg", "data": "<base64>" } },
    { "text": "Target board: Arduino Uno. Read the attached sketch and compile it into the JSON object described above." }
  ]}],
  "generationConfig": {
    "temperature": 0.2,
    "responseMimeType": "application/json",
    "thinkingConfig": { "includeThoughts": false }
  }
}
```

An image costs 258 prompt tokens. The model always "thinks" first, and the response can include parts marked `thought: true`, so the client keeps only the others:

```ts
const text = (data.candidates?.[0]?.content?.parts ?? [])
  .filter((p) => !p.thought)
  .map((p) => p.text ?? "")
  .join("");
```

## The prompt: a catalog, rules and one example

The prompt doesn't ask the model to know Wokwi. It hands over a catalog of nine parts with their exact pin names, generated from the same code the validator uses:

```
- wokwi-arduino-uno (Arduino Uno): pins digital 2-13 (PWM: 3,5,6,9,10,11), analog A0-A5, 5V, GND.1, GND.2, GND.3
- wokwi-led (LED): pins A, C attrs e.g. {"color": "red"}
- wokwi-pushbutton (Push button): pins 1.l, 1.r, 2.l, 2.r
- wokwi-servo (Servo): pins GND, V+, PWM
...
```

Then a few wiring rules (every LED goes through a 220 Ω resistor, buttons use `INPUT_PULLUP` to GND, servos on PWM pins, never pins 0 and 1) and one complete worked example for a button and an LED. The example did more for output consistency than any rule.

## What it reads well

All six sketches came back with the right parts and the right connections:

| Sketch | Parts | Wires | Validator fixes | Time |
|---|---|---|---|---|
| Button and LED | 4 | 5 | 0 | 45.2 s* |
| Potentiometer and servo | 3 | 6 | 0 | 51.7 s* |
| Parking sensor | 5 | 9 | 1 (reversed buzzer) | 92.3 s* |
| Traffic light | 8 | 11 | 0 | 33.6 s |
| Parking gate | 7 | 11 | 0 | 31.7 s |
| Air piano | 4 | 9 | 1 (reversed buzzer) | 26.4 s |

*\* before the prompt change described below.*

It also reads handwriting. On the traffic light sketch I wrote "red > green > yellow, button = pedestrian crossing" under the drawing, and that exact sequence showed up in the firmware, with sensible delays.

## Where it slips, and the validator

The mistakes were all electrical details: invented part types (`"led red"`), pin names that don't exist in Wokwi (`D13`, plain `GND`), and polarity. On the parking sensor and the air piano it wired the buzzer's signal to the negative leg.

So the model's JSON never goes straight to the user. A deterministic validator, plain TypeScript, repairs it against the catalog and records every change in `fixes[]`, which the UI shows. Here is the polarity check:

```ts
// polarised two-pin parts wired backwards (signal on the - leg, GND on the + leg) -> swap legs
for (const p of parts.filter((x) => x.type === "wokwi-buzzer" || x.type === "wokwi-led")) {
  const pins = Object.entries(catOf(p.id)?.pins ?? {});
  const neg = pins.find(([, role]) => role === "GND")?.[0];
  const pos = pins.find(([, role]) => role === "SIGNAL")?.[0];
  if (!neg || !pos) continue;
  const negWire = touching(`${p.id}:${neg}`).find((w) => !isGndEnd(other(w, `${p.id}:${neg}`)));
  const posWire = touching(`${p.id}:${pos}`).find((w) => isGndEnd(other(w, `${p.id}:${pos}`)));
  if (!negWire || !posWire) continue;
  // ...swap the two legs and record the fix
  fix("Fixed reversed polarity", `${p.id}: signal on ${neg}, GND on ${pos}`, `signal on ${pos}, GND on ${neg}`);
}
```

![The validator flagging and fixing a reversed buzzer on the air piano sketch](https://glatinone.github.io/sketch2sim/blog/app-autofix.png)

The other repairs work the same way: map the part type onto the catalog, resolve pin aliases (`D13` to `13`, `anode` to `A`), insert a resistor before any LED driven straight from a pin, move a servo off a non-PWM pin and patch the pin number in the firmware, wire forgotten GND and 5V pins, and drop anything that still can't be resolved. Before I had an API key, I tested it on a deliberately broken answer: 20 repairs, valid circuit.

The point of the split: Gemma decides what the sketch *means*. Code guarantees the result is *valid*. Neither does the other's job.

## Latency: 104 seconds to about 30

My first compiles took 45 to 104 seconds. I logged the usage of one slow run on the traffic light sketch:

```json
"usageMetadata": { "promptTokenCount": 1454, "candidatesTokenCount": 1637, "thoughtsTokenCount": 3209 }
```

Two thirds of the output was thinking, at roughly 47 tokens per second. The obvious knobs don't work for Gemma 4 on this API: `thinkingBudget` returns "Thinking budget is not supported for this model" and `thinkingLevel` returns "Thinking level is not supported for this model".

What worked was two sentences in the system prompt:

```
Be fast and brief: decide quickly, do not deliberate or double-check at length. Keep the answer compact:
rationale max 10 words, summary 1 sentence, at most 2 notes, NO comments inside the code, no Serial prints unless needed.
```

The next run on the same sketch reported no thought tokens at all and took 34.6 seconds. The three sketches I compiled after the change came out as accurate as the three before it.

![Bar chart: 104 seconds before prompt tuning, 35 seconds after, with zero thinking tokens](https://glatinone.github.io/sketch2sim/blog/latency.png)

Two more things helped with the long tail. The engine sends **two identical requests and keeps whichever returns parseable JSON first**:

```ts
const attempt = async (prompt: string) => {
  const r = await callWithFallback({ ...base, prompt });
  return { ...r, raw: asCircuit(extractJson(r.text)) };
};
winner = await Promise.any([attempt(userPrompt(input.board)), attempt(userPrompt(input.board))]);
```

And it uses the smaller model. On the free tier during the event, `gemma-4-31b-it` succeeded on 3 of 8 calls (500 "Internal error" or 503 "high demand" otherwise) and took 54 to 61 seconds when it worked. `gemma-4-26b-a4b-it` succeeded on 8 of 8.

## Gemini API gotchas

- **New keys and headers.** The new AI Studio keys (prefix `AQ.`) worked as a `?key=` query parameter but were rejected in the `x-goog-api-key` header.
- **A stale environment variable.** My laptop had an unrelated proxy key in `GEMINI_API_KEY`, so every call failed with "API key not valid" while the new key was fine. The CLI now reads the key from a local `.env` first.
- **JSON mode isn't a schema.** Once, 26B returned a top-level array instead of the object I asked for. The engine accepts the first object inside an array.
- **Raw newlines in strings.** Gemma sometimes puts literal line breaks inside JSON strings (the Arduino code). The parser walks the text, escapes newlines inside strings, and drops trailing commas before `JSON.parse`.

## Wokwi gotchas

- `diagram.json` connections are `[from, to, color, route]`, and an empty route `[]` is valid.
- Uno ground pins are `GND.1` (top header) and `GND.2` / `GND.3` (bottom). Routing each part to the nearest one keeps wires from crossing the chip.
- Sketches with `#include <Servo.h>` fail on the first build with "Servo.h: No such file or directory"; Wokwi offers a one-click "Install Servo library" button.
- Simulation speed dropped to 3 to 10 percent while my CPU was busy with other tabs and a video render. Close everything before a live demo.

All five circuits I verified ran correctly in Wokwi. The full engine notes are in [ENGINE.md](https://github.com/glatinone/sketch2sim/blob/main/src/engine/ENGINE.md).

*Next in the series: part 4, where this pattern could go after Arduino, from other simulators to digital twins, and how to get involved.*

---

**Hackathon log: building Sketch2Sim**

1. [From a paper sketch to a running circuit: building Sketch2Sim with Gemma 4 in one hack day](https://dev.to/kielltampubolon/from-a-paper-sketch-to-a-running-circuit-building-sketch2sim-with-gemma-4-in-one-hack-day-2ndm)
2. [Two Claude Code sessions, one folder, no merge conflicts: how I split a hackathon build between AI agents](https://dev.to/kielltampubolon/two-claude-code-sessions-one-folder-no-merge-conflicts-how-i-split-a-hackathon-build-between-ai-3d5n)
3. [What Gemma 4 vision gets right about circuit sketches, and the validator that fixes the rest](https://dev.to/kielltampubolon/what-gemma-4-vision-gets-right-about-circuit-sketches-and-the-validator-that-fixes-the-rest-g18)
4. [From Arduino sketches to digital twins: where Sketch2Sim goes next, and how to get involved](https://dev.to/kielltampubolon/from-arduino-sketches-to-digital-twins-where-sketch2sim-goes-next-and-how-to-get-involved-2bcb)
