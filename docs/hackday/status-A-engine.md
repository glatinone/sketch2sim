# Status — Session A (Engine, account 1)

Only Session A writes here. Format: `[HH:MM WIB] <TASK-ID> DONE|BLOCKED|NOTE — one line`

## Log
[12:58 WIB] A1-A5 DONE (code) — engine committed (a8bb254): compileSketch real, validator auto-repairs part types, pin aliases, 220Ω LED resistors, servo->PWM, missing GND/5V, serial pins; fallback firmware. Exports match PLAN.md. Waiting on A0 key/probe to set DEFAULT_MODEL_ID + run live. B: you can already switch off mock once ENGINE READY is posted (compile throws NO_KEY/API until then).
[12:43 WIB] A0 DONE — key saved (probe/.env, free tier, kiell.tampubolon@gmail.com); DEFAULT_MODEL_ID=gemma-4-26b-a4b-it (31b-it flaky 500/503, ~60s); image+JSON mode+systemInstruction all OK; 2-16s latency; filter thought parts.
[12:52 WIB] A5 DONE — ENGINE READY. Live compile of a hand-drawn UNO+BUTTON+LED sketch: valid circuit, 0 fixes needed, correct firmware. Model gemma-4-26b-a4b-it.
[12:52 WIB] NOTE for B — (1) latency is ~45s per compile (Gemma 4 always "thinks", can't be turned off): progress UI must look alive for 45-90s, client timeout is 90s. (2) pass the key from the settings field; never read GEMINI_API_KEY from env (this laptop has an unrelated sk- proxy key there). (3) result.notes may contain "add Servo in Library Manager" — show notes near the Open Wokwi guide.
[13:08 WIB] A6/A7 DONE — CACHED READY: src/presets/cached/{blink-button,parking-sensor,servo-pot}.json (source "cached"). All 3 compile live; validator now also fixes reversed buzzer/LED polarity (caught a real one on parking-sensor). Engine fires 2 parallel requests and keeps the first valid answer (latency tail was >90s).
[13:08 WIB] A8 PASS (1/3) — blink-button verified in real Wokwi: diagram loads, compiles in ~3s, LED lights on button press. Stage tips: after pasting press F (fit) on the canvas, part layout initially extends to the right. Testing the other 2 now.
[13:22 WIB] NOTE for B — LATENCY FIXED: prompt now makes Gemma skip long thinking; compile is ~26-34s (was 45-104s). Client timeout 150s. Progress UI copy can assume ~30s.
[13:22 WIB] A8 PASS (3/3) — servo-pot + parking-sensor verified in real Wokwi. Servo sketches show 'Build failed: Servo.h' first time -> Wokwi offers a one-click INSTALL "SERVO" LIBRARY button; please make the Open-Wokwi guide say that when notes mention Servo.
[13:22 WIB] NOTE for B — live demo inputs (notebook-paper photos, JPG) are in MLH/demo/sketches/ — please make sure Upload accepts .jpg and that they look good in the preview.
[13:18 WIB] FIXED B's blocker (d169478) — loadCachedResult now uses try { import.meta.glob(...) } exactly as suggested; verified the 3 cached JSONs land in the vite build bundle and Node CLI still imports. Please re-test no-key -> CACHED and push.
[13:19 WIB] A9 DONE — src/engine/ENGINE.md committed (README link target). Ready for push.
[13:35 WIB] A8 PASS (5/5) — traffic-light + parking-gate demo sketches verified in real Wokwi (sequence + servo correct). Layout fix committed: GND wires go to the nearest header (no wires across the chip). Wokwi sim speed read 2-4% under browser automation; Kiell checks it in plain Edge at rehearsal.
[13:31 WIB] NOTE for B — please push (my 501e259 GND-layout fix + cached refresh are local only). A will handle the OrganizerHQ submission (Kiell asked for end-to-end) using your draft below, after your final push — post FINAL PUSHED when done. A is also running one more end-to-end check (Pages app -> Wokwi, sim speed).
[13:31 WIB] NUMBERS for media (real, gemma-4-26b-a4b-it):
  - before prompt tuning: 45-104 s per compile (one run: 3,209 thought + 1,637 answer tokens, 104 s); after: 26-34 s, 0 thought tokens
  - 01-traffic-light: 8 parts, 11 wires, 0 fixes, 33.6 s | 02-parking-gate: 7 parts, 11 wires, 0 fixes, 31.7 s | 03-air-piano: 4 parts, 9 wires, 1 fix (reversed buzzer polarity), 26.4 s
  - presets: blink-button 4p/5w 45.2 s; parking-sensor 5p/9w 92.3 s + 1 fix (reversed buzzer polarity); servo-pot 3p/6w 51.7 s
  - 6/6 sketches compiled to valid circuits; 5/5 tested ran correctly in real Wokwi (screenshots: MLH/probe/wokwi-check/*.png, usable as video b-roll)
  - Gemma 4 31B on free tier: 3/8 calls ok (500/503), ~60 s; 26B: 8/8 ok
[13:49 WIB] NOTE for B — A pushed main (501e259, fast-forward, engine only) because submission is due before 15:00. A is submitting on mlh.com now; no need for B to touch the submission.
[14:02 WIB] REQUEST for B (Kiell's decision) — replace "napkin" wording everywhere with "From a paper sketch to a running circuit": README.md line 3, CONTRIBUTING.md line 3, ResultPanel.tsx ("Napkin → running circuit" → "Paper sketch → running circuit"), media/video Problem.tsx ("Napkin → circuit" → "Paper sketch → circuit", and the VO/caption word if any), deck title slide if it says napkin. Kiell will NOT submit until the video is ready: he wants the video + deck links in the form's "Other links". Please (1) make the deck shareable/public-link and post the URL, (2) post the video URL (YouTube unlisted or similar) as soon as it exists.
[14:04 WIB] OWNERSHIP CHANGE (Kiell's request) — A now owns ALL app UI files for a mobile overhaul: src/App.tsx, src/components/**, src/index.css, src/compileClient.ts, src/ui/**, index.html. B: please don't edit these until A posts MOBILE DONE. A will also do the napkin→'paper sketch' wording in ResultPanel.tsx, so skip that part of my earlier request (README/CONTRIBUTING/video/deck wording still yours).
[14:13 WIB] MOBILE pushed (8dd3367) — phone layout: camera-first tab with native capture (input capture=environment), sticky bottom Compile bar, single scrolling column, wire cards instead of table <md, Settings as full-width sheet, 16px inputs (no iOS zoom), 'Paper sketch → running circuit' wording. Desktop/projector layout unchanged (all changes behind lg: breakpoints). QA on Pages running now. B: still please don't touch src/ UI files until MOBILE DONE.
[14:17 WIB] MOBILE DONE (00e8db5) — QA in iPhone-14 emulation: 5/5 pass, no horizontal overflow on any screen, live compile from phone 17.9 s. Polish pushed. B may edit src/ UI files again (coordinate here first please).

## A0 probe findings
- account: kiell.tampubolon@gmail.com (personal), AI Studio project "Default Gemini Project" (projects/421371201614), Free tier, no billing. New key "mlh-sketch2sim-gemma" saved to MLH/probe/.env (new `AQ.` format; works as `?key=`).
- models found (v1beta/models, 60 total): `gemma-4-31b-it`, `gemma-4-26b-a4b-it` — both 262144 in / 32768 out tokens, methods generateContent,countTokens (no streamGenerateContent listed).
- model id: DEFAULT_MODEL_ID = `gemma-4-26b-a4b-it` (8/8 calls OK). `gemma-4-31b-it` (largest) is flaky on free tier right now: 3/8 OK, rest 500 "Internal error encountered." / 503 "This model is currently experiencing high demand..."; when OK it takes 54-61s. Use 31B only as opt-in, fall back to 26B on 500/503.
- image input: OK — `inline_data {mime_type:"image/png", data:<base64>}` (snake_case accepted). Image = 258 prompt tokens. Correctly read rectangle/circle/triangle/line + colors + positions.
- JSON mode (responseMimeType "application/json"): ACCEPTED, output parsed as valid JSON 3/3. Note: with only systemInstruction (no schema) 26B returned a top-level array instead of {"shapes":[...]} once — validate/normalize shape, or pass responseSchema.
- systemInstruction: ACCEPTED (26B obeyed "max 10 words").
- thinking: model always thinks; response parts include `{thought:true}` parts → take text only from parts where `!p.thought`. thinkingConfig.thinkingBudget and thinkingLevel are REJECTED (400 "Thinking budget is not supported for this model." / "Thinking level is not supported for this model."); includeThoughts:false accepted.
- latency (26B, 256x192 PNG): image describe 16.3s, JSON 10.1s, systemInstruction 2.2s, system+JSON 4.3s, includeThoughts:false 2.7s; list models 0.6s. 31B: 54-61s when it succeeds. Set client timeout >= 90s.
- working request: `POST https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent?key=$GEMINI_API_KEY` (content-type: application/json)
```json
{
  "systemInstruction": { "parts": [{ "text": "You convert sketches to JSON. Output only JSON." }] },
  "contents": [{ "role": "user", "parts": [
    { "inline_data": { "mime_type": "image/png", "data": "<base64 png>" } },
    { "text": "Return {\"shapes\":[{\"type\":string,\"color\":string,\"approx_position\":string}]}" }
  ]}],
  "generationConfig": { "responseMimeType": "application/json", "temperature": 0.2 }
}
```
  Read: `candidates[0].content.parts.filter(p => !p.thought).map(p => p.text).join('')` → JSON.parse. Scripts: MLH/probe/{list-models,make-png,probe,think}.mjs, raw results probe-results*.json.

## Requests to other session
