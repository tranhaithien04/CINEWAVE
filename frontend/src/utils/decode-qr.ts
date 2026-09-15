import type jsQR from "jsqr";

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

type JsQrFn = typeof jsQR;

let jsQrFn: JsQrFn | null = null;

async function loadJsQr() {
  if (jsQrFn) return jsQrFn;
  const mod = await import("jsqr");
  const fn = (mod as { default?: JsQrFn }).default ?? (mod as unknown as JsQrFn);
  jsQrFn = fn;
  return fn;
}

export function getBarcodeDetector() {
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) return null;
  const Detector = (window as Window & { BarcodeDetector: new (opts: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector;
  try {
    return new Detector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

function decodeWithJsQr(fn: JsQrFn, image: ImageData) {
  const result = fn(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
  return result?.data?.trim() || null;
}

type Crop = { sx: number; sy: number; sw: number; sh: number; scale: number };

function cropsFor(width: number, height: number): Crop[] {
  const crops: Crop[] = [{ sx: 0, sy: 0, sw: width, sh: height, scale: 1 }];
  if (Math.min(width, height) < 480) {
    crops.push({ sx: 0, sy: 0, sw: width, sh: height, scale: 2 });
  }
  if (Math.max(width, height) > 700) {
    crops.push({ sx: 0, sy: 0, sw: width, sh: height, scale: 0.55 });
    crops.push({ sx: width * 0.45, sy: 0, sw: width * 0.55, sh: height, scale: 1 });
    crops.push({ sx: 0, sy: 0, sw: width * 0.55, sh: height, scale: 1 });
    crops.push({ sx: width * 0.2, sy: height * 0.2, sw: width * 0.6, sh: height * 0.6, scale: 1 });
  }
  return crops;
}

function imageDataFrom(source: CanvasImageSource, crop: Crop) {
  const canvas = document.createElement("canvas");
  const max = 1600;
  const next = Math.min(crop.scale, max / Math.max(crop.sw, crop.sh, 1));
  canvas.width = Math.max(1, Math.round(crop.sw * next));
  canvas.height = Math.max(1, Math.round(crop.sh * next));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = next < 1;
  ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function decodeFromSource(fn: JsQrFn, source: CanvasImageSource, width: number, height: number) {
  for (const crop of cropsFor(width, height)) {
    const image = imageDataFrom(source, crop);
    const raw = image ? decodeWithJsQr(fn, image) : null;
    if (raw) return raw;
  }
  return null;
}

async function loadImageFile(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
  } catch {
    // Avoid createObjectURL so Blob lifetime stays tied to the FileReader/data URL path.
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("image"));
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image"));
      el.src = dataUrl;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  }
}

export async function decodeQrFromFile(file: File) {
  const detector = getBarcodeDetector();
  if (detector) {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const codes = await detector.detect(bitmap);
        const raw = codes[0]?.rawValue?.trim();
        if (raw) return raw;
      } finally {
        bitmap.close();
      }
    } catch {
      /* fall through to jsQR */
    }
  }

  const [fn, loaded] = await Promise.all([loadJsQr(), loadImageFile(file)]);
  try {
    return decodeFromSource(fn, loaded.source, loaded.width, loaded.height);
  } finally {
    loaded.close?.();
  }
}

export function decodeQrFromVideo(video: HTMLVideoElement) {
  if (!jsQrFn || video.readyState < 2 || video.videoWidth < 8 || video.videoHeight < 8) return null;
  return decodeFromSource(jsQrFn, video, video.videoWidth, video.videoHeight);
}

export function preloadQrDecoder() {
  return loadJsQr();
}
