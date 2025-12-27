import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductMasterRow, ProductSetting } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/campaignParser';
import { useFilter } from '@/contexts/FilterContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function ProductMasterPage() {
  const { product, dateRange } = useFilter();
  const [data, setData] = useState<ProductMasterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductMasterData();
  }, [product, dateRange]);

  const fetchProductMasterData = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      // 1. Fetch Settings (Price)
      const { data: settings } = await supabase.from('product_settings').select('*');

      // 2. Fetch Ads (Meta Layer)
      const { data: ads } = await supabase
        .from('ad_performance_daily')
        .select('product_code, spend, meta_leads')
        .gte('date', fromDate)
        .lte('date', toDate);

      // 3. Fetch Leads (Quality & Business Layer)
      const { data: leads } = await supabase
        .from('leads_sent_daily')
        .select('product_code, sent_all_amount, confirmed_amount')
        .gte('report_date', fromDate)
        .lte('report_date', toDate);

      // Aggregation
      const map = new Map<string, ProductMasterRow>();

      // Init from settings to ensure all products present
      settings?.forEach((s: ProductSetting) => {
        let category: any = 'Other';
        if (s.product_code.startsWith('LIFE')) category = 'Life';
        if (s.product_code.startsWith('SAVING')) category = 'Saving';
        if (s.product_code.startsWith('HEALTH')) category = 'Health';

        map.set(s.product_code, {
          product: s.product_code,
          category,
          metaSpend: 0, metaLeads: 0, metaCpl: 0,
          sentLeads: 0, screeningRate: 0, sentCpl: 0,
          tlLeads: 0, revenue: 0, roi: 0
        });
      });

      // Process Ads
      ads?.forEach((row: any) => {
        if (!map.has(row.product_code)) return; // Skip unknown products
        const item = map.get(row.product_code)!;
        item.metaSpend += (row.spend || 0);
        item.metaLeads += (row.meta_leads || 0);
      });

      // Process Leads
      leads?.forEach((row: any) => {
        if (!map.has(row.product_code)) return;
        const item = map.get(row.product_code)!;
        item.sentLeads += (row.sent_all_amount || 0);
        item.tlLeads += (row.confirmed_amount || 0);
      });

      // Calculate Derived Metrics
      const finalData: ProductMasterRow[] = [];
      map.forEach((item) => {
        // Filter if needed
        if (product !== 'all' && item.product !== product) return;

        // Meta CPC
        item.metaCpl = item.metaLeads > 0 ? Math.round(item.metaSpend / item.metaLeads) : 0;

        // Screening Rate
        item.screeningRate = item.metaLeads > 0 ? (item.sentLeads / item.metaLeads) * 100 : 0;

        // Sent CPL
        item.sentCpl = item.sentLeads > 0 ? Math.round(item.metaSpend / item.sentLeads) : 0;

        // Revenue & ROI
        const setting = settings?.find((s: ProductSetting) => s.product_code === item.product);
        const price = setting?.sell_price || 0;

        item.revenue = item.tlLeads * price;
        const profit = item.revenue - item.metaSpend;
        item.roi = item.metaSpend > 0 ? (profit / item.metaSpend) : 0; // ROI as ratio (e.g. 2.5x)

        finalData.push(item);
      });

      setData(finalData.sort((a, b) => b.revenue - a.revenue));

    } catch (error) {
      console.error("Error fetching product master:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return data.reduce(
      (acc, row) => ({
        metaSpend: acc.metaSpend + row.metaSpend,
        metaLeads: acc.metaLeads + row.metaLeads,
        sentLeads: acc.sentLeads + row.sentLeads,
        tlLeads: acc.tlLeads + row.tlLeads,
        revenue: acc.revenue + row.revenue,
      }),
      { metaSpend: 0, metaLeads: 0, sentLeads: 0, tlLeads: 0, revenue: 0 }
    );
  }, [data]);

  if (loading) {
    return (
      <DashboardLayout title="Product Master" subtitle="The 3-Layer Matrix - Single Source of Truth">
        <div className="p-10 text-center text-muted-foreground">Loading Master Data...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Product Master" subtitle="The 3-Layer Matrix - Single Source of Truth">
      <Card className="border-2 border-foreground overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {/* Layer Headers */}
              <TableRow className="border-b-2 border-foreground">
                <TableHead className="font-bold bg-secondary" rowSpan={2}>Product</TableHead>
                <TableHead className="font-bold bg-lead-meta/20 text-center border-l-2 border-foreground" colSpan={3}>
                  Meta Layer
                </TableHead>
                <TableHead className="font-bold bg-lead-sent/20 text-center border-l-2 border-foreground" colSpan={3}>
                  Quality Layer (Sent)
                </TableHead>
                <TableHead className="font-bold bg-lead-tl/20 text-center border-l-2 border-foreground" colSpan={3}>
                  Business Layer (TL)
                </TableHead>
              </TableRow>
              <TableRow className="bg-secondary">
                {/* Meta Layer */}
                <TableHead className="text-xs font-bold text-center border-l-2 border-foreground">Spend</TableHead>
                <TableHead className="text-xs font-bold text-center">Meta Leads</TableHead>
                <TableHead className="text-xs font-bold text-center">CPL (Meta)</TableHead>
                {/* Quality Layer */}
                <TableHead className="text-xs font-bold text-center border-l-2 border-foreground">Sent Leads</TableHead>
                <TableHead className="text-xs font-bold text-center">Screen Rate</TableHead>
                <TableHead className="text-xs font-bold text-center">CPL (Sent)</TableHead>
                {/* Business Layer */}
                <TableHead className="text-xs font-bold text-center border-l-2 border-foreground">TL Leads</TableHead>
                <TableHead className="text-xs font-bold text-center">Revenue</TableHead>
                <TableHead className="text-xs font-bold text-center">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No data found for selected filter
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((row) => (
                    <TableRow key={row.product}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.product}</span>
                          <span className={cn(
                            "text-xs w-fit px-1.5 py-0.5 rounded",
                            row.category === 'Life' && 'bg-category-life/20 text-category-life',
                            row.category === 'Saving' && 'bg-category-saving/20 text-category-saving',
                            row.category === 'Health' && 'bg-category-health/20 text-category-health'
                          )}>
                            {row.category}
                          </span>
                        </div>
                      </TableCell>
                      {/* Meta Layer */}
                      <TableCell className="text-center font-mono text-sm border-l-2 border-border bg-lead-meta/5">
                        {formatCurrency(row.metaSpend)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm bg-lead-meta/5">
                        {formatNumber(row.metaLeads)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm bg-lead-meta/5">
                        {formatCurrency(row.metaCpl)}
                      </TableCell>
                      {/* Quality Layer */}
                      <TableCell className="text-center font-mono text-sm font-bold border-l-2 border-border bg-lead-sent/5">
                        {formatNumber(row.sentLeads)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm bg-lead-sent/5">
                        {formatPercent(row.screeningRate)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-bold bg-lead-sent/5">
                        {formatCurrency(row.sentCpl)}
                      </TableCell>
                      {/* Business Layer */}
                      <TableCell className="text-center font-mono text-sm border-l-2 border-border bg-lead-tl/5">
                        {formatNumber(row.tlLeads)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm bg-lead-tl/5">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm font-bold bg-lead-tl/5">
                        <span className={
                          row.roi < 1 ? 'text-status-kill' :
                            row.roi >= 3 ? 'text-status-scale' :
                              'text-status-hold'
                        }>
                          {row.roi.toFixed(2)}x
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-secondary font-bold border-t-2 border-foreground">
                    <TableCell className="font-bold">
                      TOTAL
                      {product !== 'all' && <span className="ml-2 text-xs font-normal text-primary">(Filtered)</span>}
                    </TableCell>
                    <TableCell className="text-center font-mono border-l-2 border-border">
                      {formatCurrency(totals.metaSpend)}
                    </TableCell>
                    <TableCell className="text-center font-mono">{formatNumber(totals.metaLeads)}</TableCell>
                    <TableCell className="text-center font-mono">
                      {totals.metaLeads > 0 ? formatCurrency(Math.round(totals.metaSpend / totals.metaLeads)) : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono border-l-2 border-border">
                      {formatNumber(totals.sentLeads)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {totals.metaLeads > 0 ? formatPercent((totals.sentLeads / totals.metaLeads) * 100) : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {totals.sentLeads > 0 ? formatCurrency(Math.round(totals.metaSpend / totals.sentLeads)) : '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono border-l-2 border-border">
                      {formatNumber(totals.tlLeads)}
                    </TableCell>
                    <TableCell className="text-center font-mono">{formatCurrency(totals.revenue)}</TableCell>
                    <TableCell className="text-center font-mono">
                      {totals.metaSpend > 0 ? (totals.revenue / totals.metaSpend).toFixed(2) + 'x' : '-'}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Legend */}
      <div className="mt-4 p-4 bg-secondary border-2 border-foreground rounded">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-lead-meta/30 border border-lead-meta rounded"></span>
            <span><strong>Meta Layer:</strong> Raw data from Meta Ads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-lead-sent/30 border border-lead-sent rounded"></span>
            <span><strong>Quality Layer:</strong> Screened & Qualified Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-lead-tl/30 border border-lead-tl rounded"></span>
            <span><strong>Business Layer:</strong> Confirmed Revenue (TL)</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
