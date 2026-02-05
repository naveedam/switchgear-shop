-- Fix function search_path for new functions
CREATE OR REPLACE FUNCTION public.generate_rfq_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_number TEXT;
BEGIN
    v_year := to_char(now(), 'YY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.rfqs WHERE created_at >= date_trunc('year', now());
    v_number := 'RFQ-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_quote_number(p_seller_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_year TEXT;
    v_count INTEGER;
    v_prefix TEXT;
    v_number TEXT;
BEGIN
    v_year := to_char(now(), 'YY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.seller_quotes 
    WHERE seller_id = p_seller_id AND created_at >= date_trunc('year', now());
    
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3)) INTO v_prefix 
    FROM public.companies WHERE id = p_seller_id;
    
    v_prefix := COALESCE(v_prefix, 'QTE');
    v_number := v_prefix || '-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    RETURN v_number;
END;
$$;

-- Fix the overly permissive audit log insert policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.rfq_audit_log;
CREATE POLICY "Authenticated users can insert audit logs" ON public.rfq_audit_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);