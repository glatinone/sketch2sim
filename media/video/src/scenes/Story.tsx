import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Backdrop, Big, Browser, clamp, ease, Tag, useSpring } from "../components/ui";
import { Camera, Footage } from "../components/Footage";
import { line, wordAt } from "../timing";
import { C, FONT, MONO } from "../theme";
import piano from "../../public/footage/piano.markers.json";
import traffic from "../../public/footage/traffic.markers.json";
import cached from "../../public/footage/cached.markers.json";

/* ---------------- S5 · trust layer ---------------- */
const NODES = [
  { k: "Sketch", sub: "photo or canvas", color: C.text },
  { k: "Gemma 4", sub: "vision + reasoning", color: C.cyan },
  { k: "Validator", sub: "deterministic", color: C.amber },
  { k: "Wokwi", sub: "real simulator", color: C.emerald },
];

const Repair: React.FC<{ at: number; until: number; what: string; before: string; after: string }> = ({ at, until, what, before, after }) => {
  const f = useCurrentFrame();
  const k = useSpring(at, { damping: 16, stiffness: 170 });
  if (f < at - 2 || f > until + 1) return null;
  const flip = ease(f, at + 10, at + 22);
  const out = interpolate(f, [until - 7, until], [1, 0], clamp);
  const lift = interpolate(f, [until - 7, until], [0, -50], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", opacity: k * out }}>
      <div style={{ transform: `translateY(${(1 - k) * 40 + lift}px)`, padding: "34px 54px", borderRadius: 28, background: "#0b1222", border: `2px solid ${C.amber}55`, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 60px ${C.amber}14`, minWidth: 980, textAlign: "center" }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.amber, marginBottom: 22 }}>{what}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34, fontFamily: MONO, fontSize: 52, fontWeight: 700 }}>
          <span style={{ color: C.rose, textDecoration: flip > 0.5 ? "line-through" : "none", opacity: 1 - 0.45 * flip }}>{before}</span>
          <span style={{ color: C.dim, opacity: flip }}>→</span>
          <span style={{ color: C.emerald, opacity: flip, transform: `scale(${0.8 + 0.2 * flip})`, textShadow: `0 0 30px ${C.emerald}55` }}>{after}</span>
        </div>
      </div>
    </div>
  );
};

export const TrustScene: React.FC = () => {
  const f = useCurrentFrame();
  const total = line("S5").sceneFrames;
  const val = wordAt("S5", "validator");
  const locks = wordAt("S5", "locks");
  const fixes = wordAt("S5", "fixes");
  const adds = wordAt("S5", "adds");
  const flips = wordAt("S5", "flips");
  const shows = wordAt("S5", "shows") - 8;
  const nodeK = NODES.map((_, i) => useSpring(4 + i * 7));
  const vk = useSpring(val - 4, { damping: 12 });
  const packet = (f * 9) % 1500;

  return (
    <AbsoluteFill>
      <Backdrop hue="amber" />
      <AbsoluteFill style={{ opacity: 1 - ease(f, shows - 4, shows + 6) }}>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <line x1={330} y1={330} x2={1590} y2={330} stroke={C.line} strokeWidth={6} />
          <line x1={330} y1={330} x2={1590} y2={330} stroke={C.cyan} strokeWidth={6} strokeDasharray="40 1460" strokeDashoffset={-packet} strokeLinecap="round" />
        </svg>
        {NODES.map((n, i) => {
          const isVal = i === 2;
          const s = nodeK[i] * (isVal ? 1 + 0.18 * vk : 1);
          const dimmed = f > val && !isVal ? 0.45 : 1;
          return (
            <div key={n.k} style={{ position: "absolute", left: 330 + i * 420 - 170, top: 240, width: 340, textAlign: "center", opacity: nodeK[i] * dimmed, transform: `scale(${s})` }}>
              <div style={{ margin: "0 auto", width: 340, height: 180, borderRadius: 30, background: C.panel, border: `3px solid ${isVal && f > val ? C.amber : C.line}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: isVal && f > val ? `0 0 70px ${C.amber}40` : "0 20px 50px rgba(0,0,0,.45)" }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: n.color }}>{n.k}</div>
                <div style={{ fontFamily: MONO, fontSize: 21, color: C.muted, marginTop: 8 }}>{n.sub}</div>
              </div>
            </div>
          );
        })}
        <Repair at={locks} until={fixes} what="Lock parts to real Wokwi components" before={`"led"`} after="wokwi-led" />
        <Repair at={fixes} until={adds} what="Fix pin names" before="uno:D13" after="uno:13" />
        <Repair at={adds} until={flips} what="Add missing resistors" before="13 → LED" after="13 → 220Ω → LED" />
        <Repair at={flips} until={shows} what="Flip parts wired backwards" before="buzzer + on GND" after="fixed" />
      </AbsoluteFill>

      {/* real auto-fix from a live run (air piano sketch) */}
      <Sequence from={shows} layout="none">
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 34, opacity: ease(f, shows, shows + 10) }}>
          <Browser url="glatinone.github.io/sketch2sim" width={1500} tag={<Tag color={C.amber}>Real auto-fix · live run</Tag>}>
            <Camera viewW={1500} shots={[{ at: 0, x: 790, y: 300, w: 1130 }, { at: 30, x: 800, y: 500, w: 760 }]} dur={40}>
              <Footage clip="piano" segs={[{ at: 0, dur: total - shows, from: piano.resultShown + 1.5, to: piano.end - 0.4 }]} width={1920} height={1080} />
            </Camera>
          </Browser>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/* ---------------- S6 · proof in Wokwi ---------------- */
