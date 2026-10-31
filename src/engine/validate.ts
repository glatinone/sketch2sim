import { CompileError } from "../contract/types.ts";
import type { Fix, Part, Wire } from "../contract/types.ts";
import {
  UNO, UNO_ID, UNO_DIGITAL, UNO_PWM, UNO_ANALOG, UNO_GND,
  findPart, matchPart, normalizePin,
} from "./catalog.ts";

// Shape we ask Gemma for. Everything is optional because the model can't be trusted.
export interface RawCircuit {
  projectTitle?: string;
  summary?: string;
  parts?: Array<{ id?: string; type?: string; label?: string; attrs?: Record<string, unknown> }>;
  wires?: Array<{ from?: string; to?: string; color?: string; signal?: string; rationale?: string }>;
  sketchIno?: string;
  notes?: unknown[];
}

export interface ValidCircuit {
  projectTitle: string;
  summary: string;
  parts: Part[];
  wires: Wire[];
  sketchIno: string;
  notes: string[];
  fixes: Fix[];
}

const WIRE_COLORS = ["black", "brown", "red", "orange", "gold", "green", "blue", "violet", "gray", "white", "cyan", "limegreen", "magenta", "purple", "yellow"]; // Wokwi editor palette
const SIGNALS: Wire["signal"][] = ["POWER", "GND", "DIGITAL", "ANALOG", "PWM", "I2C"];

function colorFor(signal: Wire["signal"]): string {
  return { POWER: "red", GND: "black", DIGITAL: "green", ANALOG: "orange", PWM: "blue", I2C: "purple" }[signal];
}

function splitEnd(end: string | undefined): [string, string] | undefined {
  if (!end) return undefined;
  const i = end.indexOf(":");
  if (i <= 0) return undefined;
  return [end.slice(0, i).trim(), end.slice(i + 1).trim()];
}

