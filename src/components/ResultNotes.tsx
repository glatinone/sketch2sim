import { useState } from "react";
import { Check } from "lucide-react";

export default function ResultNotes({ notes }: { notes: string[] }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  if (!notes.length) return <p className="text-slate-400">No electrical notes for this circuit.</p>;
  return (
    <ul className="space-y-2">
      {notes.map((n, i) => {
        const on = done.has(i);
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() =>
                setDone((s) => {
                  const next = new Set(s);
                  if (on) next.delete(i);
                  else next.add(i);
                  return next;
                })
              }
              className="flex w-full items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-left hover:border-slate-600"
            >
              <span
                className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded border-2 ${
                  on ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-slate-600"
                }`}
              >
                {on && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className={`text-base lg:text-lg ${on ? "text-slate-500 line-through" : "text-slate-200"}`}>{n}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
