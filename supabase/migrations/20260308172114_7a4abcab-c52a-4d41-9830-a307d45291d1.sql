ALTER TABLE public.rfq_seller_invitations 
ADD COLUMN IF NOT EXISTS first_quote_at TIMESTAMPTZ;