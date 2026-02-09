-- Add missing industry-standard specification columns to products table
-- These columns are needed for categories that currently lack proper spec fields

-- Relays
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS relay_type text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reset_type text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS timing_range text;

-- Motor Starters
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS starter_type text;

-- Meters
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meter_type text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ct_ratio text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS class_accuracy text;

-- Switches & Sockets
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS switch_type text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS gang_count integer;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS socket_type text;

-- Industrial Plugs & Sockets
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS plug_type text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hours_position text;

-- General industrial fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duty_cycle text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS service_factor text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS enclosure_type text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS enclosure_material text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supply_voltage text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS output_current_range text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS torque_control text;