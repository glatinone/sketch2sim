import React from "react";
import { OffthreadVideo, Sequence, staticFile, interpolate, useCurrentFrame, Easing } from "remotion";
import { clamp } from "./ui";

export type Seg = {
  /** where this segment starts inside the scene (frames) */
  at: number;
  /** how long it plays in the scene (frames) */
  dur: number;
  /** source start/end in seconds of the clip */
  from: number;
  to: number;
};

/** Plays parts of a real screen recording, each part time-stretched to fit its slot. */
export const Footage: React.FC<{ clip: string; segs: Seg[]; width: number; height: number }> = ({ clip, segs, width, height }) => (
  <>
    {segs.map((s, i) => {
      const rate = ((s.to - s.from) * 30) / s.dur;
      return (
        <Sequence key={i} from={s.at} durationInFrames={s.dur} layout="none">
          <OffthreadVideo
            src={staticFile(`footage/${clip}.mp4`)}
            startFrom={Math.round(s.from * 30)}
            playbackRate={Math.max(0.0625, Math.min(16, rate))}
            muted
            style={{ position: "absolute", inset: 0, width, height, objectFit: "cover" }}
          />
        </Sequence>
      );
    })}
  </>
);

/** Camera: animate a "focus box" (in source px of a 1920x1080 frame) and scale content to fill. */
export type Shot = { at: number; x: number; y: number; w: number };
export const Camera: React.FC<{ shots: Shot[]; viewW: number; children: React.ReactNode; dur?: number }> = ({ shots, viewW, children, dur = 24 }) => {
  const f = useCurrentFrame();
  let cur = shots[0];
  let prev = shots[0];
  for (const s of shots) if (f >= s.at) { prev = cur; cur = s; }
  const k = interpolate(f, [cur.at, cur.at + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const lerp = (a: number, b: number) => a + (b - a) * (cur === prev ? 1 : k);
  const x = lerp(prev.x, cur.x), y = lerp(prev.y, cur.y), w = lerp(prev.w, cur.w);
  const scale = 1920 / w; // content is laid out at 1920 wide, then mapped into viewW
  const unit = viewW / 1920;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `scale(${unit}) scale(${scale}) translate(${-x}px, ${-y}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
