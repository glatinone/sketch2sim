import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop, Browser, ease, Tag } from "../components/ui";
import { Camera, Footage } from "../components/Footage";
import { line, wordAt } from "../timing";
import { C } from "../theme";
import draw from "../../public/footage/draw.markers.json";
import traffic from "../../public/footage/traffic.markers.json";

const BW = 1500; // browser width on screen
const Frame: React.FC<{ children: React.ReactNode; tag?: React.ReactNode }> = ({ children, tag }) => {
  const f = useCurrentFrame();
  const k = ease(f, 0, 14);
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 34 }}>
        <Browser url="glatinone.github.io/sketch2sim" width={BW} tag={tag} style={{ transform: `scale(${0.96 + 0.04 * k})`, opacity: k }}>
          {children}
        </Browser>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** S4a: real drawing on the canvas (timelapse), then a real photo upload and the Compile click. */
export const DrawScene: React.FC = () => {
  const f = useCurrentFrame();
  const total = line("S4a").sceneFrames;
  const snap = wordAt("S4a", "snap") - 4;
  const up0 = traffic.uploaded - 2.6;
  const segs = [
    { at: 0, dur: snap, from: 0.3, to: draw.end - 0.8 },
  ];
  const segs2 = [{ at: snap, dur: total - snap, from: up0, to: traffic.compileStart + 0.6 }];
  const drawRate = Math.round(((draw.end - 1.1) * 30) / snap);
  return (
    <Frame
      tag={
        f < snap ? <Tag>Real app · {Math.min(16, drawRate)}× timelapse</Tag> : <Tag color={C.emerald}>Real app · photo of a notebook</Tag>
      }
    >
      <Camera
        viewW={BW}
        shots={[
          { at: 0, x: 0, y: 250, w: 1000 },
          { at: snap, x: 0, y: 0, w: 1920 },
          { at: total - 34, x: 900, y: 0, w: 1020 },
        ]}
      >
        <Footage clip="draw" segs={segs} width={1920} height={1080} />
        <Footage clip="traffic" segs={segs2} width={1920} height={1080} />
      </Camera>
    </Frame>
  );
};

/** S4b: the live Gemma 4 call (sped up, labeled), then the real result: parts, wiring with reasons, firmware. */
export const CompileScene: React.FC = () => {
  const f = useCurrentFrame();
  const total = line("S4b").sceneFrames;
  const ret = wordAt("S4b", "returns") - 4;
  const hand = wordAt("S4b", "handwritten");
  const wiring = wordAt("S4b", "wiring") - 2;
  const fw = wordAt("S4b", "firmware") - 8;
  const live = traffic.compileEnd - traffic.compileStart;
  const segs = [
    { at: 0, dur: ret, from: traffic.compileStart, to: traffic.compileEnd },
    { at: ret, dur: wiring - ret, from: traffic.compileEnd, to: traffic.compileEnd + 3.0 },
    { at: wiring, dur: fw - wiring, from: traffic.resultShown + 2.0, to: traffic.wiringVisible + 1.8 },
    { at: fw, dur: total - fw, from: traffic.inoTab - 0.3, to: traffic.inoTab + 3.4 },
  ];
  const speed = Math.round((live * 30) / ret);
  return (
    <Frame
      tag={
        f < ret ? (
          <Tag>Live Gemma 4 call · {Math.round(live)} s at {speed}×</Tag>
        ) : f < fw ? (
          <Tag color={C.emerald}>Real result</Tag>
        ) : (
          <Tag color={C.emerald}>Generated firmware</Tag>
        )
      }
    >
      <Camera
        viewW={BW}
        shots={[
          { at: 0, x: 780, y: 200, w: 1140 },
          { at: hand, x: 1020, y: 470, w: 720 },
          { at: ret, x: 780, y: 60, w: 1140 },
          { at: wiring, x: 790, y: 440, w: 1120 },
          { at: fw, x: 790, y: 330, w: 1000 },
        ]}
      >
        <Footage clip="traffic" segs={segs} width={1920} height={1080} />
      </Camera>
    </Frame>
  );
};
