import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop, Big, ease, useSpring } from "../components/ui";
import { wordAt } from "../timing";
import { C, HAND, MONO } from "../theme";

// "What if the sketch was the source code?" as kinetic type.
export const Idea: React.FC = () => {
  const f = useCurrentFrame();
  const at = wordAt("S3", "what");
  const sketchAt = wordAt("S3", "sketch");
  const codeAt = wordAt("S3", "source");
  const a = useSpring(at - 4);
  const s = useSpring(sketchAt - 3, { damping: 11, stiffness: 180 });
  const code = "source code?";
  const typed = Math.max(0, Math.min(code.length, Math.floor((f - codeAt + 2) * 0.9)));
  const underline = ease(f, sketchAt + 2, sketchAt + 16);
  const pre = ease(f, 0, 10) * (1 - ease(f, at - 10, at));

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ opacity: pre, position: "absolute", fontFamily: MONO, fontSize: 40, color: C.muted, letterSpacing: 4 }}>ONE QUESTION</div>
        <div style={{ opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
          <Big size={120}>
            What if the{" "}
            <span style={{ position: "relative", display: "inline-block", fontFamily: HAND, fontWeight: 400, color: C.amber, transform: `scale(${0.6 + 0.4 * s}) rotate(${-3 * s}deg)`, opacity: s }}>
              sketch
              <svg width="360" height="40" viewBox="0 0 360 40" style={{ position: "absolute", left: -10, bottom: -18 }}>
                <path d="M5 25 C 80 8, 200 38, 355 14" stroke={C.amber} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - underline} />
              </svg>
            </span>
          </Big>
          <Big size={120} style={{ marginTop: 28 }}>
            was the{" "}
            <span style={{ fontFamily: MONO, fontWeight: 700, color: C.cyan, textShadow: `0 0 40px ${C.cyan}55` }}>
              {code.slice(0, typed)}
              <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0.15 }}>▍</span>
            </span>
          </Big>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
