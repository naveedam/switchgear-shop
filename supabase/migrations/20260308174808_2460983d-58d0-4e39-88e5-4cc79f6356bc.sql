
-- ============================================
-- Procurement Intelligence Analytics Functions
-- ============================================

-- 1. RFQ Overview Metrics
CREATE OR REPLACE FUNCTION public.get_rfq_analytics(
  p_from_date timestamptz DEFAULT (now() - interval '90 days'),
  p_to_date timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_rfqs', COUNT(*),
    'open_rfqs', COUNT(*) FILTER (WHERE status = 'open'),
    'quoted_rfqs', COUNT(*) FILTER (WHERE status IN ('quoted', 'partially_quoted')),
    'converted_rfqs', COUNT(*) FILTER (WHERE status = 'converted'),
    'expired_rfqs', COUNT(*) FILTER (WHERE status = 'expired'),
    'cancelled_rfqs', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'conversion_rate', CASE WHEN COUNT(*) > 0 
      THEN ROUND(COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*)::numeric * 100, 1)
      ELSE 0 END,
    'avg_items_per_rfq', ROUND(AVG(total_items)::numeric, 1),
    'total_items_quoted', SUM(quoted_items)
  ) INTO v_result
  FROM rfqs
  WHERE created_at BETWEEN p_from_date AND p_to_date;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- 2. Seller Performance Leaderboard
CREATE OR REPLACE FUNCTION public.get_seller_performance(
  p_from_date timestamptz DEFAULT (now() - interval '90 days'),
  p_to_date timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(row_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'seller_id', inv.seller_id,
      'seller_name', c.name,
      'invitations_received', COUNT(*),
      'quotes_submitted', COUNT(*) FILTER (WHERE inv.status = 'responded'),
      'response_rate', CASE WHEN COUNT(*) > 0 
        THEN ROUND(COUNT(*) FILTER (WHERE inv.status = 'responded')::numeric / COUNT(*)::numeric * 100, 1)
        ELSE 0 END,
      'avg_response_hours', ROUND(
        AVG(EXTRACT(EPOCH FROM (inv.first_quote_at - inv.invited_at)) / 3600) 
        FILTER (WHERE inv.first_quote_at IS NOT NULL)::numeric, 1
      ),
      'quotes_won', (
        SELECT COUNT(*) FROM seller_quotes sq 
        WHERE sq.seller_id = inv.seller_id 
        AND sq.status = 'accepted'
        AND sq.created_at BETWEEN p_from_date AND p_to_date
      ),
      'win_rate', CASE WHEN COUNT(*) FILTER (WHERE inv.status = 'responded') > 0
        THEN ROUND(
          (SELECT COUNT(*) FROM seller_quotes sq 
           WHERE sq.seller_id = inv.seller_id AND sq.status = 'accepted'
           AND sq.created_at BETWEEN p_from_date AND p_to_date)::numeric 
          / COUNT(*) FILTER (WHERE inv.status = 'responded')::numeric * 100, 1
        )
        ELSE 0 END
    ) AS row_data
    FROM rfq_seller_invitations inv
    JOIN companies c ON c.id = inv.seller_id
    WHERE inv.invited_at BETWEEN p_from_date AND p_to_date
    GROUP BY inv.seller_id, c.name
    ORDER BY COUNT(*) FILTER (WHERE inv.status = 'responded') DESC
    LIMIT p_limit
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 3. Price Intelligence - component price tracking
CREATE OR REPLACE FUNCTION public.get_price_intelligence(
  p_from_date timestamptz DEFAULT (now() - interval '180 days'),
  p_to_date timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(row_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'description', ri.description,
      'category', ri.category,
      'times_requested', COUNT(DISTINCT ri.rfq_id),
      'total_quantity', SUM(ri.quantity),
      'quotes_received', COUNT(sqi.id),
      'min_price', MIN(sqi.unit_price),
      'max_price', MAX(sqi.unit_price),
      'avg_price', ROUND(AVG(sqi.unit_price)::numeric, 2),
      'price_variance_pct', CASE WHEN AVG(sqi.unit_price) > 0 
        THEN ROUND((STDDEV(sqi.unit_price) / AVG(sqi.unit_price) * 100)::numeric, 1)
        ELSE 0 END,
      'avg_lead_time_days', ROUND(AVG(sqi.lead_time_days)::numeric, 1)
    ) AS row_data
    FROM rfq_items ri
    LEFT JOIN seller_quote_items sqi ON sqi.rfq_item_id = ri.id AND sqi.is_available = true
    JOIN rfqs r ON r.id = ri.rfq_id
    WHERE r.created_at BETWEEN p_from_date AND p_to_date
    GROUP BY ri.description, ri.category
    HAVING COUNT(DISTINCT ri.rfq_id) >= 1
    ORDER BY COUNT(DISTINCT ri.rfq_id) DESC
    LIMIT p_limit
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 4. Component Demand Analysis
CREATE OR REPLACE FUNCTION public.get_component_demand(
  p_from_date timestamptz DEFAULT (now() - interval '180 days'),
  p_to_date timestamptz DEFAULT now(),
  p_limit int DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(row_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'category', COALESCE(ri.category, 'Uncategorized'),
      'component_count', COUNT(*),
      'unique_rfqs', COUNT(DISTINCT ri.rfq_id),
      'total_quantity', SUM(ri.quantity),
      'avg_quantity', ROUND(AVG(ri.quantity)::numeric, 1),
      'with_brand_pref', COUNT(*) FILTER (WHERE ri.preferred_brand IS NOT NULL),
      'quoted_pct', CASE WHEN COUNT(*) > 0 
        THEN ROUND(COUNT(*) FILTER (WHERE ri.status IN ('quoted', 'accepted'))::numeric / COUNT(*)::numeric * 100, 1)
        ELSE 0 END
    ) AS row_data
    FROM rfq_items ri
    JOIN rfqs r ON r.id = ri.rfq_id
    WHERE r.created_at BETWEEN p_from_date AND p_to_date
    GROUP BY COALESCE(ri.category, 'Uncategorized')
    ORDER BY COUNT(*) DESC
    LIMIT p_limit
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 5. Response Time Distribution
CREATE OR REPLACE FUNCTION public.get_response_time_distribution(
  p_from_date timestamptz DEFAULT (now() - interval '90 days'),
  p_to_date timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'under_1h', COUNT(*) FILTER (WHERE hours < 1),
    'under_4h', COUNT(*) FILTER (WHERE hours >= 1 AND hours < 4),
    'under_24h', COUNT(*) FILTER (WHERE hours >= 4 AND hours < 24),
    'under_72h', COUNT(*) FILTER (WHERE hours >= 24 AND hours < 72),
    'over_72h', COUNT(*) FILTER (WHERE hours >= 72),
    'no_response', COUNT(*) FILTER (WHERE hours IS NULL),
    'avg_hours', ROUND(AVG(hours)::numeric, 1),
    'median_hours', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hours)::numeric, 1)
  ) INTO v_result
  FROM (
    SELECT 
      EXTRACT(EPOCH FROM (first_quote_at - invited_at)) / 3600 AS hours
    FROM rfq_seller_invitations
    WHERE invited_at BETWEEN p_from_date AND p_to_date
  ) sub;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
