DROP POLICY IF EXISTS "pdf files insertable" ON storage.objects;
DROP POLICY IF EXISTS "pdf files updatable" ON storage.objects;
DROP POLICY IF EXISTS "pdf files deletable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can add documents" ON public.pdf_documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON public.pdf_documents;