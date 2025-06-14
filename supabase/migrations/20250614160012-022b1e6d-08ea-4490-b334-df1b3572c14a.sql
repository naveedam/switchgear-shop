
-- Drop the existing policies that use the is_super_admin function
DROP POLICY IF EXISTS "Allow admin uploads to pricelists" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin reads from pricelists" ON storage.objects;

-- RLS Policy: This allows users who are admins to upload files into the 'pricelists' bucket.
CREATE POLICY "Allow admin uploads to pricelists"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'pricelists' AND
    EXISTS (
        SELECT 1
        FROM public.companies
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
);

-- RLS Policy: This allows users who are admins to view/download files from the 'pricelists' bucket.
CREATE POLICY "Allow admin reads from pricelists"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'pricelists' AND
    EXISTS (
        SELECT 1
        FROM public.companies
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    )
);
