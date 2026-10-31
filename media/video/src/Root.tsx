import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { Sketch2SimDemo } from "./Demo";
import { Captions } from "./components/Captions";
import { TOTAL, FPS } from "./timing";
import { C, MONO } from "./theme";
import { Sketch2SimShort, SHORT_TOTAL } from "./shorts/Short";

/** 4:5 social cut: the 16:9 master (no captions) sits in the middle, big captions below. */
const Demo4x5: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: C.muted }}>
      SKETCH<span style={{ color: C.cyan }}>2</span>SIM · MLH HACK DAY BATAM
    </div>
    <div style={{ position: "absolute", top: 300, left: 0, width: 1080, height: 608, overflow: "hidden" }}>
      <div style={{ width: 1920, height: 1080, transform: "scale(0.5625)", transformOrigin: "0 0" }}>
        <Sketch2SimDemo captions={false} />
      </div>
    </div>
    <Captions bottom={150} size={46} maxWidth={960} />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Sketch2SimDemo" component={Sketch2SimDemo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} />
    <Composition id="Sketch2SimShort" component={Sketch2SimShort} durationInFrames={SHORT_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Sketch2SimDemo4x5" component={Demo4x5} durationInFrames={TOTAL} fps={FPS} width={1080} height={1350} />
  </>
);
