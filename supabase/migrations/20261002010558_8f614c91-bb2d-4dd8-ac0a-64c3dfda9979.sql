CREATE OR REPLACE FUNCTION public.request_device_id()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('request.headers', true)::json->>'x-device-id', '')
$$;

DROP POLICY IF EXISTS "Bookmarks are readable" ON public.bookmarks;
DROP POLICY IF EXISTS "Bookmarks can be created" ON public.bookmarks;
DROP POLICY IF EXISTS "Bookmarks can be deleted" ON public.bookmarks;
DROP POLICY IF EXISTS "Bookmarks can be updated" ON public.bookmarks;
CREATE POLICY "Device reads own bookmarks" ON public.bookmarks FOR SELECT TO anon, authenticated USING (device_id = public.request_device_id());
CREATE POLICY "Device creates own bookmarks" ON public.bookmarks FOR INSERT TO anon, authenticated WITH CHECK (device_id = public.request_device_id());
CREATE POLICY "Device updates own bookmarks" ON public.bookmarks FOR UPDATE TO anon, authenticated USING (device_id = public.request_device_id()) WITH CHECK (device_id = public.request_device_id());
CREATE POLICY "Device deletes own bookmarks" ON public.bookmarks FOR DELETE TO anon, authenticated USING (device_id = public.request_device_id());

DROP POLICY IF EXISTS "Progress is readable" ON public.reading_progress;
DROP POLICY IF EXISTS "Progress can be created" ON public.reading_progress;
DROP POLICY IF EXISTS "Progress can be deleted" ON public.reading_progress;
DROP POLICY IF EXISTS "Progress can be updated" ON public.reading_progress;
CREATE POLICY "Device reads own progress" ON public.reading_progress FOR SELECT TO anon, authenticated USING (device_id = public.request_device_id());
CREATE POLICY "Device creates own progress" ON public.reading_progress FOR INSERT TO anon, authenticated WITH CHECK (device_id = public.request_device_id());
CREATE POLICY "Device updates own progress" ON public.reading_progress FOR UPDATE TO anon, authenticated USING (device_id = public.request_device_id()) WITH CHECK (device_id = public.request_device_id());
CREATE POLICY "Device deletes own progress" ON public.reading_progress FOR DELETE TO anon, authenticated USING (device_id = public.request_device_id());

DROP POLICY IF EXISTS "Anyone can update documents" ON public.pdf_documents;
REVOKE UPDATE ON public.pdf_documents FROM anon, authenticated;