import type { PdfDocument } from "@/services/types";

export type LocalPdf = {
  document: PdfDocument;
  file: File;
};

export type LocalPdfHistoryEntry = {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  lastOpenedAt: string;
};

export function createLocalPdf(file: File, id = `local-${crypto.randomUUID()}`): LocalPdf {
  const now = new Date().toISOString();

  return {
    file,
    document: {
      id,
      title: file.name.replace(/\.pdf$/i, "") || file.name,
      description: null,
      file_path: id,
      thumbnail_path: null,
      file_size: file.size,
      total_pages: null,
      created_at: now,
      updated_at: now,
    },
  };
}
