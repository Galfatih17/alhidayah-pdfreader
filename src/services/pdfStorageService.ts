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
  getPdf(filePath: string): Promise<string>;
  /** Persist the PDF for offline use. No-op in Stage 1. */
  downloadPdf(filePath: string): Promise<void>;
  /** Remove an offline copy. No-op in Stage 1. */
  deleteOfflinePdf(filePath: string): Promise<void>;
  /** Whether the PDF is readable without a network connection. */
  isAvailableOffline(filePath: string): Promise<boolean>;
  /** Resolve a thumbnail URL, if any. */
  getThumbnail(thumbnailPath?: string | null): Promise<string | null>;
}

class RemotePdfStorageService implements PdfStorageService {
  async getPdf(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(PDF_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? "PDF tidak ditemukan di penyimpanan.");
    }
    return data.signedUrl;
  }

  async downloadPdf(): Promise<void> {
    // Stage 2: store the blob in IndexedDB.
  }

  async deleteOfflinePdf(): Promise<void> {
    // Stage 2: remove the blob from IndexedDB.
  }

  async isAvailableOffline(): Promise<boolean> {
    return false;
  }

  async getThumbnail(thumbnailPath?: string | null): Promise<string | null> {
    if (!thumbnailPath) return null;
    const { data } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .createSignedUrl(thumbnailPath, SIGNED_URL_TTL_SECONDS);
    return data?.signedUrl ?? null;
  }
}

export const pdfStorageService: PdfStorageService = new RemotePdfStorageService();
