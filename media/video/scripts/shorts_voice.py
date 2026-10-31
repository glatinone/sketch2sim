"""Voice-over + timeline for the vertical short (TikTok / Reels / Shorts).

Outputs
  public/shorts/<id>.mp3         trimmed speech
  src/shorts/timeline.json       per-line start/duration (frames) + word-level caption chunks
  out/sketch2sim-short.srt       subtitles
"""
import asyncio, json, subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
FPS = 30
OUT = ROOT / "public/shorts"
OUT.mkdir(parents=True, exist_ok=True)
VOICE, RATE = "en-US-AndrewMultilingualNeural", "+4%"
GAP = 0.25

LINES = [
    {"id": "V1", "lead": 0.3, "text": "I drew a traffic light on paper. A minute later, it was running."},
    {"id": "V2", "text": "I snap a photo, and Gemma 4 reads the sketch. The boxes, the lines, even my handwriting."},
    {"id": "V3", "text": "It writes the wiring and the Arduino code. Then my validator checks every wire, and fixes what the AI gets wrong."},
    {"id": "V4", "text": "Paste it into Wokwi, press play. Red. Green. Yellow. A real simulation, from a pencil sketch."},
    {"id": "V5", "tail": 2.2, "text": "Built solo in one hack day with Gemma 4 and Claude Code. It's open source. Search Sketch2Sim on GitHub."},
]


async def tts(line):
    for attempt in range(4):
        try:
            return await _tts(line)
        except edge_tts.exceptions.NoAudioReceived:
            await asyncio.sleep(2 + attempt * 3)
    raise SystemExit(f"TTS failed for {line['id']}")


async def _tts(line):
    raw = OUT / f"{line['id']}.raw.mp3"
    words = []
    com = edge_tts.Communicate(line["text"], VOICE, rate=RATE, boundary="WordBoundary")
    with open(raw, "wb") as f:
        async for ev in com.stream():
            if ev["type"] == "audio":
                f.write(ev["data"])
            elif ev["type"] == "WordBoundary":
                words.append({"t": ev["offset"] / 1e7, "d": ev["duration"] / 1e7, "w": ev["text"]})
    return words


def probe(path):
    out = subprocess.run(["ffmpeg", "-i", str(path), "-af", "silencedetect=n=-50dB:d=0.02", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    dur = [l for l in out.splitlines() if "Duration:" in l][0].split("Duration:")[1].split(",")[0].strip()
    h, m, s = dur.split(":")
    total = int(h) * 3600 + int(m) * 60 + float(s)
    starts = [float(r.split("silence_start:")[1]) for r in out.splitlines() if "silence_start" in r]
    ends = [float(r.split("silence_end:")[1].split("|")[0]) for r in out.splitlines() if "silence_end" in r]
    lead = ends[0] if starts and ends and starts[0] <= 0.01 else 0.0
    trail = starts[-1] if starts and (not ends or starts[-1] > ends[-1]) else total
    return lead, trail


def chunks(words, start_frame, text):
    """Caption chunks of up to 3 words that never cross a sentence or comma. Punctuation comes from
    the script text, because edge-tts word boundaries drop it."""
    tokens = text.split()
    if len(tokens) == len(words):
        words = [{**w, "w": tok} for w, tok in zip(words, tokens)]
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) == 3 or w["w"][-1:] in ".,!?:":
            out.append(cur); cur = []
    if cur: out.append(cur)
    res = []
    for i, c in enumerate(out):
        f0 = start_frame + round(c[0]["t"] * FPS)
        nxt = out[i + 1][0]["t"] if i + 1 < len(out) else c[-1]["t"] + c[-1]["d"] + 0.3
        res.append({"from": f0, "to": start_frame + round(nxt * FPS), "text": " ".join(x["w"] for x in c),
                    "words": [{"w": x["w"], "f": start_frame + round(x["t"] * FPS)} for x in c]})
    return res


async def main():
    t = 0.0
    timeline, srt = [], []
    for line in LINES:
        words = await tts(line)
        raw = OUT / f"{line['id']}.raw.mp3"
        lead, trail = probe(raw)
        mp3 = OUT / f"{line['id']}.mp3"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-ss", f"{lead:.3f}", "-to", f"{trail:.3f}",
                        "-ar", "48000", str(mp3)], check=True)
        words = [{**w, "t": max(0.0, w["t"] - lead)} for w in words]
        t += line.get("lead", 0.0)
        dur = trail - lead
        start = round(t * FPS)
        timeline.append({"id": line["id"], "text": line["text"], "from": start, "dur": round(dur * FPS),
                         "captions": chunks(words, start, line["text"])})
        srt.append((t, t + dur, line["text"]))
        t += dur + GAP + line.get("tail", 0.0)
    total = round(t * FPS)
    (ROOT / "src/shorts").mkdir(exist_ok=True)
    (ROOT / "src/shorts/timeline.json").write_text(json.dumps({"fps": FPS, "total": total, "lines": timeline}, indent=1))
    def ts(x):
        ms = round(x * 1000); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    (ROOT / "out/sketch2sim-short.srt").write_text("\n".join(f"{i + 1}\n{ts(a)} --> {ts(b)}\n{x}\n" for i, (a, b, x) in enumerate(srt)), encoding="utf-8")
    print(f"total {t:.2f}s ({total} frames)")
    for l in timeline: print(l["id"], l["from"], l["dur"])


asyncio.run(main())
