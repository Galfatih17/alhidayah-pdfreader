import { META_STORE, PDF_STORE, idbDelete, idbGet, idbKeys, idbPut } from "@/lib/offlineDb";
import { supabase } from "@/integrations/supabase/client";

export const PDF_BUCKET = "pdf-files";
export const THUMBNAIL_BUCKET = "pdf-thumbnails";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Storage abstraction for PDF binaries.
 *
 * Stage 1 implementation resolves everything from remote storage.
 * Stage 2 can swap the implementation for an IndexedDB-backed one without
 * touching any reader component — they only ever use this interface.
 */
export interface PdfStorageService {
  /** Resolve a URL the PDF viewer can load (remote now, local blob later). */
  getPdf(filePath: string, onProgress?: (percent: number | null) => void): Promise<string>;
  /** Persist the PDF for offline use. No-op in Stage 1. */
  downloadPdf(filePath: string, onProgress?: (percent: number | null) => void): Promise<void>;
  /** Remove an offline copy. No-op in Stage 1. */
  deleteOfflinePdf(filePath: string): Promise<void>;
  /** Whether the PDF is readable without a network connection. */
  isAvailableOffline(filePath: string): Promise<boolean>;
  /** Resolve a thumbnail URL, if any. */
  getThumbnail(thumbnailPath?: string | null): Promise<string | null>;
}

const objectUrls = new Map<string, string>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

export function subscribeOffline(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const notify = () => listeners.forEach((l) => l());

class OfflinePdfStorageService implements PdfStorageService {
  private async signedUrl(filePath: string) {
    const { data, error } = await supabase.storage
      .from(PDF_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? "PDF tidak ditemukan di penyimpanan.");
    }
    return data.signedUrl;
  }

  /** Only return a local URL after the full file has been stored. */
  async getPdf(filePath: string, onProgress?: (percent: number | null) => void): Promise<string> {
    const cached = objectUrls.get(filePath);
    if (cached) return cached;
    try {
      const blob = await idbGet<Blob>(PDF_STORE, filePath);
      if (blob) {
        const url = URL.createObjectURL(blob);
        objectUrls.set(filePath, url);
        return url;
      }
    } catch {
      /* IndexedDB unavailable */
    }
    await this.downloadPdf(filePath, onProgress);
    const blob = await idbGet<Blob>(PDF_STORE, filePath);
    if (!blob) throw new Error("PDF tidak tersimpan di perangkat.");
    const url = URL.createObjectURL(blob);
    objectUrls.set(filePath, url);
    return url;
  }

  downloadPdf(filePath: string, onProgress?: (percent: number | null) => void): Promise<void> {
    const existing = inflight.get(filePath);
    if (existing) return existing;
    const job = (async () => {
      if (await idbGet<Blob>(PDF_STORE, filePath)) return;
      const url = await this.signedUrl(filePath);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Gagal mengunduh PDF.");
      const total = Number(res.headers.get("content-length")) || 0;
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Unduhan tidak dapat dibaca.");
      const chunks: ArrayBuffer[] = [];
      let received = 0;
      onProgress?.(total ? 0 : null);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Uint8Array.from(value).buffer);
        received += value.byteLength;
        onProgress?.(total ? Math.min(100, Math.round(received / total * 100)) : null);
      }
      const blob = new Blob(chunks, { type: "application/pdf" });
      await idbPut(PDF_STORE, filePath, blob);
      onProgress?.(100);
      notify();
    })().finally(() => inflight.delete(filePath));
    inflight.set(filePath, job);
    return job;
  }

  async deleteOfflinePdf(filePath: string): Promise<void> {
    await idbDelete(PDF_STORE, filePath);
    const url = objectUrls.get(filePath);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(filePath);
    notify();
  }

  async isAvailableOffline(filePath: string): Promise<boolean> {
    try {
      const keys = await idbKeys(PDF_STORE);
      return keys.includes(filePath);
    } catch {
      return false;
    }
  }

  async getThumbnail(thumbnailPath?: string | null): Promise<string | null> {
    if (!thumbnailPath) return null;
    const { data } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .createSignedUrl(thumbnailPath, SIGNED_URL_TTL_SECONDS);
    return data?.signedUrl ?? null;
  }
}

export const pdfStorageService: PdfStorageService = new OfflinePdfStorageService();

/** Cache document metadata so the library and reader open without internet. */
export async function cacheMeta<T>(key: string, value: T) {
  try {
    await idbPut(META_STORE, key, value);
  } catch {
    /* ignore */
  }
}
export async function readMeta<T>(key: string): Promise<T | undefined> {
  try {
    return await idbGet<T>(META_STORE, key);
  } catch {
    return undefined;
  }
}
