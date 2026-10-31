import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Eraser, Pencil, Trash2, Type, Undo2 } from "lucide-react";
import { CANVAS_H, CANVAS_W, drawOp, opsToDataUrl, renderOps, STAMPS, type Op, type Pt } from "../ui/sketchOps.ts";
import { splitDataUrl, type InputImage } from "../ui/image.ts";

export interface SketchCanvasHandle {
  /** null when nothing has been drawn yet */
  exportImage(): InputImage | null;
}

type Tool = "pen" | "eraser" | "text" | { stamp: string };

const sameTool = (a: Tool, b: Tool) =>
  typeof a === "string" || typeof b === "string" ? a === b : a.stamp === b.stamp;

export default function SketchCanvas({ ref }: { ref?: Ref<SketchCanvasHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ops, setOps] = useState<Op[]>([]);
  const [tool, setTool] = useState<Tool>({ stamp: "UNO" });
  const live = useRef<(Op & { kind: "stroke" }) | null>(null);

  useImperativeHandle(ref, () => ({
    exportImage() {
      if (!ops.length) return null;
      // Paper theme (white bg, dark ink) = what a photo of a real napkin looks like.
      const previewUrl = opsToDataUrl(ops, "paper");
      return { ...splitDataUrl(previewUrl), previewUrl };
    },
  }), [ops]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) renderOps(ctx, ops, "screen");
  }, [ops]);

  const toCanvas = (e: React.PointerEvent): Pt => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * CANVAS_W, y: ((e.clientY - r.top) / r.height) * CANVAS_H };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toCanvas(e);
    if (typeof tool === "object") {
      setOps((o) => [...o, { kind: "stamp", label: tool.stamp, x: p.x, y: p.y }]);
      return;
    }
    if (tool === "text") {
      const text = window.prompt("Note to add to the sketch (e.g. “press = LED on”)")?.trim();
      if (text) setOps((o) => [...o, { kind: "text", text, x: p.x, y: p.y }]);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    live.current = { kind: "stroke", mode: tool, pts: [p] };
    drawOp(e.currentTarget.getContext("2d")!, live.current, "screen");
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = live.current;
    if (!s) return;
    const p = toCanvas(e);
    const prev = s.pts[s.pts.length - 1];
    if (Math.hypot(p.x - prev.x, p.y - prev.y) < 2) return;
    s.pts.push(p);
    // incremental: draw only the newest segment while the pointer is down
    drawOp(e.currentTarget.getContext("2d")!, { ...s, pts: [prev, p] }, "screen");
  };

  const onUp = () => {
    const s = live.current;
    live.current = null;
    if (s) setOps((o) => [...o, s]);
  };

  const toolBtn = (t: Tool, label: React.ReactNode, title: string) => (
    <button
      key={title}
      type="button"
      title={title}
      onClick={() => setTool(t)}
      className={`h-9 rounded-md px-2.5 text-sm font-semibold transition ${
        sameTool(tool, t) ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {toolBtn("pen", <Pencil className="size-4" />, "Pen")}
        {toolBtn("eraser", <Eraser className="size-4" />, "Eraser")}
        {toolBtn("text", <Type className="size-4" />, "Text note")}
        <span className="mx-1 h-6 w-px bg-slate-700" />
        {STAMPS.map((s) => toolBtn({ stamp: s }, s, `Stamp ${s} box — then click the canvas`))}
        <span className="ml-auto flex gap-1.5">
          <button
            type="button"
            title="Undo"
            disabled={!ops.length}
            onClick={() => setOps((o) => o.slice(0, -1))}
            className="h-9 rounded-md bg-slate-800 px-2.5 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
          >
            <Undo2 className="size-4" />
          </button>
          <button
            type="button"
            title="Clear"
            disabled={!ops.length}
            onClick={() => setOps([])}
            className="h-9 rounded-md bg-slate-800 px-2.5 text-slate-200 hover:bg-rose-600 disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>
        </span>
      </div>
      <div className="relative min-h-0 flex-1 rounded-xl border border-slate-700 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`absolute inset-0 m-auto max-h-full max-w-full touch-none rounded-lg ring-1 ring-slate-700 ${typeof tool === "object" || tool === "text" ? "cursor-copy" : "cursor-crosshair"}`}
        />
        {!ops.length && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-center text-base text-slate-500">
            Pick a stamp (UNO, LED…) and click to place it,
            <br />
            then use the pen to draw the wires between boxes.
          </p>
        )}
      </div>
    </div>
  );
}
