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
  title: string;
  description?: string;
  file: File;
  thumbnail?: File | null;
};

export async function uploadDocument(input: UploadDocumentInput): Promise<PdfDocument> {
  const documentId = crypto.randomUUID();
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${documentId}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(filePath, input.file, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  let thumbnailPath: string | null = null;
  if (input.thumbnail) {
    const thumbName = input.thumbnail.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${documentId}/${thumbName}`;
    const { error: thumbError } = await supabase.storage
      .from(THUMBNAIL_BUCKET)
      .upload(path, input.thumbnail, { upsert: false });
    if (!thumbError) thumbnailPath = path;
  }

  const { data, error } = await supabase
    .from("pdf_documents")
    .insert({
      id: documentId,
      title: input.title,
      description: input.description?.trim() || null,
      file_path: filePath,
      thumbnail_path: thumbnailPath,
      file_size: input.file.size,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(PDF_BUCKET).remove([filePath]);
    throw new Error(error.message);
  }

  return data as PdfDocument;
}

export async function deleteDocument(doc: PdfDocument): Promise<void> {
  const { error } = await supabase.from("pdf_documents").delete().eq("id", doc.id);
  if (error) throw new Error(error.message);
  await supabase.storage.from(PDF_BUCKET).remove([doc.file_path]);
  if (doc.thumbnail_path) {
    await supabase.storage.from(THUMBNAIL_BUCKET).remove([doc.thumbnail_path]);
  }
}
