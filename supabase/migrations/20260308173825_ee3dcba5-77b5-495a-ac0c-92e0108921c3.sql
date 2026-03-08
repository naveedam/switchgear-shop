ALTER TABLE public.project_bom_items 
  ADD COLUMN IF NOT EXISTS coil_voltage text,
  ADD COLUMN IF NOT EXISTS ct_ratio text,
  ADD COLUMN IF NOT EXISTS accuracy_class text;