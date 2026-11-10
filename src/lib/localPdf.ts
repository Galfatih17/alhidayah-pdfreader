import type { PdfDocument } from "@/services/types";

export type LocalPdf = {
  document: PdfDocument;
  file: File;
};

export function createLocalPdf(file: File): LocalPdf {
  const now = new Date().toISOString();
  const id = `local-${crypto.randomUUID()}`;

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
