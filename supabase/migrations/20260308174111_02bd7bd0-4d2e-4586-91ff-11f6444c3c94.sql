
ALTER TABLE public.rfq_seller_invitations 
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_channel text DEFAULT 'in_app';
