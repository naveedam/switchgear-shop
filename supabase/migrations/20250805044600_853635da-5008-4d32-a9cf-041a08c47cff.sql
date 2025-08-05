-- Fix the sales metrics function
CREATE OR REPLACE FUNCTION public.update_sales_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
declare
  v_total decimal(12,2);
  v_count integer;
  v_avg decimal(12,2);
  v_period_start timestamp;
  v_period_end timestamp;
begin
  -- Set period (last hour)
  v_period_end := now();
  v_period_start := v_period_end - interval '1 hour';
  
  -- Calculate metrics
  select 
    coalesce(sum(total_amount), 0),
    count(*),
    coalesce(avg(total_amount), 0)
  into v_total, v_count, v_avg
  from orders
  where created_at between v_period_start and v_period_end;

  -- Insert new metrics
  insert into sales_metrics (
    total_sales,
    orders_count,
    average_order_value,
    period_start,
    period_end
  )
  values (
    v_total,
    v_count,
    v_avg,
    v_period_start,
    v_period_end
  );

  return new;
end;
$function$;