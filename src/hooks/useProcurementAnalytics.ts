import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RfqAnalytics {
  total_rfqs: number;
  open_rfqs: number;
  quoted_rfqs: number;
  converted_rfqs: number;
  expired_rfqs: number;
  cancelled_rfqs: number;
  conversion_rate: number;
  avg_items_per_rfq: number;
  total_items_quoted: number;
}

export interface SellerPerformance {
  seller_id: string;
  seller_name: string;
  invitations_received: number;
  quotes_submitted: number;
  response_rate: number;
  avg_response_hours: number | null;
  quotes_won: number;
  win_rate: number;
}

export interface PriceIntelligence {
  description: string;
  category: string | null;
  times_requested: number;
  total_quantity: number;
  quotes_received: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  price_variance_pct: number;
  avg_lead_time_days: number | null;
}

export interface ComponentDemand {
  category: string;
  component_count: number;
  unique_rfqs: number;
  total_quantity: number;
  avg_quantity: number;
  with_brand_pref: number;
  quoted_pct: number;
}

export interface ResponseTimeDistribution {
  under_1h: number;
  under_4h: number;
  under_24h: number;
  under_72h: number;
  over_72h: number;
  no_response: number;
  avg_hours: number | null;
  median_hours: number | null;
}

export const useProcurementAnalytics = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRfqAnalytics = useCallback(async (
    fromDate?: string,
    toDate?: string
  ): Promise<RfqAnalytics | null> => {
    try {
      const params: Record<string, string> = {};
      if (fromDate) params.p_from_date = fromDate;
      if (toDate) params.p_to_date = toDate;

      const { data, error } = await supabase.rpc('get_rfq_analytics', params);
      if (error) throw error;
      return data as unknown as RfqAnalytics;
    } catch (err: any) {
      console.error('fetchRfqAnalytics error:', err);
      return null;
    }
  }, []);

  const fetchSellerPerformance = useCallback(async (
    fromDate?: string,
    toDate?: string,
    limit?: number
  ): Promise<SellerPerformance[]> => {
    try {
      const params: Record<string, any> = {};
      if (fromDate) params.p_from_date = fromDate;
      if (toDate) params.p_to_date = toDate;
      if (limit) params.p_limit = limit;

      const { data, error } = await supabase.rpc('get_seller_performance', params);
      if (error) throw error;
      return (data as unknown as SellerPerformance[]) || [];
    } catch (err: any) {
      console.error('fetchSellerPerformance error:', err);
      return [];
    }
  }, []);

  const fetchPriceIntelligence = useCallback(async (
    fromDate?: string,
    toDate?: string,
    limit?: number
  ): Promise<PriceIntelligence[]> => {
    try {
      const params: Record<string, any> = {};
      if (fromDate) params.p_from_date = fromDate;
      if (toDate) params.p_to_date = toDate;
      if (limit) params.p_limit = limit;

      const { data, error } = await supabase.rpc('get_price_intelligence', params);
      if (error) throw error;
      return (data as unknown as PriceIntelligence[]) || [];
    } catch (err: any) {
      console.error('fetchPriceIntelligence error:', err);
      return [];
    }
  }, []);

  const fetchComponentDemand = useCallback(async (
    fromDate?: string,
    toDate?: string,
    limit?: number
  ): Promise<ComponentDemand[]> => {
    try {
      const params: Record<string, any> = {};
      if (fromDate) params.p_from_date = fromDate;
      if (toDate) params.p_to_date = toDate;
      if (limit) params.p_limit = limit;

      const { data, error } = await supabase.rpc('get_component_demand', params);
      if (error) throw error;
      return (data as unknown as ComponentDemand[]) || [];
    } catch (err: any) {
      console.error('fetchComponentDemand error:', err);
      return [];
    }
  }, []);

  const fetchResponseTimeDistribution = useCallback(async (
    fromDate?: string,
    toDate?: string
  ): Promise<ResponseTimeDistribution | null> => {
    try {
      const params: Record<string, string> = {};
      if (fromDate) params.p_from_date = fromDate;
      if (toDate) params.p_to_date = toDate;

      const { data, error } = await supabase.rpc('get_response_time_distribution', params);
      if (error) throw error;
      return data as unknown as ResponseTimeDistribution;
    } catch (err: any) {
      console.error('fetchResponseTimeDistribution error:', err);
      return null;
    }
  }, []);

  const loadAllAnalytics = useCallback(async (fromDate?: string, toDate?: string) => {
    setIsLoading(true);
    try {
      const [rfq, sellers, prices, demand, responseTime] = await Promise.all([
        fetchRfqAnalytics(fromDate, toDate),
        fetchSellerPerformance(fromDate, toDate),
        fetchPriceIntelligence(fromDate, toDate),
        fetchComponentDemand(fromDate, toDate),
        fetchResponseTimeDistribution(fromDate, toDate),
      ]);
      return { rfq, sellers, prices, demand, responseTime };
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load analytics', variant: 'destructive' });
      return { rfq: null, sellers: [], prices: [], demand: [], responseTime: null };
    } finally {
      setIsLoading(false);
    }
  }, [fetchRfqAnalytics, fetchSellerPerformance, fetchPriceIntelligence, fetchComponentDemand, fetchResponseTimeDistribution, toast]);

  return {
    isLoading,
    loadAllAnalytics,
    fetchRfqAnalytics,
    fetchSellerPerformance,
    fetchPriceIntelligence,
    fetchComponentDemand,
    fetchResponseTimeDistribution,
  };
};
