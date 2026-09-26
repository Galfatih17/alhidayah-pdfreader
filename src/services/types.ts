export type PdfDocument = {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  thumbnail_path: string | null;
  file_size: number | null;
  total_pages: number | null;
  created_at: string;
  updated_at: string;
};

export type ReadingProgress = {
  id: string;
  pdf_id: string;
  user_id: string | null;
  device_id: string;
  current_page: number;
  total_pages: number | null;
  progress_percentage: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  pdf_id: string;
  user_id: string | null;
  device_id: string;
  page_number: number;
  title: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type RecentDocument = ReadingProgress & { document: PdfDocument };
export type BookmarkWithDocument = Bookmark & { document: PdfDocument };
