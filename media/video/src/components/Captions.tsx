import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { LINES } from "../timing";
import { C, FONT } from "../theme";
import { clamp } from "./ui";

const ALL = LINES.flatMap((l) => l.captions);

/** Burned-in captions: one short chunk at a time, bottom center. */
export const Captions: React.FC<{ bottom?: number; size?: number; maxWidth?: number }> = ({ bottom = 56, size = 40, maxWidth = 1500 }) => {
  const f = useCurrentFrame();
  const active = [...ALL].reverse().find((c) => c.from <= f && f < c.to);
  if (!active) return null;
  const inK = interpolate(f, [active.from, active.from + 5], [0, 1], clamp);
  const outK = interpolate(f, [active.to - 4, active.to], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          maxWidth,
          padding: "14px 30px",
          borderRadius: 18,
          background: "rgba(2,6,23,.78)",
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(8px)",
          color: C.text,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.25,
          textAlign: "center",
          opacity: Math.min(inK, outK),
          transform: `translateY(${(1 - inK) * 10}px)`,
          boxShadow: "0 12px 40px rgba(0,0,0,.45)",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
