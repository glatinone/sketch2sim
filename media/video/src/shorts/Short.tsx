import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, MONO } from "../theme";
import timeline from "./timeline.json";

/** Vertical 1080x1920 short (TikTok / Reels / Shorts). Safe zones: top ~170px and bottom ~420px
 *  carry platform UI, the right ~140px carries action buttons, so key content stays in the middle. */

type Word = { w: string; f: number };
type Chunk = { from: number; to: number; text: string; words: Word[] };
type Line = { id: string; from: number; dur: number; captions: Chunk[] };
const LINES = timeline.lines as Line[];
export const SHORT_TOTAL = timeline.total;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const line = (id: string) => LINES.find((l) => l.id === id)!;
const wordAt = (id: string, w: string, nth = 0) =>
  line(id).captions.flatMap((c) => c.words).filter((x) => x.w.toLowerCase().replace(/[.,!?:]/g, "") === w.toLowerCase())[nth]?.f ?? line(id).from;
const S = { hook: 0, snap: line("V2").from - 4, validate: line("V3").from - 4, wokwi: line("V4").from - 4, end: line("V5").from - 4 };

const fadeIn = (f: number, at: number, len = 8) => interpolate(f, [at, at + len], [0, 1], clamp);
const pop = (f: number, at: number, fps: number) => spring({ frame: f - at, fps, config: { damping: 14, stiffness: 160 } });

const Label: React.FC<{ children: React.ReactNode; color: string; style?: React.CSSProperties }> = ({ children, color, style }) => (
  <div style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, border: `3px solid ${color}`, background: "rgba(2,6,23,.82)",
    color, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 3, ...style }}>{children}</div>
);

