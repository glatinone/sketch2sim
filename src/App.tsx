import { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "./components/TopBar.tsx";
import ImageInput, { type ImageInputHandle } from "./components/ImageInput.tsx";
import ResultPanel, { type RunState } from "./components/ResultPanel.tsx";
import { compile, DEFAULT_MODEL_ID, loadCachedResult, USE_MOCK } from "./compileClient.ts";
import { CompileError, type Board, type CompileErrorKind } from "./contract/types.ts";
import { loadApiKey, loadModelOverride, saveApiKey, saveModelOverride } from "./ui/settings.ts";
import { MOCK_RESULT } from "./ui/mockCompile.ts";

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
  const runId = useRef(0);

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
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
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
      <main className="grid min-h-0 flex-1 grid-cols-[2fr_3fr] gap-5 p-4">
        <div className="min-h-0 min-w-0">
          <ImageInput ref={inputRef} />
        </div>
        <div className="min-h-0 min-w-0 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <ResultPanel state={state} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </main>
    </div>
  );
}
