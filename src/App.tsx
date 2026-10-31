import { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "./components/TopBar.tsx";
import ImageInput, { type ImageInputHandle } from "./components/ImageInput.tsx";
import ResultPanel, { type RunState } from "./components/ResultPanel.tsx";
import { compile, DEFAULT_MODEL_ID, loadCachedResult, USE_MOCK } from "./compileClient.ts";
import { CompileError, type Board, type CompileErrorKind } from "./contract/types.ts";
import { loadApiKey, loadModelOverride, saveApiKey, saveModelOverride } from "./ui/settings.ts";
import { MOCK_RESULT } from "./ui/mockCompile.ts";
import { useIsMobile } from "./ui/media.ts";
import { LoaderCircle, Play } from "lucide-react";

function describe(e: unknown): { kind: CompileErrorKind; message: string; raw?: string } {
  if (e instanceof CompileError) return { kind: e.kind, message: e.message, raw: e.raw };
  // Duck-type too: a CompileError from another module copy would fail instanceof.
  const any = e as { kind?: CompileErrorKind; message?: string; raw?: string };
  if (any?.kind && any.message) return { kind: any.kind, message: any.message, raw: any.raw };
  return { kind: "API", message: e instanceof Error ? e.message : String(e) };
}

// Dev-only: `?state=result|cached|compiling|error` renders a UI state directly (screenshots, layout checks).
function devInitialState(): RunState {
  if (!import.meta.env.DEV) return { status: "idle" };
  const s = new URLSearchParams(window.location.search).get("state");
  if (s === "result") return { status: "result", result: MOCK_RESULT };
  if (s === "cached") return { status: "result", result: { ...MOCK_RESULT, source: "cached" }, fallbackReason: "API: 503 high demand" };
  if (s === "compiling") return { status: "compiling", startedAt: Date.now() - 9000, previewUrl: `${import.meta.env.BASE_URL}presets/blink-button.png` };
  if (s === "error") return { status: "error", kind: "PARSE", message: "Model returned text that is not JSON.", raw: "Sure! Here is your circuit: ..." };
  return { status: "idle" };
}

export default function App() {
  const board: Board = "uno";
  const [apiKey, setApiKey] = useState(loadApiKey);
  const [modelId, setModelId] = useState(() => loadModelOverride() || DEFAULT_MODEL_ID);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [state, setState] = useState<RunState>(devInitialState);
  const inputRef = useRef<ImageInputHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);
  const isMobile = useIsMobile();

  // On phones the result sits below the input: bring it into view when a run starts and when it ends.
  useEffect(() => {
    if (isMobile && state.status !== "idle") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isMobile, state.status]);

  const onApiKey = (v: string) => {
    setApiKey(v);
    saveApiKey(v);
  };
  const onModelId = (v: string) => {
    setModelId(v);
    saveModelOverride(v.trim() === DEFAULT_MODEL_ID ? "" : v);
  };

  const run = useCallback(async () => {
    if (state.status === "compiling") return;
    const image = inputRef.current?.getImage();
    if (!image) {
      setState({ status: "error", kind: "INPUT", message: "Draw something, upload or snap a photo, or pick a preset first." });
      return;
    }
    const id = ++runId.current;
    const presetId = image.presetId;
    const key = apiKey.trim();

    // Presets without a key go straight to their (clearly labeled) cached result.
    if (!key && !USE_MOCK && presetId) {
      const cached = loadCachedResult(presetId);
      if (cached) {
        setState({ status: "result", result: { ...cached, source: "cached" }, fallbackReason: "no API key set" });
        return;
      }
    }
    if (!key && !USE_MOCK) {
      setState({ status: "error", kind: "NO_KEY", message: "Open Settings and paste a Gemini API key (free from aistudio.google.com)." });
      return;
    }

    setState({ status: "compiling", startedAt: Date.now(), previewUrl: image.previewUrl });
    try {
      const result = await compile({
        imageBase64: image.imageBase64,
        mimeType: image.mimeType,
        board,
        apiKey: key,
        modelId: modelId.trim() || DEFAULT_MODEL_ID,
      });
      if (id === runId.current) setState({ status: "result", result });
    } catch (e) {
      if (id !== runId.current) return;
      const err = describe(e);
      console.error("[sketch2sim] compile failed", e);
      const cached = presetId ? loadCachedResult(presetId) : null;
      if (cached) {
        setState({ status: "result", result: { ...cached, source: "cached" }, fallbackReason: `${err.kind}: ${err.message}` });
      } else {
        setState({ status: "error", ...err });
      }
    }
  }, [state.status, apiKey, modelId, board]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100 lg:h-dvh lg:overflow-hidden">
      <TopBar
        board={board}
        apiKey={apiKey}
        onApiKey={onApiKey}
        modelId={modelId}
        defaultModelId={DEFAULT_MODEL_ID}
        onModelId={onModelId}
        compiling={state.status === "compiling"}
        onCompile={() => void run()}
        mock={USE_MOCK}
        settingsOpen={settingsOpen}
        onSettingsOpen={setSettingsOpen}
      />
      <main className="flex flex-1 flex-col gap-4 p-3 pb-28 lg:grid lg:min-h-0 lg:grid-cols-[2fr_3fr] lg:gap-5 lg:p-4">
        <div className="h-[62dvh] min-h-[22rem] min-w-0 lg:h-auto lg:min-h-0">
          <ImageInput ref={inputRef} />
        </div>
        <div
          ref={resultRef}
          className="min-w-0 scroll-mt-16 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 lg:min-h-0 lg:p-4"
        >
          <ResultPanel state={state} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </main>

      {/* Phones: one big thumb-reachable Compile button, always visible */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => void run()}
          disabled={state.status === "compiling"}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/20 active:bg-cyan-300 disabled:opacity-70"
        >
          {state.status === "compiling" ? <LoaderCircle className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />}
          {state.status === "compiling" ? "Gemma 4 is reading your sketch…" : state.status === "result" ? "Compile again" : "Compile sketch"}
        </button>
      </div>
    </div>
  );
}
