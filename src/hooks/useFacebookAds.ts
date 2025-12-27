
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format } from 'date-fns';

export interface DateRange {
    from: Date;
    to: Date;
}

export interface ProductPerformance {
    product_code: string;
    spend: number;
    reach: number;
    meta_leads: number;
    date: string;
}

export const useProductPerformance = (dateRange: DateRange | undefined) => {
    return useQuery({
        queryKey: ['product_performance', dateRange],
        queryFn: async () => {
            if (!dateRange?.from || !dateRange?.to) return [];

            const { data, error } = await supabase
                .from('product_performance_daily')
                .select('*')
                .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
                .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
                .order('date', { ascending: false });

            if (error) throw error;
            return data as unknown as ProductPerformance[];
        },
        enabled: !!dateRange?.from && !!dateRange?.to,
    });
};

export interface AdPerformance {
    ad_id: string;
    image_url: string;
    spend: number;
    reach: number;
    meta_leads: number;
    date: string;
    ad_name: string;
    clicks: number;
    impressions: number;
    status: string;
    product_code: string;
}

export const useAdPerformance = (dateRange: DateRange | undefined) => {
    return useQuery({
        queryKey: ['ad_performance', dateRange],
        queryFn: async () => {
            if (!dateRange?.from || !dateRange?.to) return [];

            const { data, error } = await supabase
                .from('ad_performance_daily')
                .select('*')
                .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
                .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
                .order('spend', { ascending: false }); // High spend ads first

            if (error) throw error;
            return data as unknown as AdPerformance[];
        },
        enabled: !!dateRange?.from && !!dateRange?.to,
    });
};

export interface AudienceBreakdown {
    product_code: string;
    age_range: string;
    gender: string;
    meta_leads: number;
    spend: number;
    date: string;
}

export const useAudienceBreakdown = (dateRange: DateRange | undefined) => {
    return useQuery({
        queryKey: ['audience_breakdown', dateRange],
        queryFn: async () => {
            if (!dateRange?.from || !dateRange?.to) return [];

            const { data, error } = await supabase
                .from('audience_breakdown_daily')
                .select('*')
                .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
                .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

            if (error) throw error;
            return data as unknown as AudienceBreakdown[];
        },
        enabled: !!dateRange?.from && !!dateRange?.to,
    });
};
