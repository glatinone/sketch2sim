// The single switch point between the mock and the real engine.
// The UI imports engine things ONLY through this file.
import type { CompileSketch } from "./contract/types.ts";
import { compileSketch, DEFAULT_MODEL_ID, loadCachedResult, PRESET_IDS } from "./engine/index.ts";
import { mockCompile } from "./ui/mockCompile.ts";

const MOCK_BY_DEFAULT = true;

function urlFlag(name: string): boolean {
  try {
    return new URLSearchParams(window.location.search).has(name);
  } catch {
    return false;
  }
}

/** `?mock` forces the mock (UI dev / offline rehearsal); `?live` forces the engine. */
export const USE_MOCK = urlFlag("live") ? false : MOCK_BY_DEFAULT || urlFlag("mock");

export const compile: CompileSketch = USE_MOCK ? mockCompile : compileSketch;

export { DEFAULT_MODEL_ID, loadCachedResult, PRESET_IDS };
