CREATE TABLE public.catalog_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'excel', 'csv', 'zip')),
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading','extracting','preview','mapping','committed','error')),
  extracted_count INT DEFAULT 0,
  committed_count INT DEFAULT 0,
  error_message TEXT,
  raw_extracted JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_ingestion_jobs TO authenticated;
GRANT ALL ON public.catalog_ingestion_jobs TO service_role;

ALTER TABLE public.catalog_ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only select" ON public.catalog_ingestion_jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = '14c1b96b-52e0-4d74-ae89-4e87e3cdeceb'::uuid);

CREATE POLICY "Admin only insert" ON public.catalog_ingestion_jobs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '14c1b96b-52e0-4d74-ae89-4e87e3cdeceb'::uuid);

CREATE POLICY "Admin only update" ON public.catalog_ingestion_jobs
  FOR UPDATE TO authenticated
  USING (auth.uid() = '14c1b96b-52e0-4d74-ae89-4e87e3cdeceb'::uuid)
  WITH CHECK (auth.uid() = '14c1b96b-52e0-4d74-ae89-4e87e3cdeceb'::uuid);

CREATE POLICY "Admin only delete" ON public.catalog_ingestion_jobs
  FOR DELETE TO authenticated
  USING (auth.uid() = '14c1b96b-52e0-4d74-ae89-4e87e3cdeceb'::uuid);

CREATE TRIGGER trg_catalog_ingestion_jobs_updated_at
  BEFORE UPDATE ON public.catalog_ingestion_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();