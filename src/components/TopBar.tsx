import { useEffect, useRef, useState } from "react";
import { CircuitBoard, Eye, EyeOff, KeyRound, LoaderCircle, Play, RotateCcw, Settings, X } from "lucide-react";
import type { Board } from "../contract/types.ts";

interface Props {
  board: Board;
  apiKey: string;
  onApiKey(v: string): void;
  modelId: string;
  defaultModelId: string;
  onModelId(v: string): void;
  compiling: boolean;
  onCompile(): void;
  mock: boolean;
  settingsOpen: boolean;
  onSettingsOpen(open: boolean): void;
}

export default function TopBar(p: Props) {
  const [show, setShow] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!p.settingsOpen) return;
    const close = (e: PointerEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) p.onSettingsOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && p.onSettingsOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [p]);

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950/95 px-3 backdrop-blur lg:static lg:h-16 lg:gap-4 lg:px-5">
      <div className="flex items-center gap-2.5">
        <CircuitBoard className="size-6 text-cyan-400 lg:size-7" />
        <h1 className="text-xl font-extrabold tracking-tight text-white lg:text-2xl">
          Sketch<span className="text-cyan-400">2</span>Sim
        </h1>
      </div>
      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-emerald-300 lg:px-3 lg:py-1 lg:text-sm">
        Gemma 4<span className="hidden sm:inline"> multimodal</span>
      </span>
      {p.mock && (
        <span className="rounded-full border border-fuchsia-500/50 bg-fuchsia-500/10 px-3 py-1 text-sm font-semibold text-fuchsia-300">
          MOCK engine
        </span>
      )}

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <label className="hidden items-center gap-2 text-sm text-slate-400 lg:flex">
          Board
          <select
            value={p.board}
            onChange={() => {}}
            className="h-10 rounded-md border border-slate-700 bg-slate-900 px-2 text-base text-slate-100"
          >
            <option value="uno">Arduino Uno</option>
            <option value="esp32" disabled>
              ESP32 (soon)
            </option>
          </select>
        </label>

        <div className="relative" ref={popRef}>
          <button
            type="button"
            onClick={() => p.onSettingsOpen(!p.settingsOpen)}
            aria-label="Settings"
            className={`flex h-10 items-center gap-2 rounded-md border px-2.5 text-sm lg:px-3 lg:text-base ${
              p.apiKey || p.mock
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                : "border-amber-500/60 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
            }`}
          >
            <Settings className="size-5" />
            {p.apiKey || p.mock ? <span className="hidden sm:inline">Settings</span> : "API key"}
          </button>
          {p.settingsOpen && (
            <div className="fixed inset-x-3 top-16 z-50 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-black/60 lg:absolute lg:inset-x-auto lg:right-0 lg:top-12 lg:w-[26rem]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <button type="button" onClick={() => p.onSettingsOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                <KeyRound className="size-4" /> Gemini API key
              </label>
              <div className="flex gap-2">
                <input
                  type={show ? "text" : "password"}
                  value={p.apiKey}
                  onChange={(e) => p.onApiKey(e.target.value)}
                  placeholder="Paste key from aistudio.google.com"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-base text-slate-100 outline-none focus:border-cyan-500 lg:h-10 lg:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="rounded-md border border-slate-700 px-2 text-slate-300 hover:bg-slate-800"
                  title={show ? "Hide" : "Show"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Stored only in this browser (localStorage). Sent only to Google's Gemini API.</p>

              <label className="mb-1 mt-4 block text-sm font-semibold text-slate-300">Model ID</label>
              <div className="flex gap-2">
                <input
                  value={p.modelId}
                  onChange={(e) => p.onModelId(e.target.value)}
                  spellCheck={false}
                  className="h-11 min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 font-mono text-base text-slate-100 outline-none focus:border-cyan-500 lg:h-10 lg:text-sm"
                />
                <button
                  type="button"
                  onClick={() => p.onModelId(p.defaultModelId)}
                  disabled={p.modelId === p.defaultModelId}
                  className="rounded-md border border-slate-700 px-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  title={`Reset to ${p.defaultModelId}`}
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Default: {p.defaultModelId}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={p.onCompile}
          disabled={p.compiling}
          title="Compile (Ctrl+Enter)"
          className="hidden h-11 items-center gap-2 rounded-lg bg-cyan-400 px-6 text-lg font-bold lg:flex text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-70"
        >
          {p.compiling ? <LoaderCircle className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />}
          {p.compiling ? "Compiling…" : "Compile"}
          <kbd className="ml-1 hidden rounded bg-slate-950/15 px-1.5 text-xs font-semibold xl:inline">Ctrl ↵</kbd>
        </button>
      </div>
    </header>
  );
}
