
-- Create a new storage bucket for pricelists. It's set to private.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pricelists', 'pricelists', false);

-- RLS Policy: This allows users who are super admins to upload files into the 'pricelists' bucket.
CREATE POLICY "Allow admin uploads to pricelists"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'pricelists' AND
    public.is_super_admin(auth.uid())
);

-- RLS Policy: This allows users who are super admins to view/download files from the 'pricelists' bucket.
CREATE POLICY "Allow admin reads from pricelists"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'pricelists' AND
    public.is_super_admin(auth.uid())
);
