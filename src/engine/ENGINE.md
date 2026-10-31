# Sketch2Sim engine

`compileSketch(input) → CompileResult` turns a sketch image into a Wokwi `diagram.json` + Arduino `sketch.ino`.
No dependencies beyond `fetch`; runs in the browser and in Node 24 (`node scripts/run-engine.ts <image>`).

```
image ──▶ gemma.ts ──▶ parse.ts ──▶ validate.ts ──▶ wokwi.ts ──▶ CompileResult
          Gemma 4      JSON out of     repair against   diagram.json layout
          (vision)     model text      catalog.ts       + fallback firmware
```

| File | Job |
|---|---|
| `prompt.ts` | System prompt: the part catalog with exact pin names, wiring rules, one worked example, and a "be brief" instruction. |
| `gemma.ts` | Gemini API call (`gemma-4-26b-a4b-it`, JSON mode, system instruction, 150 s timeout). Drops `thought` parts. |
| `index.ts` | Sends **two identical requests in parallel** and keeps the first one that parses. Retries on 500/503, and re-asks once if both answers are broken JSON. |
| `parse.ts` | Strips code fences, takes the first balanced `{…}`, escapes raw newlines inside strings, drops trailing commas. |
| `catalog.ts` | The 9 Wokwi parts we accept, with pin names checked against the Wokwi docs and the `wokwi-cli` diagram linter, plus pin aliases (`D13`→`13`, `GND`→`GND.1`, `anode`→`A`, …). |
| `validate.ts` | The deterministic repair pass (below). Every change is reported in `fixes[]` and shown in the UI. |
| `wokwi.ts` | `diagram.json` builder with a header-aware layout (digital parts above the Uno, analog parts below, resistors next to their LED), plus a template firmware for when the model's sketch has no `setup()`/`loop()`. |

## What the validator repairs

1. **Part types**: maps invented types onto the catalog (`"led red"` → `wokwi-led`, `"Arduino UNO"` → `wokwi-arduino-uno`) and drops anything unsupported.
2. **Microcontroller**: forces exactly one Uno with id `uno` and rewires references to it.
3. **Pin names**: resolves aliases and drops wires to pins that don't exist.
4. **Reversed polarity**: if a buzzer or LED has its signal on the `−` leg and GND on the `+` leg, the legs are swapped.
5. **Servo on a non-PWM pin**: moves it to a free PWM pin and patches the pin number in the firmware.
6. **LED without resistor**: inserts a 220 Ω resistor in series.
7. **Missing power**: wires any forgotten GND/5V pins to the Uno rails.
8. **Serial pins 0/1**: moves the wire to a free pin and patches the firmware.
9. **Orphans**: drops parts that have no wires.

## What we learned about Gemma 4 vision

Real numbers from the build day (31 Oct 2026):

- **It reads topology well.** All 6 test sketches gave the right parts and connections, including handwritten behaviour notes like "red > green > yellow, button = pedestrian crossing", which ended up correctly in the firmware.
- **It's weak on electrical details**, which is why the validator exists. On the air-piano sketch and on the parking-sensor sketch, it put the buzzer in backwards both times. The validator caught both.
- **Latency was dominated by thinking.** One compile produced ~3,200 thought tokens and ~1,600 answer tokens at ~47 tokens/s, which took 104 s. `thinkingBudget` and `thinkingLevel` are rejected for Gemma 4. Asking for a brief answer in the prompt dropped thought tokens to 0, and compiles now take **26–34 s** with the same quality.
- **Gemma 4 31B** was unreliable on the free tier during the event: 3 of 8 calls succeeded, the rest returned 500/503, and successful calls took ~60 s. 26B-A4B succeeded on 8 of 8, so it is the default.
- **Verified in real Wokwi**: blink-button, servo-pot and parking-sensor load, compile and behave as drawn. Sketches with a servo need Wokwi's one-click "Install Servo library".
