import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { LINES } from "./timing";
import { Captions } from "./components/Captions";
import { Title } from "./scenes/Title";
import { Problem } from "./scenes/Problem";
import { Idea } from "./scenes/Idea";
import { CompileScene, DrawScene } from "./scenes/Demo";
import { EndScene, NumbersScene, ProofScene, TrustScene, VisionScene } from "./scenes/Story";
import { C } from "./theme";

const SCENES: Record<string, React.FC> = {
  title: Title,
  problem: Problem,
  idea: Idea,
  draw: DrawScene,
  compile: CompileScene,
  trust: TrustScene,
  proof: ProofScene,
  numbers: NumbersScene,
  vision: VisionScene,
  end: EndScene,
};

/** A fast diagonal light sweep that hides each hard cut. */
const Sweep: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 14], [-60, 160]);
  const o = interpolate(f, [0, 4, 10, 14], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${x - 30}%, ${C.cyan}33 ${x - 12}%, #ffffff55 ${x}%, ${C.emerald}33 ${x + 12}%, transparent ${x + 30}%)`, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: C.bg, opacity: interpolate(f, [4, 7, 10], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
    </AbsoluteFill>
  );
};

/** 16:9 master: scenes are sized to the measured voice-over, captions burned in. */
export const Sketch2SimDemo: React.FC<{ captions?: boolean }> = ({ captions = true }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    {LINES.map((l) => {
      const Scene = SCENES[l.scene];
      return (
        <Sequence key={l.id} from={l.sceneStart} durationInFrames={l.sceneFrames} name={`${l.id} ${l.scene}`}>
          <Scene />
        </Sequence>
      );
    })}
    {LINES.map((l) => (
      <Sequence key={`a-${l.id}`} from={l.audioStart} durationInFrames={l.audioFrames + 15} name={`VO ${l.id}`}>
        <Audio src={staticFile(`audio/${l.id}.mp3`)} />
      </Sequence>
    ))}
    {LINES.slice(1).map((l) => (
      <Sequence key={`t-${l.id}`} from={l.sceneStart - 7} durationInFrames={14} name={`cut ${l.id}`}>
        <Sweep />
      </Sequence>
    ))}
    {captions && <Captions />}
  </AbsoluteFill>
);
