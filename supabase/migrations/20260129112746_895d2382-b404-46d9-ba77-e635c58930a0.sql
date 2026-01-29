-- Fix function search paths for security
ALTER FUNCTION public.update_seller_order_timestamp() SET search_path = public;
ALTER FUNCTION public.log_seller_order_status_change() SET search_path = public;