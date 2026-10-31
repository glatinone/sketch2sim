// Drawing model shared by the live canvas, the preset generator and the exporter.
export type Pt = { x: number; y: number };

export type Op =
  | { kind: "stroke"; mode: "pen" | "eraser"; pts: Pt[] }
  | { kind: "stamp"; label: string; x: number; y: number }
  | { kind: "text"; text: string; x: number; y: number; size?: number };

export const CANVAS_W = 1200;
export const CANVAS_H = 800;

export const STAMPS = ["UNO", "LED", "BUTTON", "BUZZER", "SERVO", "POT", "ULTRASONIC"] as const;

export type Theme = "screen" | "paper";
const THEMES: Record<Theme, { bg: string; ink: string }> = {
  screen: { bg: "#0b1120", ink: "#f1f5f9" },
  paper: { bg: "#ffffff", ink: "#111827" },
};

const HAND_FONT = `"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive`;
const PEN_W = 4;
const ERASER_W = 36;

// Deterministic jitter so a stamp looks hand-drawn but never "shimmers" on redraw.
function rng(seed: number) {
  let s = Math.abs(Math.floor(seed)) % 2147483647;
  if (s === 0) s = 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647 - 0.5;
}

function stampSize(ctx: CanvasRenderingContext2D, label: string) {
  ctx.font = `600 34px ${HAND_FONT}`;
  return { w: Math.max(110, ctx.measureText(label).width + 44), h: 70 };
}

function drawStamp(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, ink: string) {
  const { w, h } = stampSize(ctx, label);
  const left = x - w / 2;
  const top = y - h / 2;
  const r = rng(x * 31 + y * 17 + label.length);
  ctx.strokeStyle = ink;
  ctx.lineWidth = PEN_W;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // two slightly offset passes = pencil-ish rectangle
  for (let pass = 0; pass < 2; pass++) {
    const j = () => r() * (pass ? 6 : 3);
    ctx.beginPath();
    ctx.moveTo(left + j(), top + j());
    ctx.lineTo(left + w + j(), top + j());
    ctx.lineTo(left + w + j(), top + h + j());
    ctx.lineTo(left + j(), top + h + j());
    ctx.closePath();
    ctx.globalAlpha = pass ? 0.45 : 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 2);
}

function drawStroke(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, width: number) {
  if (!pts.length) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

export function drawOp(ctx: CanvasRenderingContext2D, op: Op, theme: Theme) {
  const { bg, ink } = THEMES[theme];
  if (op.kind === "stroke") {
    drawStroke(ctx, op.pts, op.mode === "eraser" ? bg : ink, op.mode === "eraser" ? ERASER_W : PEN_W);
  } else if (op.kind === "stamp") {
    drawStamp(ctx, op.label, op.x, op.y, ink);
  } else {
    ctx.font = `500 ${op.size ?? 28}px ${HAND_FONT}`;
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(op.text, op.x, op.y);
  }
}

export function renderOps(ctx: CanvasRenderingContext2D, ops: Op[], theme: Theme) {
  ctx.save();
  ctx.fillStyle = THEMES[theme].bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const op of ops) drawOp(ctx, op, theme);
  ctx.restore();
}

/** Render to an offscreen canvas and return a PNG data URL (paper = white bg, dark ink). */
export function opsToDataUrl(ops: Op[], theme: Theme = "paper"): string {
  const c = document.createElement("canvas");
  c.width = CANVAS_W;
  c.height = CANVAS_H;
  renderOps(c.getContext("2d")!, ops, theme);
  return c.toDataURL("image/png");
}

/** A wobbly hand-drawn line from a to b (for preset sketches). */
export function handLine(a: Pt, b: Pt, seed = 1): Op & { kind: "stroke" } {
  const r = rng(seed * 7919 + a.x * 3 + b.y);
  const n = Math.max(6, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 22));
  const nx = -(b.y - a.y);
  const ny = b.x - a.x;
  const len = Math.hypot(nx, ny) || 1;
  const pts: Pt[] = [];
  let drift = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    drift = drift * 0.6 + r() * 4;
    const k = i === 0 || i === n ? 0 : drift;
    pts.push({ x: a.x + (b.x - a.x) * t + (nx / len) * k, y: a.y + (b.y - a.y) * t + (ny / len) * k });
  }
  return { kind: "stroke", mode: "pen", pts };
}

/** Polyline through several points, each segment wobbly. */
export function handPath(points: Pt[], seed = 1): Op {
  const pts: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const seg = handLine(points[i], points[i + 1], seed + i);
    pts.push(...(i ? seg.pts.slice(1) : seg.pts));
  }
  return { kind: "stroke", mode: "pen", pts };
}
