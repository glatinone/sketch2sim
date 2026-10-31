// API key + model id live only in this browser's localStorage. Every access is guarded:
// storage can throw (private mode, blocked site data) and the app must still work.
const KEY = "s2s.apiKey";
const MODEL = "s2s.modelId";

function get(k: string): string {
  try {
    return localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
}

function set(k: string, v: string) {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* storage unavailable: value lives in memory for this tab only */
  }
}

export const loadApiKey = () => get(KEY);
export const saveApiKey = (v: string) => set(KEY, v.trim());
/** Empty string = "use the engine default". */
export const loadModelOverride = () => get(MODEL);
export const saveModelOverride = (v: string) => set(MODEL, v.trim());
