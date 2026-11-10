import type { PDFDocumentProxy } from "pdfjs-dist";
import { META_STORE, RENDER_STORE, idbDelete, idbGet, idbKeys, idbPut } from "./offlineDb";

/** Max rendered page images kept per document (LRU). */
const LIMIT_PER_DOC = 80;
const cacheKey = (docId: string, page: number, width: number) => `${docId}-${page}-${width}`;

let lruChain: Promise<void> = Promise.resolve();
function touch(docId: string, key: string) {
  lruChain = lruChain
    .then(async () => {
      const lruKey = `render-lru:${docId}`;
      const list = ((await idbGet<string[]>(META_STORE, lruKey)) ?? []).filter((k) => k !== key);
      list.push(key);
      while (list.length > LIMIT_PER_DOC) {
        const old = list.shift();
        if (old) await idbDelete(RENDER_STORE, old);
      }
      await idbPut(META_STORE, lruKey, list);
    })
    .catch(() => undefined);
  return lruChain;
}

export async function getCachedPage(docId: string, page: number, width: number) {
  try {
    const key = cacheKey(docId, page, width);
    const blob = await idbGet<Blob>(RENDER_STORE, key);
    if (blob) void touch(docId, key);
    return blob;
  } catch {
    return undefined;
  }
}

export async function putCachedPage(docId: string, page: number, width: number, blob: Blob) {
  try {
    const key = cacheKey(docId, page, width);
    await idbPut(RENDER_STORE, key, blob);
    await touch(docId, key);
  } catch {
    /* storage full or unavailable */
  }
}

export async function clearCachedPages(docId: string) {
  try {
    const prefix = `${docId}-`;
    const keys = await idbKeys(RENDER_STORE);
    await Promise.all(
      keys
        .filter((key): key is string => typeof key === "string" && key.startsWith(prefix))
        .map((key) => idbDelete(RENDER_STORE, key)),
    );
    await idbDelete(META_STORE, `render-lru:${docId}`);
  } catch {
    /* cache cleanup is best-effort */
  }
}

export async function renderPageToBlob(pdf: PDFDocumentProxy, pageNumber: number, width: number) {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: (width / base.width) * dpr });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  page.cleanup();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Render gagal"))), "image/webp", 0.85),
  );
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}
