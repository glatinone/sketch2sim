import type { CompileSketch, CompileResult } from "../contract/types.ts";
export const DEFAULT_MODEL_ID = "gemma-4-PLACEHOLDER";
export const PRESET_IDS = ["blink-button", "parking-sensor", "servo-pot"] as const;
export const compileSketch: CompileSketch = async () => { throw new Error("engine not ready"); };
export function loadCachedResult(_id: string): CompileResult | null { return null; }