const WOKWI = ["traffic-02-running-red-on", "traffic-04-green-on", "traffic-05-yellow-on", "traffic-06-back-to-red"];

export const ProofScene: React.FC = () => {
  const f = useCurrentFrame();
  const total = line("S6").sceneFrames;
  const wokwi = wordAt("S6", "wokwi") - 4;
  const play = wordAt("S6", "play");
  const step = Math.max(18, Math.floor((total - play) / WOKWI.length));
  const idx = Math.min(WOKWI.length - 1, Math.floor((f - play) / step));
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);
  return (
    <AbsoluteFill>
      <Backdrop hue="emerald" />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 34 }}>
        {f < wokwi ? (
          <Browser url="glatinone.github.io/sketch2sim" width={1500} tag={<Tag color={C.emerald}>Copy · paste</Tag>}>
            <Camera viewW={1500} shots={[{ at: 0, x: 790, y: 170, w: 980 }]}>
              <Footage clip="traffic" segs={[{ at: 0, dur: wokwi, from: traffic.copied - 1.2, to: traffic.end - 0.3 }]} width={1920} height={1080} />
            </Camera>
          </Browser>
        ) : (
          <Browser url="wokwi.com/projects/new/arduino-uno" width={1500} tag={<Tag color={C.emerald} style={{ boxShadow: f >= play ? `0 0 ${20 + 20 * pulse}px ${C.emerald}55` : "none" }}>{f >= play ? "Real Wokwi simulation" : "wokwi.com"}</Tag>}>
            <Camera
              viewW={1500}
              shots={[
                { at: 0, x: 110, y: 140, w: 1700 },
                { at: play - wokwi, x: 980, y: 330, w: 950 },
                { at: play - wokwi + 60, x: 1040, y: 350, w: 860 },
              ]}
              dur={30}
            >
              <div style={{ position: "absolute", inset: 0, background: "#1e1e1e" }} />
              {f < play ? (
                <Img src={staticFile("wokwi/traffic-01-diagram-before-run.png")} style={{ position: "absolute", left: 6, top: 75, width: 1908 }} />
              ) : (
                WOKWI.map((w, i) => (
                  <Img key={w} src={staticFile(`wokwi/${w}.png`)} style={{ position: "absolute", left: 6, top: 75, width: 1908, opacity: i === idx ? 1 : 0 }} />
                ))
              )}
            </Camera>
          </Browser>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- S7 · numbers ---------------- */
const SKETCHES = ["blink-button.png", "parking-sensor.png", "servo-pot.png", "01-traffic-light.jpg", "02-parking-gate.jpg"];
const RUNNING = ["03-button-pressed-led-on", "parking-03-distance-10cm", "servo-04-pot-max-servo-moved", "traffic-04-green-on", "gate-04-open-servo90-green"];

export const NumbersScene: React.FC = () => {
  const f = useCurrentFrame();
  const total = line("S7").sceneFrames;
  const run = wordAt("S7", "circuits") - 6;
  const cut = wordAt("S7", "cut") - 6;
  const net = wordAt("S7", "network") - 8;
  const cards = SKETCHES.map((_, i) => useSpring(6 + i * 5, { damping: 14 }));
  const flip = SKETCHES.map((_, i) => ease(f, run + i * 4, run + i * 4 + 14));
  const tk = useSpring(cut);
  const bar = ease(f, cut + 14, cut + 50);
  const secs = Math.round(interpolate(bar, [0, 1], [100, 30]));

  return (
    <AbsoluteFill>
      <Backdrop hue="emerald" />
      {/* 5 sketches → 5 running circuits */}
      <AbsoluteFill style={{ opacity: 1 - ease(f, cut - 6, cut + 4) }}>
        <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center" }}>
          <Big size={150} color={f >= run ? C.emerald : C.text}>
            5<span style={{ color: C.dim }}>/</span>5
          </Big>
          <div style={{ fontFamily: MONO, fontSize: 30, color: C.muted, letterSpacing: 3, marginTop: 6 }}>
            {f >= run ? "RUNNING IN WOKWI" : "HAND-DRAWN SKETCHES"}
          </div>
        </div>
        <div style={{ position: "absolute", top: 520, left: 110, right: 110, display: "flex", gap: 26, justifyContent: "center" }}>
          {SKETCHES.map((s, i) => (
            <div key={s} style={{ width: 316, height: 236, position: "relative", borderRadius: 18, overflow: "hidden", opacity: cards[i], transform: `translateY(${(1 - cards[i]) * 60}px) rotateY(${flip[i] * 180}deg)`, transformStyle: "preserve-3d", boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
              <Img src={staticFile(`sketches/${s}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#fff", backfaceVisibility: "hidden" }} />
              <div style={{ position: "absolute", inset: 0, transform: "rotateY(180deg)", backfaceVisibility: "hidden", background: "#2b2b2b", border: `3px solid ${C.emerald}` }}>
                <Img src={staticFile(`wokwi/${RUNNING[i]}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "75% 45%" }} />
                <div style={{ position: "absolute", right: 12, top: 12, width: 44, height: 44, borderRadius: 99, background: C.emerald, color: C.bg, fontSize: 30, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* compile time */}
      <AbsoluteFill style={{ opacity: tk * (1 - ease(f, net - 6, net + 4)), justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 32, color: C.muted, letterSpacing: 3 }}>COMPILE TIME</div>
        <Big size={220} color={bar > 0.98 ? C.cyan : C.text} style={{ marginTop: 10 }}>
          ~{secs} s
        </Big>
        <div style={{ marginTop: 34, width: 1100, height: 22, borderRadius: 99, background: C.line, overflow: "hidden" }}>
          <div style={{ width: `${secs}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${C.cyan}, ${C.emerald})` }} />
        </div>
        <div style={{ marginTop: 20, fontFamily: MONO, fontSize: 28, color: C.dim }}>was about 100 s</div>
      </AbsoluteFill>

      {/* honest fallback: real CACHED badge */}
      <Sequence from={net} layout="none">
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 34, opacity: ease(f, net, net + 10) }}>
          <Browser url="glatinone.github.io/sketch2sim" width={1500} tag={<Tag color={C.amber}>Offline fallback · always labeled</Tag>}>
            <Camera viewW={1500} shots={[{ at: 0, x: 780, y: 60, w: 1140 }, { at: 40, x: 1080, y: 70, w: 820 }]} dur={36}>
              <Footage clip="cached" segs={[{ at: 0, dur: total - net, from: cached.cachedShown - 0.6, to: cached.end - 0.2 }]} width={1920} height={1080} />
            </Camera>
          </Browser>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/* ---------------- S8 · vision ---------------- */
const ROAD = [
  { word: "esp32", k: "ESP32", sub: "Wi-Fi boards", color: C.cyan },
  { word: "uno", k: "Arduino UNO Q", sub: "real hardware", color: C.emerald },
  { word: "parts", k: "More parts", sub: "OLED, relays, sensors", color: C.amber },
  { word: "classroom", k: "Classroom mode", sub: "vocational schools", color: C.rose },
];

export const VisionScene: React.FC = () => {
  const f = useCurrentFrame();
  const voc = wordAt("S8", "vocational");
  const ats = ROAD.map((r) => wordAt("S8", r.word) - 3);
  const ks = ats.map((a) => useSpring(a, { damping: 14, stiffness: 160 }));
  const focus = ease(f, voc - 6, voc + 14);
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 32, color: C.muted, letterSpacing: 6, opacity: ease(f, 0, 12) }}>
        NEXT
      </div>
      <div style={{ position: "absolute", top: 250, left: 150, right: 150, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
        {ROAD.map((r, i) => {
          const last = i === 3;
          const dim = !last ? 1 - 0.55 * focus : 1;
          return (
            <div key={r.k} style={{ height: 270, borderRadius: 32, padding: "44px 50px", background: C.panel, border: `3px solid ${last && focus > 0.2 ? r.color : C.line}`, opacity: ks[i] * dim, transform: `translateY(${(1 - ks[i]) * 50}px) scale(${last ? 1 + 0.05 * focus : 1})`, boxShadow: last && focus > 0.2 ? `0 0 90px ${r.color}33` : "0 20px 60px rgba(0,0,0,.45)" }}>
              <div style={{ width: 70, height: 8, borderRadius: 9, background: r.color, marginBottom: 34 }} />
              <Big size={72}>{r.k}</Big>
              <div style={{ fontFamily: MONO, fontSize: 28, color: C.muted, marginTop: 14 }}>{r.sub}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- S9 · end card ---------------- */
export const EndScene: React.FC = () => {
  const f = useCurrentFrame();
  const total = line("S9").sceneFrames;
  const a = useSpring(0, { damping: 16 });
  const b = useSpring(wordAt("S9", "open") - 4);
  const c = useSpring(wordAt("S9", "built") - 4);
  const d = useSpring(wordAt("S9", "try") - 4);
  const fade = interpolate(f, [total - 20, total], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", paddingBottom: 60 }}>
        <div style={{ opacity: a, transform: `scale(${0.9 + 0.1 * a})` }}>
          <Big size={180}>
            Sketch<span style={{ color: C.cyan, textShadow: `0 0 50px ${C.cyan}88` }}>2</span>Sim
          </Big>
        </div>
        <div style={{ marginTop: 26, display: "flex", gap: 18, justifyContent: "center", opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>
          <Tag color={C.emerald}>Open source · MIT</Tag>
          <span style={{ opacity: c, display: "flex", gap: 18 }}>
            <Tag>Gemma 4</Tag>
            <Tag color={C.amber}>Claude Code</Tag>
          </span>
        </div>
        <div style={{ marginTop: 64, opacity: d, transform: `translateY(${(1 - d) * 20}px)`, fontFamily: MONO, fontSize: 38, color: C.text, lineHeight: 1.7 }}>
          <div>
            <span style={{ color: C.dim }}>try </span>glatinone.github.io/sketch2sim
          </div>
          <div>
            <span style={{ color: C.dim }}>code </span>github.com/glatinone/sketch2sim
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 150, fontFamily: MONO, fontSize: 24, color: C.dim, letterSpacing: 3, opacity: d }}>
          BUILT AT MLH HACKTOBERFEST HACK DAY BATAM 2026
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
