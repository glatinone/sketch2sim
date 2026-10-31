import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Camera, Images, PenLine, RefreshCw, Upload } from "lucide-react";
import SketchCanvas, { type SketchCanvasHandle } from "./SketchCanvas.tsx";
import { fileToImage, sourceToImage, urlToImage, type InputImage } from "../ui/image.ts";
import { PRESET_IDS } from "../compileClient.ts";

export type InputTab = "draw" | "upload" | "camera" | "presets";

export interface ImageInputHandle {
  /** The image that Compile should send, or null if the active tab has nothing yet. */
  getImage(): InputImage | null;
}

export const PRESET_INFO: Record<string, { title: string; blurb: string }> = {
  "blink-button": { title: "Button → LED", blurb: "Press the button, LED toggles" },
  "parking-sensor": { title: "Parking sensor", blurb: "Ultrasonic + buzzer: closer = faster beeps" },
  "servo-pot": { title: "Knob → servo", blurb: "Potentiometer sets the servo angle" },
};

const presetUrl = (id: string) => `${import.meta.env.BASE_URL}presets/${id}.png`;

const TABS: { id: InputTab; label: string; icon: typeof PenLine }[] = [
  { id: "draw", label: "Draw", icon: PenLine },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "camera", label: "Camera", icon: Camera },
  { id: "presets", label: "Presets", icon: Images },
];

export default function ImageInput({ ref }: { ref?: Ref<ImageInputHandle> }) {
  const [tab, setTab] = useState<InputTab>("draw");
  const canvasRef = useRef<SketchCanvasHandle>(null);
  const [upload, setUpload] = useState<InputImage | null>(null);
  const [snap, setSnap] = useState<InputImage | null>(null);
  const [preset, setPreset] = useState<InputImage | null>(null);

  useImperativeHandle(ref, () => ({
    getImage() {
      if (tab === "draw") return canvasRef.current?.exportImage() ?? null;
      if (tab === "upload") return upload;
      if (tab === "camera") return snap;
      return preset;
    },
  }), [tab, upload, snap, preset]);

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      <nav className="flex gap-1 rounded-lg bg-slate-900 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-base font-semibold transition ${
              tab === id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1">
        {/* Canvas stays mounted so switching tabs never loses a drawing */}
        <div className={tab === "draw" ? "h-full" : "hidden"}>
          <SketchCanvas ref={canvasRef} />
        </div>
        {tab === "upload" && <UploadPane image={upload} onImage={setUpload} />}
        {tab === "camera" && <CameraPane image={snap} onImage={setSnap} />}
        {tab === "presets" && <PresetsPane image={preset} onImage={setPreset} />}
      </div>
    </section>
  );
}

function Preview({ image, children }: { image: InputImage; children?: React.ReactNode }) {
  return (
    <div className="relative h-full min-h-0 rounded-xl border border-slate-700 bg-slate-900/60">
      <img src={image.previewUrl} alt="Sketch to compile" className="absolute inset-0 m-auto max-h-full max-w-full rounded-lg object-contain p-2" />
      {children}
    </div>
  );
}

function UploadPane({ image, onImage }: { image: InputImage | null; onImage(i: InputImage | null): void }) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const take = async (file?: File) => {
    if (!file) return;
    setErr("");
    try {
      onImage(await fileToImage(file));
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void take(e.dataTransfer.files[0]);
      }}
      className="h-full"
    >
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void take(e.target.files?.[0])} />
      {image ? (
        <Preview image={image}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-slate-950/80 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw className="size-4" /> Replace
          </button>
        </Preview>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-slate-400 transition ${
            drag ? "border-cyan-400 bg-cyan-400/5 text-cyan-200" : "border-slate-700 hover:border-slate-500"
          }`}
        >
          <Upload className="size-10" />
          <span className="text-lg font-semibold">Drop a photo of your paper sketch</span>
          <span className="text-sm">or click to choose · PNG / JPEG · auto-resized to 1280px</span>
        </button>
      )}
      {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
    </div>
  );
}

function CameraPane({ image, onImage }: { image: InputImage | null; onImage(i: InputImage | null): void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const live = !image;

  useEffect(() => {
    if (!live) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((e: Error) => setErr(`Camera unavailable: ${e.message}`));
    if (!navigator.mediaDevices) setErr("Camera needs https or localhost.");
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [live]);

  if (image)
    return (
      <Preview image={image}>
        <button
          type="button"
          onClick={() => onImage(null)}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-slate-950/80 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className="size-4" /> Retake
        </button>
      </Preview>
    );

  return (
    <div className="relative grid h-full min-h-0 place-items-center overflow-hidden rounded-xl border border-slate-700 bg-black">
      {err ? (
        <p className="px-6 text-center text-slate-400">{err}</p>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted className="max-h-full max-w-full" />
      )}
      {!err && (
        <button
          type="button"
          onClick={() => {
            const v = videoRef.current;
            if (v?.videoWidth) onImage(sourceToImage(v, v.videoWidth, v.videoHeight));
          }}
          className="absolute bottom-4 flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-lg font-bold text-slate-950 shadow-lg hover:bg-cyan-300"
        >
          <Camera className="size-5" /> Snap
        </button>
      )}
    </div>
  );
}

function PresetsPane({ image, onImage }: { image: InputImage | null; onImage(i: InputImage | null): void }) {
  const [err, setErr] = useState("");
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {PRESET_IDS.map((id) => {
          const info = PRESET_INFO[id] ?? { title: id, blurb: "" };
          const active = image?.presetId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setErr("");
                urlToImage(presetUrl(id), id).then(onImage, (e: Error) => setErr(e.message));
              }}
              className={`overflow-hidden rounded-lg border-2 text-left transition ${
                active ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-900 hover:border-slate-500"
              }`}
            >
              <img src={presetUrl(id)} alt={info.title} className="aspect-[3/2] w-full bg-white object-contain" />
              <div className="px-2 py-1.5">
                <div className="text-sm font-bold text-white">{info.title}</div>
                <div className="truncate text-xs text-slate-400">{info.blurb}</div>
              </div>
            </button>
          );
        })}
      </div>
      {err && <p className="text-sm text-rose-400">{err}</p>}
      <div className="min-h-0 flex-1">
        {image ? (
          <Preview image={image} />
        ) : (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-700 text-slate-500">
            Pick a preset — Compile runs it live; offline it falls back to a labeled cached result.
          </div>
        )}
      </div>
    </div>
  );
}
