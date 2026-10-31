import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, clamp, ease, useSpring } from "../components/ui";
import { C, FONT, HAND, MONO } from "../theme";

// M1 title sting: a pencil sketch draws itself, then snaps into clean, glowing circuit wires.
const boxes = [
  { label: "UNO", x: 640, y: 470, w: 250, h: 130 },
  { label: "BUTTON", x: 1150, y: 300, w: 270, h: 110 },
  { label: "LED", x: 1170, y: 640, w: 200, h: 110 },
];
// hand-drawn (wobbly) vs clean (orthogonal) versions of the two wires
const wires = [
  { hand: "M890 515 C 960 510, 990 470, 1010 420 S 1080 352, 1150 356", clean: "M890 515 H 1020 V 355 H 1150", color: C.emerald },
  { hand: "M890 560 C 980 570, 1000 620, 1030 660 S 1110 698, 1170 694", clean: "M890 560 H 1020 V 695 H 1170", color: C.rose },
];

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  const snap = useSpring(52, { damping: 14, stiffness: 120 }); // sketch -> clean
  const lift = useSpring(86, { damping: 20 });
  const logo = (i: number) => useSpring(96 + i * 3, { damping: 13, stiffness: 160 });
  const sub = ease(f, 128, 150);
  const flow = (f * 6) % 400;

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ transform: `translateX(-70px) translateY(${-150 * lift}px) scale(${1 - 0.28 * lift})` }}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* pencil layer */}
          <g opacity={1 - snap} stroke="#e2e8f0" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round">
            {boxes.map((b, i) => {
              const p = 2 * (b.w + b.h);
              return (
                <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} strokeDasharray={p} strokeDashoffset={p * (1 - ease(f, 4 + i * 8, 30 + i * 8))}
                  transform={`rotate(${i % 2 ? 1.2 : -1}, ${b.x + b.w / 2}, ${b.y + b.h / 2})`} />
              );
            })}
            {wires.map((w, i) => (
              <path key={i} d={w.hand} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(f, 26 + i * 6, 48 + i * 6)} />
            ))}
          </g>
          {boxes.map((b, i) => (
            <text key={i} x={b.x + b.w / 2} y={b.y + b.h / 2 + 15} textAnchor="middle" fontFamily={HAND} fontSize={44} fill="#e2e8f0"
              opacity={interpolate(f, [14 + i * 8, 24 + i * 8], [0, 1], clamp) * (1 - snap)}>
              {b.label}
            </text>
          ))}
          {/* clean layer */}
          <g opacity={snap}>
            {wires.map((w, i) => (
              <g key={i}>
                <path d={w.clean} stroke={w.color} strokeWidth={8} fill="none" strokeLinejoin="round" filter="url(#glow)" />
                <path d={w.clean} stroke="#fff" strokeWidth={4} fill="none" strokeDasharray="10 390" strokeDashoffset={-flow - i * 200} strokeLinecap="round" opacity={0.9} />
              </g>
            ))}
            {boxes.map((b, i) => (
              <g key={i} transform={`translate(${b.x + b.w / 2}, ${b.y + b.h / 2}) scale(${0.85 + 0.15 * snap}) translate(${-b.w / 2}, ${-b.h / 2})`}>
                <rect width={b.w} height={b.h} rx={22} fill={C.panel} stroke={i === 0 ? C.cyan : C.line} strokeWidth={4} />
                <text x={b.w / 2} y={b.h / 2 + 14} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={40} fill={i === 0 ? C.cyan : C.text}>
                  {b.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: 470 }}>
        <div style={{ display: "flex", fontFamily: FONT, fontWeight: 800, fontSize: 168, letterSpacing: -6, color: C.text }}>
          {"Sketch2Sim".split("").map((ch, i) => {
            const k = logo(i);
            return (
              <span key={i} style={{ display: "inline-block", opacity: k, transform: `translateY(${(1 - k) * 60}px)`, color: ch === "2" ? C.cyan : C.text, textShadow: ch === "2" ? `0 0 40px ${C.cyan}88` : "none" }}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{ marginTop: 18, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`, fontFamily: MONO, fontSize: 30, color: C.muted, letterSpacing: 3 }}>
          MLH HACKTOBERFEST HACK DAY BATAM · 31 OCT 2026
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
