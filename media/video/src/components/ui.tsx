import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { C, FONT, MONO } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 spring starting at frame `at`. */
export function useSpring(at: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 140, mass: 0.8, ...config } });
}

export const ease = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });

/** Dark backdrop: deep gradient, slowly drifting glows, faint dot grid. */
export const Backdrop: React.FC<{ hue?: "cyan" | "emerald" | "amber" }> = ({ hue = "cyan" }) => {
  const f = useCurrentFrame();
  const g = hue === "cyan" ? C.cyan : hue === "emerald" ? C.emerald : C.amber;
  const x = 30 + Math.sin(f / 90) * 12;
  const y = 30 + Math.cos(f / 110) * 10;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${x}% ${y}%, ${g}22, transparent 70%), radial-gradient(800px 700px at ${100 - x}% ${100 - y}%, ${C.emerald}14, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${C.line} 1.4px, transparent 1.4px)`,
          backgroundSize: "44px 44px",
          backgroundPosition: `${(f * 0.25) % 44}px ${(f * 0.15) % 44}px`,
          opacity: 0.55,
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Small uppercase label chip, e.g. "REAL APP · 8× SPEED". */
export const Tag: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.cyan, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 20px",
      borderRadius: 999,
      background: `${color}1f`,
      border: `2px solid ${color}66`,
      color,
      fontFamily: MONO,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: 2,
      textTransform: "uppercase",
      ...style,
    }}
  >
    <span style={{ width: 12, height: 12, borderRadius: 99, background: color, boxShadow: `0 0 16px ${color}` }} />
    {children}
  </div>
);

/** A browser window frame around real footage. */
export const Browser: React.FC<{ url: string; children: React.ReactNode; width: number; style?: React.CSSProperties; tag?: React.ReactNode }> = ({ url, children, width, style, tag }) => {
  const h = (width * 9) / 16;
  return (
    <div
      style={{
        width,
        borderRadius: 22,
        overflow: "hidden",
        background: C.panel,
        border: `2px solid ${C.line}`,
        boxShadow: `0 50px 120px rgba(0,0,0,.65), 0 0 0 1px #ffffff08, 0 0 80px ${C.cyan}18`,
        ...style,
      }}
    >
      <div style={{ height: 46, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", background: "#0b1222", borderBottom: `1px solid ${C.line}` }}>
        {["#fb7185", "#fbbf24", "#34d399"].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c, opacity: 0.85 }} />
        ))}
        <div
          style={{
            marginLeft: 18,
            flex: 1,
            maxWidth: 620,
            height: 28,
            borderRadius: 8,
            background: "#020617",
            color: C.muted,
            fontFamily: MONO,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            paddingLeft: 14,
          }}
        >
          {url}
        </div>
        <div style={{ marginLeft: "auto", transform: "scale(.78)", transformOrigin: "right center" }}>{tag}</div>
      </div>
      <div style={{ position: "relative", width, height: h, overflow: "hidden" }}>{children}</div>
    </div>
  );
};

export const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({
  children,
  size = 110,
  color = C.text,
  style,
}) => (
  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: size, color, letterSpacing: -size * 0.03, lineHeight: 1.02, ...style }}>{children}</div>
);
