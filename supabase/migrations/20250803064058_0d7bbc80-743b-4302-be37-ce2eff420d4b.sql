-- Add public read policy for vendors on companies table
CREATE POLICY "Public can view active vendors" 
ON public.companies 
FOR SELECT 
USING (is_vendor = true AND status = 'active');