export function validateCircuit(raw: RawCircuit, rawText: string): ValidCircuit {
  const fixes: Fix[] = [];
  const fix = (what: string, before: string, after: string) => fixes.push({ what, before, after });

  // ---- 1. parts: map every type onto the catalog, force a single MCU with id "uno"
  const idMap = new Map<string, string>(); // model id -> final id
  const parts: Part[] = [];
  const usedIds = new Set<string>();
  for (const rp of raw.parts ?? []) {
    const rawType = String(rp.type ?? "");
    const rawId = String(rp.id ?? "").trim() || rawType || "part";
    const cat = matchPart(rawType, String(rp.label ?? ""));
    if (!cat) {
      fix("Dropped unsupported part", `${rawId} (${rawType})`, "removed");
      continue;
    }
    if (cat.type !== rawType) fix("Mapped part to a real Wokwi type", rawType, cat.type);

    if (cat === UNO) {
      if (parts.some((p) => p.id === UNO_ID)) {
        fix("Removed duplicate microcontroller", rawId, `merged into ${UNO_ID}`);
        idMap.set(rawId, UNO_ID);
        continue;
      }
      if (rawId !== UNO_ID) fix("Renamed microcontroller id", rawId, UNO_ID);
      idMap.set(rawId, UNO_ID);
      usedIds.add(UNO_ID);
      parts.push({ id: UNO_ID, type: UNO.type, label: UNO.label });
      continue;
    }

    let id = rawId.replace(/[^A-Za-z0-9_]/g, "_");
    if (usedIds.has(id)) {
      let n = 2;
      while (usedIds.has(`${id}${n}`)) n++;
      fix("Renamed duplicate part id", id, `${id}${n}`);
      id = `${id}${n}`;
    }
    usedIds.add(id);
    idMap.set(rawId, id);
    const attrs: Record<string, string> = { ...(cat.defaultAttrs ?? {}) };
    for (const [k, v] of Object.entries(rp.attrs ?? {})) attrs[k] = String(v);
    parts.push({ id, type: cat.type, label: String(rp.label ?? cat.label), ...(Object.keys(attrs).length ? { attrs } : {}) });
  }

  if (!parts.some((p) => p.id === UNO_ID)) {
    fix("Added missing microcontroller", "none", "Arduino Uno");
    parts.unshift({ id: UNO_ID, type: UNO.type, label: UNO.label });
    usedIds.add(UNO_ID);
  }
  const catOf = (id: string) => findPart(parts.find((p) => p.id === id)?.type ?? "");

  // ---- 2. wires: resolve ids + pins, drop what can't be resolved
  let wires: Wire[] = [];
  for (const rw of raw.wires ?? []) {
    const a = splitEnd(rw.from);
    const b = splitEnd(rw.to);
    if (!a || !b) {
      fix("Dropped malformed wire", `${rw.from} → ${rw.to}`, "removed");
      continue;
    }
    const ends: string[] = [];
    for (const [rawId, rawPin] of [a, b]) {
      const id = idMap.get(rawId) ?? (usedIds.has(rawId) ? rawId : undefined);
      const cat = id ? catOf(id) : undefined;
      const pin = cat ? normalizePin(cat, rawPin) : undefined;
      if (!id || !cat || !pin) break;
      if (pin !== rawPin || id !== rawId) fix("Corrected pin name", `${rawId}:${rawPin}`, `${id}:${pin}`);
      ends.push(`${id}:${pin}`);
    }
    if (ends.length !== 2) {
      fix("Dropped wire to unknown part/pin", `${rw.from} → ${rw.to}`, "removed");
      continue;
    }
    if (ends[0] === ends[1]) continue;
    let signal = (SIGNALS.includes(rw.signal as Wire["signal"]) ? rw.signal : undefined) as Wire["signal"] | undefined;
    const unoEnd = ends.find((e) => e.startsWith(`${UNO_ID}:`))?.split(":")[1];
    if (!signal) {
      if (unoEnd && UNO_GND.includes(unoEnd)) signal = "GND";
      else if (unoEnd && ["5V", "3.3V", "VIN"].includes(unoEnd)) signal = "POWER";
      else if (unoEnd && UNO_ANALOG.includes(unoEnd)) signal = "ANALOG";
      else signal = "DIGITAL";
    }
    const color = WIRE_COLORS.includes(String(rw.color)) ? String(rw.color) : colorFor(signal);
    wires.push({ from: ends[0], to: ends[1], color, signal, rationale: String(rw.rationale ?? "") });
  }

  // helpers over the current wire list
  const touching = (end: string) => wires.filter((w) => w.from === end || w.to === end);
  const other = (w: Wire, end: string) => (w.from === end ? w.to : w.from);
  const unoPinsInUse = () =>
    new Set(wires.flatMap((w) => [w.from, w.to]).filter((e) => e.startsWith(`${UNO_ID}:`)).map((e) => e.split(":")[1]));
  let sketch = String(raw.sketchIno ?? "");
  const patchSketchPin = (oldPin: string, newPin: string) => {
    // only touch lines that look like pin declarations / attach calls
    const re = new RegExp(`^(.*(?:#define|const\\s+(?:int|byte|uint8_t)|int\\s+\\w*[Pp]in|attach\\s*\\().*?)\\b${oldPin}\\b`, "gm");
    sketch = sketch.replace(re, `$1${newPin}`);
  };

  // ---- 3. servo signal must be on a PWM pin
  for (const p of parts.filter((x) => x.type === "wokwi-servo")) {
    for (const w of touching(`${p.id}:PWM`)) {
      const end = other(w, `${p.id}:PWM`);
      const pin = end.startsWith(`${UNO_ID}:`) ? end.split(":")[1] : undefined;
      if (pin && !UNO_PWM.includes(pin)) {
        const free = UNO_PWM.find((x) => !unoPinsInUse().has(x));
        if (!free) continue;
        if (w.from === end) w.from = `${UNO_ID}:${free}`; else w.to = `${UNO_ID}:${free}`;
        w.signal = "PWM";
        patchSketchPin(pin, free);
        fix("Moved servo to a PWM pin", `${UNO_ID}:${pin}`, `${UNO_ID}:${free}`);
      }
    }
  }

  // ---- 4. every LED driven straight from a Uno pin gets a 220Ω series resistor
  let rCount = 1;
  for (const p of parts.filter((x) => x.type === "wokwi-led")) {
    const anode = `${p.id}:A`;
    for (const w of touching(anode)) {
      const end = other(w, anode);
      if (!end.startsWith(`${UNO_ID}:`)) continue;
      while (usedIds.has(`r${rCount}`)) rCount++;
      const rid = `r${rCount}`;
      usedIds.add(rid);
      parts.push({ id: rid, type: "wokwi-resistor", label: "Resistor 220Ω", attrs: { value: "220" } });
      wires = wires.filter((x) => x !== w);
      wires.push(
        { from: end, to: `${rid}:1`, color: w.color, signal: w.signal, rationale: w.rationale },
        { from: `${rid}:2`, to: anode, color: w.color, signal: w.signal, rationale: "220Ω limits LED current to ~15 mA" },
      );
      fix("Inserted 220Ω current-limiting resistor", `${end} → ${anode}`, `${end} → ${rid} → ${anode}`);
    }
  }

  // ---- 5. power pins the model forgot (GND / 5V)
  let gndIdx = 0;
  for (const p of parts) {
    const cat = catOf(p.id);
    for (const [pin, rail] of Object.entries(cat?.requiredPower ?? {})) {
      const end = `${p.id}:${pin}`;
      // a pushbutton is fine if either side-2 pin is wired
      if (p.type === "wokwi-pushbutton" && (touching(`${p.id}:2.l`).length || touching(`${p.id}:2.r`).length)) continue;
      if (touching(end).length) continue;
      const target = rail === "GND" ? `${UNO_ID}:${UNO_GND[gndIdx++ % UNO_GND.length]}` : `${UNO_ID}:5V`;
      wires.push({
        from: end, to: target, color: rail === "GND" ? "black" : "red",
        signal: rail === "GND" ? "GND" : "POWER", rationale: `${rail} rail (added by validator)`,
      });
      fix(`Wired missing ${rail}`, `${end} unconnected`, `${end} → ${target}`);
    }
  }

  // ---- 6. never use serial pins 0/1
  for (const w of wires) {
    for (const key of ["from", "to"] as const) {
      const pin = w[key].startsWith(`${UNO_ID}:`) ? w[key].split(":")[1] : undefined;
      if (pin === "0" || pin === "1") {
        const free = UNO_DIGITAL.find((x) => !unoPinsInUse().has(x));
        if (!free) continue;
        w[key] = `${UNO_ID}:${free}`;
        patchSketchPin(pin, free);
        fix("Moved off serial pin", `${UNO_ID}:${pin}`, `${UNO_ID}:${free}`);
      }
    }
  }

  // drop parts with no wires at all (except the Uno)
  const wired = new Set(wires.flatMap((w) => [w.from.split(":")[0], w.to.split(":")[0]]));
  const finalParts = parts.filter((p) => {
    if (p.id === UNO_ID || wired.has(p.id)) return true;
    fix("Dropped unconnected part", p.id, "removed");
    return false;
  });

  if (!wires.some((w) => w.signal !== "GND" && w.signal !== "POWER")) {
    throw new CompileError("No usable signal wires after validation", "VALIDATION", rawText);
  }

  return {
    projectTitle: String(raw.projectTitle ?? "Untitled circuit"),
    summary: String(raw.summary ?? ""),
    parts: finalParts,
    wires,
    sketchIno: sketch,
    notes: (raw.notes ?? []).map(String),
    fixes,
  };
}
