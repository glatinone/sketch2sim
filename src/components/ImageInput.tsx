import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Camera, ImagePlus, Images, PenLine, RefreshCw, Upload } from "lucide-react";
import { useCoarsePointer, useIsMobile } from "../ui/media.ts";
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

// Phones lead with the camera (point at the paper, snap, compile); desktops lead with drawing.
const MOBILE_ORDER: InputTab[] = ["camera", "upload", "draw", "presets"];

export default function ImageInput({ ref }: { ref?: Ref<ImageInputHandle> }) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<InputTab>(() => (window.matchMedia("(max-width: 1023px)").matches ? "camera" : "draw"));
  const tabs = isMobile ? MOBILE_ORDER.map((id) => TABS.find((t) => t.id === id)!) : TABS;
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
      <nav className="flex shrink-0 gap-1 rounded-lg bg-slate-900 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-semibold transition sm:gap-2 lg:py-2 lg:text-base ${
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
          <span className="px-4 text-center text-lg font-semibold">
            <span className="lg:hidden">Choose a photo of your paper sketch</span>
            <span className="hidden lg:inline">Drop a photo of your paper sketch</span>
          </span>
          <span className="px-4 text-center text-sm">
            <span className="lg:hidden">From your gallery · PNG / JPEG</span>
            <span className="hidden lg:inline">or click to choose · PNG / JPEG · auto-resized to 1280px</span>
          </span>
        </button>
      )}
      {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
    </div>
  );
}

function CameraPane(props: { image: InputImage | null; onImage(i: InputImage | null): void }) {
  return useCoarsePointer() ? <NativeCameraPane {...props} /> : <LiveCameraPane {...props} />;
}

// Phones: hand off to the native camera app (sharper photo, autofocus, no getUserMedia permission quirks).
function NativeCameraPane({ image, onImage }: { image: InputImage | null; onImage(i: InputImage | null): void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const take = async (file?: File) => {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      onImage(await fileToImage(file));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void take(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => void take(e.target.files?.[0])} />
    </>
  );

  if (image)
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        {inputs}
        <div className="min-h-0 flex-1">
          <Preview image={image} />
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-800 font-semibold text-slate-100 active:bg-slate-700"
          >
            <RefreshCw className="size-4" /> Retake
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-800 font-semibold text-slate-100 active:bg-slate-700"
          >
            <ImagePlus className="size-4" /> Gallery
          </button>
        </div>
        <p className="shrink-0 text-center text-sm text-emerald-300">Photo ready. Tap Compile below.</p>
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {inputs}
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        disabled={busy}
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-cyan-500/50 bg-cyan-400/5 px-6 text-cyan-100 active:bg-cyan-400/10"
      >
        <span className="grid size-20 place-items-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30">
          <Camera className="size-9" />
        </span>
        <span className="text-xl font-bold">{busy ? "Loading photo…" : "Take a photo of your sketch"}</span>
        <span className="text-center text-sm text-slate-400">Paper flat, good light, the whole drawing in frame.</span>
      </button>
      <button
        type="button"
        onClick={() => galleryRef.current?.click()}
        className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-800 font-semibold text-slate-100 active:bg-slate-700"
      >
        <ImagePlus className="size-4" /> Pick from gallery
      </button>
      {err && <p className="shrink-0 text-sm text-rose-400">{err}</p>}
    </div>
  );
}

function LiveCameraPane({ image, onImage }: { image: InputImage | null; onImage(i: InputImage | null): void }) {
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
              <div className="px-1.5 py-1 lg:px-2 lg:py-1.5">
                <div className="truncate text-xs font-bold text-white sm:text-sm">{info.title}</div>
                <div className="hidden truncate text-xs text-slate-400 sm:block">{info.blurb}</div>
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
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-700 px-4 text-center text-sm text-slate-500 lg:text-base">
            Pick a preset — Compile runs it live; offline it falls back to a labeled cached result.
          </div>
        )}
      </div>
    </div>
  );
}
