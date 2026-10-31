import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ChevronRight,
  CircuitBoard,
  Clock,
  Cpu,
  ExternalLink,
  FileCode2,
  FileJson,
  KeyRound,
  ListChecks,
  Sparkles,
} from "lucide-react";
import type { CompileErrorKind, CompileResult } from "../contract/types.ts";
import ResultCircuit from "./ResultCircuit.tsx";
import ResultCode, { CopyButton } from "./ResultCode.tsx";
import ResultNotes from "./ResultNotes.tsx";

export const WOKWI_NEW_UNO = "https://wokwi.com/projects/new/arduino-uno";

export type RunState =
  | { status: "idle" }
  | { status: "compiling"; startedAt: number; previewUrl: string }
  | { status: "result"; result: CompileResult; fallbackReason?: string }
  | { status: "error"; kind: CompileErrorKind | "INPUT"; message: string; raw?: string };

type Tab = "circuit" | "diagram" | "ino" | "notes";

export default function ResultPanel({ state, onOpenSettings }: { state: RunState; onOpenSettings(): void }) {
  if (state.status === "idle") return <Idle />;
  if (state.status === "compiling") return <Compiling startedAt={state.startedAt} previewUrl={state.previewUrl} />;
  if (state.status === "error") return <ErrorView {...state} onOpenSettings={onOpenSettings} />;
  return <ResultView key={state.result.latencyMs + state.result.projectTitle} result={state.result} fallbackReason={state.fallbackReason} />;
}

