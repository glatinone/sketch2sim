"""Generate the English voice-over per line with edge-tts, measure it, and lock the timeline.

Outputs
  public/audio/<id>.mp3            trimmed speech (48 kHz) used by Remotion
  public/audio/<id>.words.json     word timings (s, relative to trimmed audio)
  src/data/timeline.json           per-line start/duration in frames + caption chunks
  out/sketch2sim-demo.srt          subtitles
Pass --reuse to skip TTS and only re-measure existing audio.
"""
import asyncio, json, re, subprocess, sys, time, wave
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
FPS = 30
AUDIO = ROOT / "public/audio"
SCRIPT = json.loads((ROOT / "src/data/script.json").read_text(encoding="utf-8"))


async def tts(line):
    raw = AUDIO / f"{line['id']}.raw.mp3"
    words = []
    com = edge_tts.Communicate(line["text"], SCRIPT["voice"], rate=SCRIPT["rate"], pitch=SCRIPT["pitch"], boundary="WordBoundary")
    with open(raw, "wb") as f:
        async for ev in com.stream():
            if ev["type"] == "audio":
                f.write(ev["data"])
            elif ev["type"] == "WordBoundary":
                words.append({"t": ev["offset"] / 1e7, "d": ev["duration"] / 1e7, "w": ev["text"]})
    (AUDIO / f"{line['id']}.rawwords.json").write_text(json.dumps(words, indent=1))


def lead_silence(path):
    out = subprocess.run(["ffmpeg", "-i", str(path), "-af", "silencedetect=n=-50dB:d=0.02", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(r.split("silence_start:")[1]) for r in out.splitlines() if "silence_start" in r]
    ends = [float(r.split("silence_end:")[1].split("|")[0]) for r in out.splitlines() if "silence_end" in r]
    if starts and ends and starts[0] <= 0.01:
        return ends[0]
    return 0.0


def process(line_id):
    raw = AUDIO / f"{line_id}.raw.mp3"
    wav = AUDIO / f"{line_id}.wav"
    af = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", "48000", "-ac", "1", str(wav)], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "192k", str(AUDIO / f"{line_id}.mp3")], check=True)
    with wave.open(str(wav)) as w:
        dur = w.getnframes() / w.getframerate()
    trim = lead_silence(raw)
    words = json.loads((AUDIO / f"{line_id}.rawwords.json").read_text())
    for wd in words:
        wd["t"] = round(max(0.0, wd["t"] - trim), 3)
    (AUDIO / f"{line_id}.words.json").write_text(json.dumps(words, indent=1))
    return dur, words


def norm(x):
    return re.sub(r"[^a-z0-9]", "", x.lower())


def align(tokens, words):
    """Map each text token to (start, end) using TTS word boundaries (robust to split/merged words)."""
    spans, j = [], 0
    for tok in tokens:
        target = norm(tok)
        if not target or j >= len(words):
            prev = spans[-1][1] if spans else 0.0
            spans.append((prev, prev))
            continue
        k, acc = j, ""
        while k < len(words) and len(acc) < len(target):
            acc += norm(words[k]["w"])
            k += 1
        k = max(k, j + 1)
        spans.append((words[j]["t"], words[k - 1]["t"] + words[k - 1]["d"]))
        j = k
    return spans


def chunks(text, words):
    """Caption chunks: break at sentence/clause punctuation, max 8 words, no orphans under 3 words."""
    tokens = text.split()
    spans = align(tokens, words)
    groups, cur = [], []
    for i, tok in enumerate(tokens):
        cur.append(i)
        hard = re.search(r"[.!?]$", tok)
        soft = re.search(r"[,:;]$", tok) and len(cur) >= 4
        if hard or soft or len(cur) >= 8:
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
    merged = []
    for g in groups:
        if merged and len(g) < 3 and len(merged[-1]) + len(g) <= 10:
            merged[-1] = merged[-1] + g
        else:
            merged.append(g)
    return [{"text": " ".join(tokens[i] for i in g), "start": round(spans[g[0]][0], 3), "end": round(spans[g[-1]][1], 3)} for g in merged]


def srt_time(s):
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{int(h):02}:{int(m):02}:{int(sec):02},{int((sec % 1) * 1000):03}"


def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    (ROOT / "out").mkdir(exist_ok=True)
    if "--reuse" not in sys.argv:
        only = [a for a in sys.argv[1:] if not a.startswith("--")]
        for line in SCRIPT["lines"]:
            if only and line["id"] not in only and (AUDIO / f"{line['id']}.raw.mp3").exists():
                continue
            for attempt in range(8):  # the edge-tts service drops requests intermittently
                try:
                    asyncio.run(tts(line))
                    break
                except Exception as e:
                    print(f"tts {line['id']} attempt {attempt + 1} failed: {type(e).__name__}")
                    time.sleep(1.5 + attempt)
            else:
                sys.exit(f"TTS failed for {line['id']}")
            print("tts", line["id"])
    t = 0.0
    lines = []
    srt = []
    for line in SCRIPT["lines"]:
        dur, words = process(line["id"])
        lead = line.get("lead", 0.25)
        tail = line.get("tail", 0.0)
        start = t + lead
        cap = chunks(line["text"], words)
        lines.append({
            "id": line["id"], "scene": line["scene"], "text": line["text"],
            "sceneStart": round(t * FPS), "audioStart": round(start * FPS), "audioFrames": round(dur * FPS),
            "sceneFrames": round((lead + dur + SCRIPT["gapAfter"] + tail) * FPS),
            "captions": [{"text": c["text"], "from": round((start + c["start"]) * FPS), "to": round((start + c["end"]) * FPS) + 8} for c in cap],
        })
        for c in cap:
            srt.append((start + c["start"], start + c["end"] + 0.2, c["text"]))
        t = start + dur + SCRIPT["gapAfter"] + tail
        print(f"{line['id']:4} {dur:5.2f}s  scene ends {t:6.2f}s")
    total = round(t * FPS)
    (ROOT / "src/data/timeline.json").write_text(json.dumps({"fps": FPS, "durationInFrames": total, "lines": lines}, indent=1))
    (ROOT / "out/sketch2sim-demo.srt").write_text(
        "\n".join(f"{i+1}\n{srt_time(a)} --> {srt_time(b)}\n{txt}\n" for i, (a, b, txt) in enumerate(srt)), encoding="utf-8")
    print(f"TOTAL {t:.1f}s = {total} frames")


main()