const Phone: React.FC<{ children: React.ReactNode; scale?: number; y?: number }> = ({ children, scale = 1, y = 0 }) => (
  <div style={{ position: "absolute", left: "50%", top: 270 + y, width: 560, height: 1110, marginLeft: -280, borderRadius: 72, padding: 18,
    background: "#1e293b", boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 3px #334155", transform: `scale(${scale})`, transformOrigin: "50% 0" }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 56, overflow: "hidden", background: C.bg, position: "relative" }}>{children}</div>
  </div>
);

// ---------- scenes
const Hook: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const later = wordAt("V1", "later");
  const k1 = pop(f, 2, fps), k2 = pop(f, later - 6, fps);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 200, left: 60, right: 60, height: 640, borderRadius: 32, overflow: "hidden", transform: `scale(${0.9 + 0.1 * k1})`, opacity: k1, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <Img src={staticFile("shorts/sketch.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.05 + f * 0.0012})` }} />
        <Label color={C.amber} style={{ position: "absolute", left: 24, top: 24 }}>PAPER SKETCH</Label>
      </div>
      <div style={{ position: "absolute", top: 880, left: "50%", marginLeft: -40, fontSize: 80, color: C.cyan, opacity: k2, transform: `translateY(${(1 - k2) * -20}px)` }}>↓</div>
      <div style={{ position: "absolute", top: 990, left: 60, right: 60, height: 560, borderRadius: 32, overflow: "hidden", background: "#2b2b2b", opacity: k2, transform: `translateY(${(1 - k2) * 80}px)`, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}>
        <Img src={staticFile("shorts/green-on.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <Label color={C.emerald} style={{ position: "absolute", left: 24, top: 24 }}>RUNNING CIRCUIT</Label>
      </div>
    </AbsoluteFill>
  );
};

const Snap: React.FC = () => {
  const f = useCurrentFrame() + S.snap; const { fps } = useVideoConfig();
  const shot = wordAt("V2", "photo");
  const flash = interpolate(f, [shot, shot + 3, shot + 12], [0, 1, 0], clamp);
  const after = f >= shot + 3;
  const reading = wordAt("V2", "reads");
  const scanY = ((f - reading) * 9) % 760;
  const chips: [string, number][] = [["boxes", wordAt("V2", "boxes")], ["lines", wordAt("V2", "lines")], ["handwriting", wordAt("V2", "handwriting")]];
  const secs = Math.max(0, (f - shot) / fps);
  return (
    <AbsoluteFill style={{ opacity: fadeIn(f, S.snap, 6) }}>
      <Phone>
        {!after ? (
          <Img src={staticFile("shorts/phone-camera.png")} style={{ width: "100%" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "#0b1220" }}>
            <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.text }}>
              Sketch<span style={{ color: C.cyan }}>2</span>Sim
            </div>
            <div style={{ position: "absolute", top: 150, left: 24, right: 24, height: 440, borderRadius: 20, overflow: "hidden", border: `3px solid ${C.cyan}` }}>
              <Img src={staticFile("shorts/sketch.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {f >= reading && <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 80, height: 80, background: "linear-gradient(transparent, rgba(34,211,238,.55), transparent)" }} />}
            </div>
            <div style={{ position: "absolute", top: 630, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontSize: 34, fontWeight: 700, color: C.text, opacity: fadeIn(f, reading - 4) }}>
              Gemma 4 reading sketch…
            </div>
            <div style={{ position: "absolute", top: 685, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 28, color: C.muted, opacity: fadeIn(f, reading - 4) }}>
              {secs.toFixed(1)} s
            </div>
            <div style={{ position: "absolute", top: 770, left: 30, right: 30, display: "flex", flexDirection: "column", gap: 18 }}>
              {chips.map(([t, at]) => {
                const k = pop(f, at, fps);
                return (
                  <div key={t} style={{ opacity: k, transform: `translateX(${(1 - k) * -60}px)`, padding: "18px 26px", borderRadius: 18, background: "rgba(52,211,153,.12)", border: `2px solid ${C.emerald}`, fontFamily: FONT, fontSize: 36, fontWeight: 700, color: C.emerald }}>
                    ✓ {t}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Phone>
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

const Validate: React.FC = () => {
  const f = useCurrentFrame() + S.validate; const { fps } = useVideoConfig();
  const scroll = interpolate(f, [wordAt("V3", "wiring"), wordAt("V3", "validator")], [0, -260], clamp);
  const cardAt = wordAt("V3", "validator") - 4;
  const card = pop(f, cardAt, fps);
  const fixes: [string, string, number][] = [
    ["uno:D13", "uno:13", wordAt("V3", "checks")],
    ["13 → LED", "13 → 220Ω → LED", wordAt("V3", "wire")],
    ["buzzer signal on −", "signal on +", wordAt("V3", "fixes")],
  ];
  const wrong = wordAt("V3", "wrong");
  return (
    <AbsoluteFill style={{ opacity: fadeIn(f, S.validate, 6) }}>
      <Phone>
        <Img src={staticFile("shorts/phone-wires.png")} style={{ width: "100%", transform: `translateY(${scroll}px)` }} />
      </Phone>
      <div style={{ position: "absolute", left: 50, right: 50, top: 620, borderRadius: 28, padding: "30px 34px", background: "rgba(24,18,4,.95)", border: `4px solid ${C.amber}`,
        boxShadow: "0 30px 90px rgba(0,0,0,.7)", opacity: card, transform: `translateY(${(1 - card) * 60}px) scale(${0.95 + 0.05 * card})` }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.amber, letterSpacing: 2, marginBottom: 18 }}>WHAT THE VALIDATOR FIXES</div>
        {fixes.map(([a, b, at]) => {
          const k = pop(f, at, fps);
          return (
            <div key={a} style={{ opacity: k, transform: `translateX(${(1 - k) * 40}px)`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, fontFamily: MONO, fontSize: 36, margin: "14px 0" }}>
              <span style={{ color: C.rose, textDecoration: "line-through" }}>{a}</span>
              <span style={{ color: C.dim }}>→</span>
              <span style={{ color: C.emerald, fontWeight: 700 }}>{b}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 16, fontFamily: FONT, fontSize: 30, color: C.muted, opacity: fadeIn(f, wrong - 6) }}>AI reads the meaning. Code guarantees it's valid.</div>
      </div>
    </AbsoluteFill>
  );
};

const Wokwi: React.FC = () => {
  const f = useCurrentFrame() + S.wokwi; const { fps } = useVideoConfig();
  const play = wordAt("V4", "play"), red = wordAt("V4", "red"), green = wordAt("V4", "green"), yellow = wordAt("V4", "yellow");
  const back = yellow + 34;
  const img = f < red - 2 ? "red-off" : f < green - 2 ? "running-red-on" : f < yellow - 2 ? "green-on" : f < back ? "yellow-on" : "running-red-on";
  const picked = f >= yellow - 2 ? ["YELLOW", C.amber, yellow] : f >= green - 2 ? ["GREEN", C.emerald, green] : f >= red - 2 ? ["RED", C.rose, red] : null;
  // each colour word flashes with its light, then clears before "a real simulation"
  const word = picked && f < (picked[2] as number) + 20 ? picked : null;
  const k = word ? pop(f, (word[2] as number) - 2, fps) : 0;
  const steps: [string, number][] = [["paste diagram.json", line("V4").from], ["paste sketch.ino", line("V4").from + 10], ["▶ play", play - 2]];
  return (
    <AbsoluteFill style={{ opacity: fadeIn(f, S.wokwi, 6) }}>
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center" }}>
        <Label color={C.cyan}>WOKWI · REAL SIMULATOR</Label>
      </div>
      <div style={{ position: "absolute", top: 330, left: 70, right: 70, display: "flex", flexDirection: "column", gap: 14 }}>
        {steps.map(([t, at]) => {
          const kk = pop(f, at, fps);
          return <div key={t} style={{ opacity: kk, fontFamily: MONO, fontSize: 36, color: t.startsWith("▶") ? C.emerald : C.text, fontWeight: 700 }}>{t.startsWith("▶") ? t : `✓ ${t}`}</div>;
        })}
      </div>
      <div style={{ position: "absolute", top: 560, left: 30, right: 30, height: 660, borderRadius: 32, overflow: "hidden", background: "#2b2b2b", boxShadow: "0 30px 90px rgba(0,0,0,.6)" }}>
        <Img src={staticFile(`shorts/${img}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.02 + (f - S.wokwi) * 0.0006})` }} />
      </div>
      {word && (
        <div style={{ position: "absolute", top: 1240, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 130, letterSpacing: 6, color: word[1] as string,
          textShadow: `0 0 50px ${word[1]}`, transform: `scale(${0.6 + 0.4 * k})`, opacity: k }}>
          {word[0] as string}
        </div>
      )}
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame() + S.end; const { fps } = useVideoConfig();
  const k = pop(f, S.end, fps);
  const badges: [string, string, number][] = [["Gemma 4", C.emerald, wordAt("V5", "Gemma")], ["Claude Code", C.amber, wordAt("V5", "Claude")], ["Open source · MIT", C.cyan, wordAt("V5", "open")]];
  return (
    <AbsoluteFill style={{ opacity: fadeIn(f, S.end, 6) }}>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", transform: `scale(${0.85 + 0.15 * k})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, color: C.text, letterSpacing: -2 }}>
          Sketch<span style={{ color: C.cyan }}>2</span>Sim
        </div>
        <div style={{ fontFamily: FONT, fontSize: 46, color: C.muted, marginTop: 10 }}>paper sketch → running circuit</div>
      </div>
      <div style={{ position: "absolute", top: 700, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 700, color: C.text, opacity: fadeIn(f, wordAt("V5", "solo") - 4) }}>Built solo in one hack day</div>
        {badges.map(([t, c, at]) => {
          const kk = pop(f, at - 2, fps);
          return <Label key={t} color={c} style={{ opacity: kk, transform: `scale(${0.8 + 0.2 * kk})`, fontSize: 40 }}>{t}</Label>;
        })}
      </div>
      <div style={{ position: "absolute", top: 1180, left: 0, right: 0, textAlign: "center", opacity: fadeIn(f, wordAt("V5", "search") - 4) }}>
        <div style={{ fontFamily: MONO, fontSize: 40, color: C.text, fontWeight: 700 }}>github.com/glatinone/sketch2sim</div>
        <div style={{ fontFamily: FONT, fontSize: 30, color: C.dim, marginTop: 18 }}>MLH Hacktoberfest Hack Day Batam 2026</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- captions (word text keeps script punctuation; strip it for the word-match helpers above): big, word-highlighted, inside the safe zone
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const all = LINES.flatMap((l) => l.captions);
  const c = [...all].reverse().find((x) => x.from <= f && f < x.to);
  if (!c) return null;
  const k = interpolate(f, [c.from, c.from + 4], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 70, right: 150, bottom: 430, display: "flex", justifyContent: "center" }}>
      <div style={{ padding: "16px 28px", borderRadius: 22, background: "rgba(2,6,23,.86)", fontFamily: FONT, fontWeight: 800, fontSize: 60, lineHeight: 1.15,
        textAlign: "center", opacity: k, transform: `scale(${0.94 + 0.06 * k})`, boxShadow: "0 16px 50px rgba(0,0,0,.5)" }}>
        {c.words.map((w, i) => {
          const next = c.words[i + 1]?.f ?? c.to;
          const on = f >= w.f && f < next;
          return <span key={i} style={{ color: on ? C.cyan : C.text }}>{w.w}{i < c.words.length - 1 ? " " : ""}</span>;
        })}
      </div>
    </div>
  );
};

export const Sketch2SimShort: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 20% 10%, #082f49 0%, ${C.bg} 55%), ${C.bg}`, fontFamily: FONT }}>
    <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 5, color: C.dim }}>
      SKETCH<span style={{ color: C.cyan }}>2</span>SIM · BUILT IN ONE HACK DAY
    </div>
    <Sequence from={S.hook} durationInFrames={S.snap - S.hook}><Hook /></Sequence>
    <Sequence from={S.snap} durationInFrames={S.validate - S.snap}><Snap /></Sequence>
    <Sequence from={S.validate} durationInFrames={S.wokwi - S.validate}><Validate /></Sequence>
    <Sequence from={S.wokwi} durationInFrames={S.end - S.wokwi}><Wokwi /></Sequence>
    <Sequence from={S.end}><End /></Sequence>
    {LINES.map((l) => (
      <Sequence key={l.id} from={l.from}><Audio src={staticFile(`shorts/${l.id}.mp3`)} /></Sequence>
    ))}
    <Captions />
  </AbsoluteFill>
);
