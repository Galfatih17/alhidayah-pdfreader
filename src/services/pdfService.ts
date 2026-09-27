import { supabase } from "@/integrations/supabase/client";
import { PDF_BUCKET, THUMBNAIL_BUCKET } from "./pdfStorageService";
import type { PdfDocument } from "./types";

export async function listDocuments(): Promise<PdfDocument[]> {
  const { data, error } = await supabase
    .from("pdf_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PdfDocument[];
}

export async function getDocument(id: string): Promise<PdfDocument> {
  const { data, error } = await supabase
    .from("pdf_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Dokumen tidak ditemukan.");
  return data as PdfDocument;
}

export async function updateTotalPages(id: string, totalPages: number): Promise<void> {
  const { error } = await supabase
    .from("pdf_documents")
    .update({ total_pages: totalPages })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export type UploadDocumentInput = {
  password: string;
  title: string;
  description?: string;
  file: File;
  thumbnail?: File | null;
};

export async function uploadDocument(input: UploadDocumentInput): Promise<void> {
  const { createUploadUrls, finalizeUpload } = await import("@/lib/admin.functions");
  const urls = await createUploadUrls({
    data: {
      password: input.password,
      fileName: input.file.name,
      thumbName: input.thumbnail?.name ?? null,
    },
  });
  const up = await supabase.storage
    .from(PDF_BUCKET)
    .uploadToSignedUrl(urls.filePath, urls.token, input.file, { contentType: "application/pdf" });
  if (up.error) throw new Error(up.error.message);

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