function ResultView({ result, fallbackReason }: { result: CompileResult; fallbackReason?: string }) {
  const [tab, setTab] = useState<Tab>("circuit");
  const cached = result.source === "cached";
  // Notes the presenter must act on inside Wokwi (e.g. "add Servo in Library Manager").
  const usesServo = /#include\s*<Servo\.h>/.test(result.sketchIno);
  const wokwiNotes = [
    ...(usesServo
      ? ['Servo sketch: the first ▶ in Wokwi fails on "Servo.h" — click the INSTALL "SERVO" LIBRARY button Wokwi offers, then press ▶ again.']
      : []),
    ...result.notes.filter((n) => /librar|wokwi/i.test(n) && !(usesServo && /servo/i.test(n))),
  ];
  const tabs: { id: Tab; label: string; icon: typeof Cpu; count?: number }[] = [
    { id: "circuit", label: "Circuit", icon: CircuitBoard },
    { id: "diagram", label: "diagram.json", icon: FileJson },
    { id: "ino", label: "sketch.ino", icon: FileCode2 },
    { id: "notes", label: "Notes", icon: ListChecks, count: result.notes.length },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      {/* Header strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="mr-auto text-2xl font-extrabold text-white">{result.projectTitle}</h2>
        {cached && (
          <span
            className="flex items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1 text-base font-black tracking-wide text-slate-950 shadow-lg shadow-amber-500/30"
            title="This result was saved earlier from a real Gemma 4 run — not generated just now."
          >
            <Archive className="size-4" /> CACHED
          </span>
        )}
        <span className="flex items-center gap-1.5 text-sm text-slate-400">
          <Clock className="size-4" />
          {cached ? "saved run" : `${(result.latencyMs / 1000).toFixed(1)} s`}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-sm text-slate-400">
          <Cpu className="size-4" />
          {result.modelId}
        </span>
      </div>
      {fallbackReason && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Live compile unavailable ({fallbackReason}) — showing the cached result for this preset.
        </p>
      )}

      {/* Wokwi flow: the demo's wow moment, always one click away */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5">
        <a
          href={WOKWI_NEW_UNO}
          target="_blank"
          rel="noreferrer"
          className="flex h-10 items-center gap-2 rounded-md bg-emerald-400 px-4 text-base font-bold text-slate-950 hover:bg-emerald-300"
        >
          <ExternalLink className="size-4" /> Open Wokwi
        </a>
        <ChevronRight className="size-4 text-slate-600" />
        <CopyButton big text={result.diagramJson} label="Copy diagram.json" />
        <ChevronRight className="size-4 text-slate-600" />
        <CopyButton big text={result.sketchIno} label="Copy sketch.ino" />
        <span className="ml-1 text-sm text-slate-400">
          1. paste into the <b className="text-slate-200">diagram.json</b> tab · 2. paste <b className="text-slate-200">sketch.ino</b> · 3. press{" "}
          <b className="text-emerald-300">▶</b> · tip: press <kbd className="rounded bg-slate-800 px-1 text-slate-200">F</kbd> in Wokwi to fit the view
        </span>
        {wokwiNotes.length > 0 && (
          <ul className="w-full space-y-0.5 border-t border-emerald-500/20 pt-2 text-sm text-amber-200">
            {wokwiNotes.map((n) => (
              <li key={n}>⚠ {n}</li>
            ))}
          </ul>
        )}
      </div>

      <nav className="flex gap-1 border-b border-slate-800">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-base font-semibold transition ${
              tab === id ? "border-cyan-400 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="size-4" />
            <span className={id === "diagram" || id === "ino" ? "font-mono" : ""}>{label}</span>
            {count ? <span className="rounded-full bg-slate-700 px-1.5 text-xs">{count}</span> : null}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {tab === "circuit" && <ResultCircuit result={result} />}
        {tab === "diagram" && <ResultCode filename="diagram.json" code={result.diagramJson} />}
        {tab === "ino" && <ResultCode filename="sketch.ino" code={result.sketchIno} />}
        {tab === "notes" && <ResultNotes notes={result.notes} />}
      </div>
    </section>
  );
}

function Idle() {
  const steps = [
    ["Sketch", "Draw boxes + lines, upload a photo of paper, or snap it with the camera."],
    ["Gemma 4 reads it", "The multimodal model identifies parts and picks Arduino pins."],
    ["Validator repairs", "Deterministic checks fix pin names, add resistors, enforce PWM pins."],
    ["Run in Wokwi", "Paste diagram.json + sketch.ino into a real simulator and press ▶."],
  ];
  return (
    <div className="grid h-full place-items-center">
      <div className="max-w-xl">
        <h2 className="mb-1 flex items-center gap-2 text-3xl font-extrabold text-white">
          <Sparkles className="size-7 text-cyan-400" /> Napkin → running circuit
        </h2>
        <p className="mb-6 text-lg text-slate-400">
          Press <b className="text-slate-200">Compile</b> or <kbd className="rounded bg-slate-800 px-1.5 text-base">Ctrl</kbd>+
          <kbd className="rounded bg-slate-800 px-1.5 text-base">Enter</kbd>
        </p>
        <ol className="space-y-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-lg font-bold text-cyan-300">{i + 1}</span>
              <div>
                <div className="text-lg font-bold text-slate-100">{t}</div>
                <div className="text-slate-400">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// A live compile takes ~30 s (up to ~2 min on a busy free tier). The stages keep the screen alive;
// validation + firmware happen right after the model replies.
const STAGES: [number, string][] = [
  [0, "Sending sketch to Gemma 4…"],
  [2, "Gemma 4 reading sketch…"],
  [7, "Identifying parts…"],
  [13, "Choosing Arduino pins…"],
  [19, "Writing firmware…"],
  [25, "Validating pins…"],
  [40, "Still thinking — big multimodal model, almost there…"],
];

function Compiling({ startedAt, previewUrl }: { startedAt: number; previewUrl: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const secs = (now - startedAt) / 1000;
  const stage = STAGES.filter(([s]) => secs >= s).at(-1)![1];
  return (
    <div className="grid h-full place-items-center">
      <div className="flex w-full max-w-lg flex-col items-center gap-5">
        <div className="relative w-full overflow-hidden rounded-xl border border-cyan-500/40 bg-white">
          <img src={previewUrl} alt="" className="aspect-[3/2] w-full object-contain opacity-80" />
          <div className="s2s-scan absolute inset-x-0 h-16" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stage}</div>
          <div className="mt-1 font-mono text-slate-400">
            {secs.toFixed(1)} s <span className="font-sans text-slate-500">· usually ~30 s</span>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="s2s-indeterminate h-full w-1/3 rounded-full bg-cyan-400" />
        </div>
      </div>
    </div>
  );
}

const ERROR_TITLE: Record<CompileErrorKind | "INPUT", string> = {
  INPUT: "Nothing to compile yet",
  NO_KEY: "Gemini API key needed",
  API: "Gemini API error",
  PARSE: "Couldn't parse the model's answer",
  VALIDATION: "Circuit failed validation",
  TIMEOUT: "Gemma took too long",
};

function ErrorView({
  kind,
  message,
  raw,
  onOpenSettings,
}: {
  kind: CompileErrorKind | "INPUT";
  message: string;
  raw?: string;
  onOpenSettings(): void;
}) {
  const soft = kind === "INPUT";
  return (
    <div className="grid h-full place-items-center">
      <div className={`w-full max-w-2xl rounded-xl border p-5 ${soft ? "border-slate-700 bg-slate-900" : "border-rose-500/50 bg-rose-500/5"}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`mt-1 size-6 shrink-0 ${soft ? "text-slate-400" : "text-rose-400"}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">{ERROR_TITLE[kind] ?? "Compile failed"}</h2>
              {!soft && <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-sm font-bold text-rose-300">{kind}</span>}
            </div>
            <p className="mt-1 break-words text-lg text-slate-300">{message}</p>
            {kind === "NO_KEY" && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="mt-3 flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300"
              >
                <KeyRound className="size-4" /> Add API key
              </button>
            )}
            {!soft && kind !== "NO_KEY" && (
              <p className="mt-2 text-sm text-slate-500">Tip: try again, or pick a preset — presets fall back to a labeled cached result.</p>
            )}
            {raw && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-400 hover:text-slate-200">Raw model output</summary>
                <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs whitespace-pre-wrap text-slate-300">{raw}</pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
