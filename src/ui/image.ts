import type { CompileInput } from "../contract/types.ts";

export interface InputImage {
  imageBase64: string;
  mimeType: CompileInput["mimeType"];
  previewUrl: string; // data URL for <img>
  presetId?: string; // set when the image is one of the bundled presets
}

export function splitDataUrl(dataUrl: string): Pick<InputImage, "imageBase64" | "mimeType"> {
  const comma = dataUrl.indexOf(",");
  const head = dataUrl.slice(0, comma);
  if (comma < 0 || !head.startsWith("data:image/")) throw new Error("Not an image data URL");
  return { mimeType: head.includes("image/png") ? "image/png" : "image/jpeg", imageBase64: dataUrl.slice(comma + 1) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = src;
  });
}

/** Draw any image source onto a canvas no larger than maxSide, re-encode as JPEG/PNG. */
export function sourceToImage(
  src: CanvasImageSource,
  w: number,
  h: number,
  maxSide = 1280,
  mime: CompileInput["mimeType"] = "image/jpeg",
): InputImage {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNGs would otherwise turn black in JPEG
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0, c.width, c.height);
  const previewUrl = mime === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.9);
  return { ...splitDataUrl(previewUrl), previewUrl };
}

export async function fileToImage(file: File): Promise<InputImage> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (PNG or JPEG)");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    return sourceToImage(img, img.naturalWidth, img.naturalHeight, 1280, mime);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function urlToImage(url: string, presetId?: string): Promise<InputImage> {
  const img = await loadImage(url);
  return { ...sourceToImage(img, img.naturalWidth, img.naturalHeight, 1280, "image/png"), presetId };
}
