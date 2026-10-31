# Sketch2Sim demo video: script and shot list

**Output:** `out/sketch2sim-demo-1080p.mp4` (1920x1080, 30 fps, 111.9 s) and `out/sketch2sim-demo-4x5.mp4` (1080x1350 social cut).
**Voice:** Microsoft neural TTS `en-US-AndrewMultilingualNeural` (edge-tts, rate -4%), one take per line, trimmed and measured. Scenes are sized to the measured audio (`src/data/timeline.json`). Subtitles: `out/sketch2sim-demo.srt`.
**Rule:** every app or simulator shot is a real capture. Motion graphics are labeled as illustrations by context (pipeline, stat cards, roadmap). Sped-up footage carries an on-screen speed label.

| Time (s) | Scene | Voice-over | Picture | Real? |
|---|---|---|---|---|
| 0.0 to 7.8 | Title | "This is Sketch2Sim, built today at MLH Hacktoberfest Hack Day Batam." | Pencil boxes UNO / BUTTON / LED draw themselves, snap into glowing wires, logo builds letter by letter, event line | Motion graphic |
| 7.8 to 23.1 | Problem | "Every hardware idea starts as a sketch on paper. Turning that sketch into a working circuit is the slow part: picking pins, adding resistors, writing firmware, and then hunting for the one wire you put in backwards." | Real notebook photo (demo input `01-traffic-light.jpg`), "Paper sketch → circuit" with a crawling progress bar, then one card per pain point landing on the spoken word | Photo is a real demo input |
| 23.1 to 27.3 | Idea | "So we asked a simple question. What if the sketch was the source code?" | Kinetic type: handwritten "sketch" with underline, typed monospace "source code?" | Motion graphic |
| 27.2 to 34.1 | Draw | "Draw your circuit right in the browser, or just snap a photo of your notebook, and hit compile." | Screen recording: stamps + pen wires + text note on the Draw canvas (timelapse, labeled), then upload of the notebook photo and the Compile click | **Real app capture** (headless Edge, 1920x1080) |
| 34.2 to 47.9 | Compile | "Gemma 4 reads the drawing. The boxes, the lines, even the handwritten notes. And it returns a complete circuit: the parts, the wiring with a reason for every pin, and the Arduino firmware." | The live Gemma 4 call (34 s, shown sped up with a label), zoom on the scanned sketch, then the result: parts, wiring table with reasons, sketch.ino | **Real live compile** (gemma-4-26b-a4b-it, 34.2 s) |
| 47.9 to 64.9 | Trust | "But we don't trust the model blindly. Every answer goes through a deterministic validator. It locks each part to a real Wokwi component, fixes pin names, adds missing resistors, and flips parts that are wired backwards. And it shows you every repair it made." | Pipeline Sketch → Gemma 4 → Validator → Wokwi; one repair card per rule (illustrative examples of real validator rules); then the real "Auto-fixed by validator (1): Fixed reversed polarity" chip | Pipeline = motion graphic; final chip = **real live run** of `03-air-piano.jpg` |
| 64.9 to 74.1 | Proof | "Now paste both files into Wokwi, a real circuit simulator, and press play. The traffic light from a pencil sketch is running." | Real "Copy diagram.json" click, then Wokwi with the pasted diagram, then the simulation cycling red, green, yellow, red | App = real capture; Wokwi = **real screenshots** from Session A's verification run (`probe/wokwi-check/traffic-*.png`) |
| 74.1 to 88.8 | Numbers | "Five hand-drawn sketches. Five circuits running in Wokwi. We cut compile time from about a hundred seconds to thirty. And if the network drops on stage, presets fall back to a saved run, clearly labeled as cached." | 5 sketch cards flip to their 5 real Wokwi runs; compile time counter 100 s to ~30 s; real CACHED badge footage | Cards use real sketches + real Wokwi screenshots; CACHED = **real capture** |
| 88.8 to 100.8 | Vision | "Next up: ESP32 and Arduino UNO Q, more parts, and a classroom mode for vocational schools, where students lose hours to one wrong jumper wire." | Four roadmap tiles land on their words; classroom tile is highlighted | Motion graphic |
| 100.8 to 111.9 | End | "Sketch2Sim. Open source, MIT licensed, built with Gemma 4 and Claude Code. Try it today." | Logo, badges, live URL + repo URL, event line, fade out | Motion graphic |

## Numbers used (all from real runs)
- 5 of 5 hand-drawn sketches verified running in Wokwi (status/A.md, A8 PASS 5/5).
- Compile time about 100 s before the prompt fix, about 30 s after (status/A.md; this capture: 34.2 s traffic light, 30.2 s air piano).
- Air piano: 1 real auto-fix, "Fixed reversed polarity" on the buzzer (live run during capture, also in `probe/out-03-air-piano.json`).

## Rebuild
```
python scripts/voice.py            # TTS + timeline (add --reuse to only re-measure)
node capture/capture.mjs draw|traffic|piano|cached http://127.0.0.1:5174/   # needs `npx vite --port 5174` in sketch2sim/
node scripts/stills.mjs 5          # QA stills every 5 s → out/qa/
npm run render && npm run render:4x5
```
