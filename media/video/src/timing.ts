import timeline from "./data/timeline.json";
import S1 from "../public/audio/S1.words.json";
import S2 from "../public/audio/S2.words.json";
import S3 from "../public/audio/S3.words.json";
import S4a from "../public/audio/S4a.words.json";
import S4b from "../public/audio/S4b.words.json";
import S5 from "../public/audio/S5.words.json";
import S6 from "../public/audio/S6.words.json";
import S7 from "../public/audio/S7.words.json";
import S8 from "../public/audio/S8.words.json";
import S9 from "../public/audio/S9.words.json";

export const FPS = timeline.fps;
export const TOTAL = timeline.durationInFrames;
export type Line = (typeof timeline.lines)[number];
export const LINES = timeline.lines;

type Word = { t: number; d: number; w: string };
const WORDS: Record<string, Word[]> = { S1, S2, S3, S4a, S4b, S5, S6, S7, S8, S9 };

export const line = (id: string): Line => {
  const l = LINES.find((x) => x.id === id);
  if (!l) throw new Error("no line " + id);
  return l;
};

/** Frame (relative to the line's scene start) at which `word` is spoken (nth occurrence). */
export function wordAt(id: string, word: string, nth = 0): number {
  const l = line(id);
  const target = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hits = WORDS[id].filter((w) => w.w.toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(target));
  const w = hits[nth] ?? hits[0];
  if (!w) throw new Error(`word "${word}" not in ${id}`);
  return l.audioStart - l.sceneStart + Math.round(w.t * FPS);
}
