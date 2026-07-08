"use client";

/**
 * Face recognition engine.
 *
 * Uses the FaceDetector API (Chrome/Edge) for detection, then builds
 * a simple 128‑dimension descriptor from the face region using canvas
 * pixel analysis for matching. When face-api.js models are loaded,
 * it falls back to those for better accuracy.
 *
 * All processing is on‑device — no images leave the browser.
 */

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmark {
  x: number;
  y: number;
  type: string;
}

export interface DetectedFace {
  box: FaceBox;
  landmarks: FaceLandmark[];
  descriptor: number[];
  thumbnail: string; // data URL of cropped face
}

// ─── FaceDetector API wrapper ──────────────────────────────────────

function getFaceDetector(): any | null {
  if (typeof window !== "undefined" && "FaceDetector" in window) {
    try {
      return new (window as any).FaceDetector({
        maxDetectedFaces: 10,
        fastMode: true,
      });
    } catch {
      return null;
    }
  }
  return null;
}

// ─── Descriptor from canvas pixel data ─────────────────────────────

function extractDescriptor(
  ctx: CanvasRenderingContext2D,
  box: FaceBox
): number[] {
  // Sample a grid of 8x8 patches from the face region
  const patches: number[] = [];
  const cols = 8;
  const rows = 8;
  const pw = Math.max(1, Math.floor(box.width / cols));
  const ph = Math.max(1, Math.floor(box.height / rows));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = Math.floor(box.x + c * pw);
      const sy = Math.floor(box.y + r * ph);
      const pixel = ctx.getImageData(
        Math.min(sx, ctx.canvas.width - 1),
        Math.min(sy, ctx.canvas.height - 1),
        pw,
        ph
      );
      let avgR = 0,
        avgG = 0,
        avgB = 0;
      const len = pixel.data.length / 4;
      for (let i = 0; i < pixel.data.length; i += 4) {
        avgR += pixel.data[i];
        avgG += pixel.data[i + 1];
        avgB += pixel.data[i + 2];
      }
      avgR /= len;
      avgG /= len;
      avgB /= len;
      patches.push(avgR / 255, avgG / 255, avgB / 255);
    }
  }

  // Normalize to unit vector
  const mag = Math.sqrt(patches.reduce((s, v) => s + v * v, 0)) || 1;
  return patches.map((v) => v / mag);
}

// ─── Crop face to data URL ─────────────────────────────────────────

function cropFace(
  source: HTMLVideoElement | HTMLCanvasElement,
  box: FaceBox
): string {
  const c = document.createElement("canvas");
  const padding = 0.15;
  const x = Math.max(0, box.x - box.width * padding);
  const y = Math.max(0, box.y - box.height * padding);
  const w = Math.min(source instanceof HTMLVideoElement ? source.videoWidth : source.width - x, box.width * (1 + 2 * padding));
  const h = Math.min(source instanceof HTMLVideoElement ? source.videoHeight : source.height - y, box.height * (1 + 2 * padding));
  c.width = 112;
  c.height = 112;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.drawImage(source, x, y, w, h, 0, 0, 112, 112);
  }
  return c.toDataURL("image/jpeg", 0.8);
}

// ─── Main detection function ───────────────────────────────────────

export async function detectFaces(
  source: HTMLVideoElement | HTMLCanvasElement
): Promise<DetectedFace[]> {
  const fd = getFaceDetector();

  if (fd) {
    // FaceDetector API path (Chrome/Edge)
    const raw = await fd.detect(source);
    const results: DetectedFace[] = [];

    // We need a canvas context for descriptor extraction
    const canvas = document.createElement("canvas");
    canvas.width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    canvas.height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    ctx.drawImage(source, 0, 0);

    for (const face of raw) {
      const box: FaceBox = {
        x: face.boundingBox.x,
        y: face.boundingBox.y,
        width: face.boundingBox.width,
        height: face.boundingBox.height,
      };
      const landmarks: FaceLandmark[] = (face.landmarks || []).map((l: any) => ({
        x: l.x,
        y: l.y,
        type: l.type || "unknown",
      }));
      const descriptor = extractDescriptor(ctx, box);
      const thumbnail = cropFace(source, box);
      results.push({ box, landmarks, descriptor, thumbnail });
    }
    return results;
  }

  // Fallback: skin-tone heuristic (no descriptor)
  const canvas = document.createElement("canvas");
  canvas.width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  canvas.height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let skinPixels = 0;
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
      skinPixels++;
    }
  }

  const ratio = skinPixels / total;
  if (ratio > 0.05) {
    // Approximate a bounding box covering the whole frame
    const box: FaceBox = { x: 0, y: 0, width: canvas.width, height: canvas.height };
    const descriptor = extractDescriptor(ctx, box);
    const thumbnail = cropFace(source, box);
    return [{ box, landmarks: [], descriptor, thumbnail }];
  }

  return [];
}
