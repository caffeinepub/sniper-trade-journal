import type { ExternalBlob } from "../backend.d";

// WeakMap cache so we don't re-read bytes on every render
const urlCache = new WeakMap<ExternalBlob, string>();

export async function resolveScreenshotUrl(
  blob: ExternalBlob,
): Promise<string | null> {
  if (!blob) return null;

  // Check cache first
  if (urlCache.has(blob)) {
    return urlCache.get(blob)!;
  }

  try {
    // Try getDirectURL first
    const directUrl = blob.getDirectURL();
    if (directUrl?.startsWith("http")) {
      urlCache.set(blob, directUrl);
      return directUrl;
    }
  } catch {
    // fall through to bytes fallback
  }

  try {
    // Fallback: read bytes and create object URL
    const bytes = await blob.getBytes();
    const objectUrl = URL.createObjectURL(new Blob([bytes]));
    urlCache.set(blob, objectUrl);
    return objectUrl;
  } catch {
    return null;
  }
}
