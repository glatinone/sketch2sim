import { ArrowRight, Wrench } from "lucide-react";
import type { CompileResult, Wire } from "../contract/types.ts";

const WIRE_HEX: Record<string, string> = {
  red: "#ef4444",
  black: "#0a0a0a",
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#facc15",
  orange: "#f97316",
  purple: "#a855f7",
  white: "#f8fafc",
  gray: "#9ca3af",
  grey: "#9ca3af",
  brown: "#92400e",
  cyan: "#22d3ee",
  magenta: "#d946ef",
};

const SIGNAL_STYLE: Record<Wire["signal"], string> = {
  POWER: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  GND: "bg-slate-500/20 text-slate-300 border-slate-500/50",
  DIGITAL: "bg-sky-500/15 text-sky-300 border-sky-500/40",
  ANALOG: "bg-violet-500/15 text-violet-300 border-violet-500/40",
  PWM: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  I2C: "bg-teal-500/15 text-teal-300 border-teal-500/40",
};

function Endpoint({ at, labels }: { at: string; labels: Map<string, string> }) {
  const [part, pin] = at.split(":");
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap font-mono">
      <span className="text-slate-400" title={labels.get(part)}>
        {part}
      </span>
      <span className="text-slate-600">:</span>
      <span className="font-bold text-white">{pin ?? "?"}</span>
    </span>
  );
}

export default function ResultCircuit({ result }: { result: CompileResult }) {
  const labels = new Map(result.parts.map((p) => [p.id, p.label]));
  return (
    <div className="space-y-5">
      <section>
        <p className="text-base leading-relaxed text-slate-200 lg:text-lg">{result.summary}</p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">Parts ({result.parts.length})</h3>
        <div className="flex flex-wrap gap-2">
          {result.parts.map((p) => (
            <span key={p.id} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5" title={p.type}>
              <span className="font-semibold text-white">{p.label}</span>
              <span className="ml-2 font-mono text-xs text-slate-500">{p.id}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-300">
          <Wrench className="size-4" /> Auto-fixed by validator ({result.fixes.length})
        </h3>
        {result.fixes.length ? (
          <div className="flex flex-wrap gap-2">
            {result.fixes.map((f, i) => (
              <div key={i} className="rounded-lg border border-amber-500/30 bg-slate-950/60 px-3 py-1.5 text-sm">
                <div className="font-semibold text-amber-100">{f.what}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <span className="text-rose-300 line-through decoration-rose-400/60">{f.before}</span>
                  <ArrowRight className="size-3 text-slate-500" />
                  <span className="text-emerald-300">{f.after}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-300">Gemma's output passed every check — nothing to repair.</p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">Wiring ({result.wires.length})</h3>
        {/* phones: one card per wire (a 5-column table doesn't fit) */}
        <ul className="space-y-2 md:hidden">
          {result.wires.map((w, i) => (
            <li key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Endpoint at={w.from} labels={labels} />
                <span
                  className="block h-1.5 w-6 shrink-0 rounded-full ring-1 ring-slate-600"
                  style={{ background: WIRE_HEX[w.color.toLowerCase()] ?? w.color }}
                  title={`${w.color} wire`}
                />
                <Endpoint at={w.to} labels={labels} />
                <span className={`ml-auto rounded border px-1.5 py-0.5 text-xs font-bold ${SIGNAL_STYLE[w.signal] ?? SIGNAL_STYLE.DIGITAL}`}>
                  {w.signal}
                </span>
              </div>
              {w.rationale && <p className="mt-1.5 text-sm text-slate-400">{w.rationale}</p>}
            </li>
          ))}
        </ul>
        <div className="hidden overflow-hidden rounded-xl border border-slate-800 md:block">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">From</th>
                <th className="px-1 py-2" />
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Signal</th>
                <th className="w-1/2 px-3 py-2">Why this pin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {result.wires.map((w, i) => (
                <tr key={i} className="align-top hover:bg-slate-900/60">
                  <td className="px-3 py-2">
                    <Endpoint at={w.from} labels={labels} />
                  </td>
                  <td className="px-1 py-2.5">
                    <span
                      className="block h-1.5 w-8 rounded-full ring-1 ring-slate-600"
                      style={{ background: WIRE_HEX[w.color.toLowerCase()] ?? w.color }}
                      title={`${w.color} wire`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Endpoint at={w.to} labels={labels} />
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded border px-1.5 py-0.5 text-xs font-bold ${SIGNAL_STYLE[w.signal] ?? SIGNAL_STYLE.DIGITAL}`}>
                      {w.signal}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-300">{w.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
