# Media spec — deck, demo video, motion graphics (build AFTER code freeze)

Status: **spec only**. Nothing here is built until the app works (after 14:40 WIB freeze) — or after the event for the post-hackathon versions.
Owner: whichever session is free after freeze (default: Session A / account 1, since the engine finishes first). Session B stays on README/repo/submission.

## Ground rules from the event page (don't fight them)
- Judging is a **live demo**. "Pitches and presentations are discouraged." → the deck is NOT for the judging table. It's for: the submission page, LinkedIn/dev.to after the event, and a 20-second opener if a projector slot is given.
- Demo video rule (for digital submissions, still good practice here): **≤ 2 minutes**, must **say the hackathon name at the start**.
- Everything must be **honest**: real screen captures of the real app. Cached results only if labeled CACHED on screen. No mocked "AI output" in the video.
- Visual identity = the app's own UI (dark slate + cyan/emerald accents, monospace for code). No Google/MLH/Wokwi logos beyond plain-text mentions ("Built with Gemma 4", "runs in Wokwi") unless MLH's brand kit allows it.

---

## 1. Demo video (priority 1) — `media/demo/`
**Length:** 90–120 s · **Format:** 1920×1080 MP4, 30 fps · also a 1080×1350 (4:5) cut for LinkedIn.
**Tooling:** screen recording (OBS / Windows Game Bar) of the real app + Wokwi → edited in **Remotion** (same stack as `ICANN JOURNEY/icann87-reels`) for titles, zooms, captions.

| Time | Shot | On-screen text / caption |
|---|---|---|
| 0:00–0:05 | Title card (motion) | "Sketch2Sim — MLH Hacktoberfest Hack Day Batam 2026" (hackathon name = required) |
| 0:05–0:15 | Hand drawing on the app canvas (sped up 2×): UNO, BUTTON, LED boxes + lines | "Every hardware idea starts as a sketch on paper." |
| 0:15–0:30 | Press Compile → progress states ("Gemma 4 reading sketch… Validating pins…") | "Gemma 4 reads the drawing (multimodal)." |
| 0:30–0:50 | Result panel: parts chips, wiring table with rationale, **auto-fixed** chips (zoom in) | "A deterministic validator repairs what the model gets wrong." |
| 0:50–1:15 | Copy diagram.json + sketch.ino → Wokwi → paste → ▶ → press button → LED on | "…and it runs in a real simulator. First try." |
| 1:15–1:30 | Second preset fast (parking-sensor: move distance slider in Wokwi → buzzer) | "Ultrasonic + buzzer, same flow." |
| 1:30–1:45 | Architecture motion graphic (see §3) | "Sketch → Gemma 4 → Validator → Wokwi" |
| 1:45–2:00 | End card: GitHub URL, "Open source · Built in 4 hours with Claude Code" | repo URL + team name |

**Audio:** no voice-over required; captions carry it. Optional royalty-free beat at low volume. If voice-over: Kiell's voice, English, script = captions above.
**Must-capture list (record these raw clips during rehearsal 14:40–15:00, before demo):** canvas drawing, compile progress, result panel, Wokwi paste + Play for 2 presets, the CACHED badge (for honesty b-roll).

## 2. Slide deck (priority 2) — `media/deck/`
**Use:** submission page + post-event sharing. **Length:** 6 slides max. **Tooling:** Claude Slides artifact type (quickstart `slides`) or the pptx skill if a .pptx is needed.

1. **Title** — Sketch2Sim · "From a paper sketch to a running circuit" · MLH Hacktoberfest Hack Day Batam · Polibatam × Batam Innovation Center · 31 Oct 2026
2. **Problem** — prototyping starts on paper, but wiring pins + writing firmware is the slow, error-prone part (students at a vocational campus lose hours to one wrong jumper).
3. **How it works** — 4-step diagram: Sketch/photo → Gemma 4 multimodal → validator (catalog-locked parts, pin aliasing, auto 220Ω resistors, PWM pin fixes) → Wokwi diagram.json + sketch.ino.
4. **Demo** — 3 screenshots (canvas · result with auto-fixes · Wokwi running) + GIF/QR to the video.
5. **What we learned** — real findings from `status/A.md` + `src/engine/ENGINE.md`: what Gemma 4 vision got right, what it hallucinated (pin names!), why a deterministic validator beats prompt-only. Numbers: latency, % of wires auto-fixed across presets.
6. **Open source + next** — repo URL, good-first-issues (ESP32 target, Arduino UNO Q App Lab export, more parts, Bahasa Indonesia UI), "Built with Claude Code" disclosure.

## 3. Motion graphics (priority 3) — `media/motion/`
Built in Remotion, reused inside the video and as standalone loops for LinkedIn/IG (per growthr house rule: posts always ship with a visual).
- **M1 · Title sting (4 s):** hand-drawn line strokes animate in (box "UNO", box "LED", connecting line) → strokes snap into clean Wokwi-style colored wires → logo text "Sketch2Sim".
- **M2 · Pipeline explainer (12 s):** 4 nodes left→right — Sketch · Gemma 4 · Validator · Wokwi. A sketch image travels through; at the Validator node, a red wrong pin label ("D13" / "GND") flips to green ("13" / "GND.1") — visualises the "auto-fixed" idea.
- **M3 · Stat card (5 s):** e.g. "3/3 presets run in Wokwi on first paste · N wires auto-repaired" — **only real numbers from the engine run logs**.
- **M4 · End card (4 s):** repo URL, "Open source", "Built with Gemma 4 + Claude Code".
Sizes: 1920×1080 (video) + 1080×1350 (LinkedIn/IG 4:5; growthr IG uses 1080×1440 3:4 — export that too if it goes to @growthr.id).

## 4. Post-event content (after the event, not today)
- LinkedIn post (with M2 or carousel from the deck — never text-only).
- dev.to write-up "From a paper sketch to a running circuit: building Sketch2Sim with Gemma 4 in one hack day" via the medium-article skill; lessons from the validator are the hook.
- Repo README GIF from the demo video (first 15 s).

## Inputs these need (collect during the build, cheap now / expensive later)
- [ ] Raw screen recordings listed in §1 (rehearsal window)
- [ ] 3 screenshots in 1920×1080: canvas, result panel with fixes, Wokwi running
- [ ] Real numbers: latency per preset, count of auto-fixes per preset (Session A logs these in `probe/out-*.json`)
- [ ] Final repo URL (Session B `PUSHED`)
- [ ] Team name / Kiell's display name as it appears on the submission
