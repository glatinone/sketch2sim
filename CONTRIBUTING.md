# Contributing to Sketch2Sim

Thanks for helping turn napkin sketches into running circuits! Sketch2Sim is small on purpose: one React
app, one engine folder, one contract file between them.

## Setup

```bash
npm install
npm run dev        # app on http://localhost:5173 (paste a Gemini API key in Settings)
npm run build      # type-check + production build: run this before opening a PR
```

No API key? Open `http://localhost:5173/?mock` to work on the UI with a built-in mock result.

## Where things live

- `src/contract/types.ts` is the **only** interface between the UI and the engine. Changing it is a breaking
  change: discuss it in an issue first.
- `src/engine/` holds the Gemma 4 client, prompt, Wokwi part catalog, validator/repair and the
  `diagram.json` + firmware builders. Read [`src/engine/ENGINE.md`](src/engine/ENGINE.md) before touching
  the validator.
- `src/components/` and `src/ui/` hold the app. The UI imports the engine only through `src/compileClient.ts`.

## Ground rules

- **Never trust the model.** Anything Gemma returns must pass through the validator; new repairs must be
  reported as a `Fix` so the UI shows them.
- **Honest output.** Cached results must keep `source: "cached"` and the visible CACHED badge.
- **No secrets in the repo.** API keys live in the user's browser (localStorage) only.
- Keep PRs small and focused, and include a screenshot for UI changes.

## Good first issues

1. **ESP32 target.** Add `"esp32"` to `Board`, an ESP32 DevKit entry in the catalog (`wokwi-esp32-devkit-v1`)
   with its pin rules (no analog on ADC2 while Wi-Fi is on, input-only GPIO 34–39), and enable the board
   selector. Wokwi new-project URL: `https://wokwi.com/projects/new/esp32`.
2. **More parts.** Each new part is one catalog entry in `src/engine/catalog.ts` (type, pins, aliases,
   power needs) plus a canvas stamp in `src/ui/sketchOps.ts`. Ideas: SSD1306 OLED (I2C), LCD1602,
   NeoPixel ring, PIR sensor, relay module, photoresistor (LDR).
3. **Arduino UNO Q / App Lab export.** Package the result as an App Lab project (sketch + Python side) so
   it can run on real UNO Q hardware, not only in Wokwi.
4. **Bahasa Indonesia UI.** Extract UI strings and add an `id` locale with a language toggle. Built in
   Batam, so this one matters to us.
5. **Wokwi share link.** Instead of copy-paste, create a Wokwi project directly (or generate a link that
   opens the project pre-filled) so the demo becomes one click.

Pick one, comment on the issue so nobody duplicates work, and open a PR. Questions are welcome as issues.
