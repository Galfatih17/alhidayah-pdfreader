import { supabase } from "@/integrations/supabase/client";
import { PDF_BUCKET, THUMBNAIL_BUCKET, cacheMeta, readMeta } from "./pdfStorageService";
import type { PdfDocument } from "./types";

export async function listDocuments(): Promise<PdfDocument[]> {
  const { data, error } = await supabase
    .from("pdf_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    const cached = await readMeta<PdfDocument[]>("documents");
    if (cached) return cached;
    throw new Error(error.message);
  }
  const docs = (data ?? []) as PdfDocument[];
  void cacheMeta("documents", docs);
  return docs;
}

export async function getDocument(id: string): Promise<PdfDocument> {
  const { data, error } = await supabase
    .from("pdf_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    const cached = await readMeta<PdfDocument>(`doc:${id}`);
    if (cached) return cached;
    const list = await readMeta<PdfDocument[]>("documents");
    const hit = list?.find((d) => d.id === id);
    if (hit) return hit;
    throw new Error(error.message);
  }
  if (!data) throw new Error("Dokumen tidak ditemukan.");
  void cacheMeta(`doc:${id}`, data);
  return data as PdfDocument;
}

export async function updateTotalPages(id: string, totalPages: number): Promise<void> {
  const { setDocumentTotalPages } = await import("@/lib/documents.functions");
  await setDocumentTotalPages({ data: { id, totalPages } });
}

export type UploadDocumentInput = {
  password: string;
  title: string;
  description?: string;
  file: File;
  thumbnail?: File | null;
  onProgress?: (percent: number) => void;
};

export const MAX_PDF_BYTES = 500 * 1024 * 1024;

function uploadWithProgress(path: string, token: string, file: File, onProgress?: (p: number) => void) {
  const base = import.meta.env["VITE_SUPABASE_URL"] as string;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const url = `${base}/storage/v1/object/upload/sign/${PDF_BUCKET}/${encoded}?token=${encodeURIComponent(token)}`;
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("content-type", "application/pdf");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Unggah gagal (${xhr.status}).`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.message) msg = body.message;
      } catch {
        /* ignore */
      }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Koneksi terputus saat mengunggah."));
    xhr.send(file);
  });
}

export async function uploadDocument(input: UploadDocumentInput): Promise<void> {
  if (input.file.size > MAX_PDF_BYTES) throw new Error("Ukuran PDF maksimal 500 MB.");
  const { createUploadUrls, finalizeUpload } = await import("@/lib/admin.functions");
  const urls = await createUploadUrls({
    data: {
      password: input.password,
      fileName: input.file.name,
      thumbName: input.thumbnail?.name ?? null,
    },
  });
  await uploadWithProgress(urls.filePath, urls.token, input.file, input.onProgress);

  let thumbnailPath: string | null = null;
  if (input.thumbnail && urls.thumb) {
    const t = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .uploadToSignedUrl(urls.thumb.path, urls.thumb.token, input.thumbnail);
    if (!t.error) thumbnailPath = urls.thumb.path;
  }

  await finalizeUpload({
    data: {
      password: input.password,
      documentId: urls.documentId,
      title: input.title,
      description: input.description ?? null,
      filePath: urls.filePath,
      thumbnailPath,
      fileSize: input.file.size,
    },
  });
}

export async function deleteDocument(doc: PdfDocument, password: string): Promise<void> {
  const { deleteDocumentAdmin } = await import("@/lib/admin.functions");
  await deleteDocumentAdmin({ data: { password, id: doc.id } });
}
