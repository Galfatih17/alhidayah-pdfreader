CREATE TABLE public.pdf_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size BIGINT,
  total_pages INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pdf_documents_title ON public.pdf_documents (title);
CREATE INDEX idx_pdf_documents_created_at ON public.pdf_documents (created_at DESC);

CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  user_id UUID,
  device_id TEXT NOT NULL DEFAULT 'anonymous',
  current_page INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER,
  progress_percentage NUMERIC NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pdf_id, device_id)
);
CREATE INDEX idx_reading_progress_last_read ON public.reading_progress (device_id, last_read_at DESC);

CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_id UUID NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  user_id UUID,
  device_id TEXT NOT NULL DEFAULT 'anonymous',
  page_number INTEGER NOT NULL,
  title TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookmarks_pdf_id ON public.bookmarks (pdf_id);
CREATE INDEX idx_bookmarks_page_number ON public.bookmarks (pdf_id, page_number);
CREATE INDEX idx_bookmarks_created_at ON public.bookmarks (device_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_documents TO anon, authenticated;
GRANT ALL ON public.pdf_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_progress TO anon, authenticated;
GRANT ALL ON public.reading_progress TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO anon, authenticated;
GRANT ALL ON public.bookmarks TO service_role;

ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents are viewable by everyone" ON public.pdf_documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add documents" ON public.pdf_documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update documents" ON public.pdf_documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete documents" ON public.pdf_documents FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Progress is readable" ON public.reading_progress FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Progress can be created" ON public.reading_progress FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Progress can be updated" ON public.reading_progress FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Progress can be deleted" ON public.reading_progress FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Bookmarks are readable" ON public.bookmarks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Bookmarks can be created" ON public.bookmarks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Bookmarks can be updated" ON public.bookmarks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Bookmarks can be deleted" ON public.bookmarks FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pdf_documents_updated_at BEFORE UPDATE ON public.pdf_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookmarks_updated_at BEFORE UPDATE ON public.bookmarks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();