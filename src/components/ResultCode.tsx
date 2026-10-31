import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { copyText, downloadText } from "../ui/clipboard.ts";

export function CopyButton({ text, label, big }: { text: string; label: string; big?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      className={`flex items-center gap-1.5 rounded-md font-semibold transition ${big ? "h-10 px-3 text-base" : "h-9 px-3 text-sm"} ${
        done ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
      }`}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      {done ? "Copied!" : label}
    </button>
  );
}

export default function ResultCode({ filename, code }: { filename: string; code: string }) {
  const lines = code.split("\n");
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-base font-semibold text-slate-300">{filename}</span>
        <span className="text-sm text-slate-500">{lines.length} lines</span>
        <span className="ml-auto flex gap-2">
          <CopyButton text={code} label={`Copy ${filename}`} />
          <button
            type="button"
            onClick={() => downloadText(filename, code)}
            className="flex h-9 items-center gap-1.5 rounded-md bg-slate-800 px-3 text-sm font-semibold text-slate-100 hover:bg-slate-700"
          >
            <Download className="size-4" /> Download
          </button>
        </span>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-950 py-3 font-mono text-[0.95rem] leading-relaxed">
        <code className="grid grid-cols-[auto_1fr]">
          {lines.map((l, i) => (
            <span key={i} className="contents">
              <span className="select-none pl-3 pr-4 text-right text-slate-600">{i + 1}</span>
              <span className="whitespace-pre pr-4 text-slate-200">{l || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
