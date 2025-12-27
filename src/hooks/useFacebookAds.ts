
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format } from 'date-fns';

export interface DateRange {
    from: Date;
    to: Date;
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
            return data;
        },
        enabled: !!dateRange?.from && !!dateRange?.to,
    });
};

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
            return data;
        },
        enabled: !!dateRange?.from && !!dateRange?.to,
    });
};

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
            return data;
        },
        enabled: !!dateRange?.from && !!dateRange?.to,
    });
};
