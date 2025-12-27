import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { ProductDropoffData } from '@/types';
import { formatNumber, formatPercent } from '@/lib/campaignParser';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowDown, TrendingDown } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';
import { supabase } from '@/integrations/supabase/client';

export default function LeadsAnalysisPage() {
  const { product, dateRange } = useFilter();
  const [data, setData] = useState<ProductDropoffData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadsAnalysis();
  }, [product, dateRange]);

  const fetchLeadsAnalysis = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      // We need similar aggregation as ProductMaster but focused on funnel
      // 1. Fetch Ads (Meta Leads)
      const { data: ads } = await supabase
        .from('ad_performance_daily')
        .select('product_code, meta_leads')
        .gte('date', fromDate)
        .lte('date', toDate);

      // 2. Fetch Leads (Sent & TL)
      const { data: leads } = await supabase
        .from('leads_sent_daily')
        .select('product_code, sent_all_amount, confirmed_amount')
        .gte('report_date', fromDate)
        .lte('report_date', toDate);

      // 3. Since we want breakdown by product, use a map.
      // We'll collect all products found in both sources.
      const map = new Map<string, ProductDropoffData>();

      const getOrCreate = (code: string) => {
        if (!map.has(code)) {
          map.set(code, {
            product: code,
            metaLeads: 0,
            sentLeads: 0,
            tlLeads: 0,
            screeningRate: 0,
            conversionRate: 0
          });
        }
        return map.get(code)!;
      };

      // Helper to validate product code
      const isValidProductCode = (code: any): boolean => {
        if (!code || typeof code !== 'string') return false;
        const normalized = code.trim();
        if (normalized === '' || normalized === '{}' || normalized === 'UNKNOWN-PRODUCT') return false;
        if (normalized.startsWith('UNKNOWN') || normalized.startsWith('unknown')) return false;
        return true;
      };

      ads?.forEach((row: any) => {
        if (!isValidProductCode(row.product_code)) return;
        const item = getOrCreate(row.product_code);
        item.metaLeads += (row.meta_leads || 0);
      });

      leads?.forEach((row: any) => {
        if (!isValidProductCode(row.product_code)) return;
        const item = getOrCreate(row.product_code);
        item.sentLeads += (row.sent_all_amount || 0);
        item.tlLeads += (row.confirmed_amount || 0);
      });

      const finalData: ProductDropoffData[] = [];
      map.forEach(item => {
        if (product !== 'all' && item.product !== product) return;

        item.screeningRate = item.metaLeads > 0 ? (item.sentLeads / item.metaLeads) * 100 : 0;
        item.conversionRate = item.sentLeads > 0 ? (item.tlLeads / item.sentLeads) * 100 : 0;

        // Only include if there is some activity
        if (item.metaLeads > 0 || item.sentLeads > 0) {
          finalData.push(item);
        }
      });

      setData(finalData.sort((a, b) => b.metaLeads - a.metaLeads));

    } catch (error) {
      console.error("Error fetching leads analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate funnel data from filtered products
  const funnelData = useMemo(() => {
    const metaLeads = data.reduce((sum, row) => sum + row.metaLeads, 0);
    const sentLeads = data.reduce((sum, row) => sum + row.sentLeads, 0);
    const tlLeads = data.reduce((sum, row) => sum + row.tlLeads, 0);
    const metaToSentDropoff = metaLeads > 0 ? ((metaLeads - sentLeads) / metaLeads) * 100 : 0;
    const sentToTlDropoff = sentLeads > 0 ? ((sentLeads - tlLeads) / sentLeads) * 100 : 0;

    return { metaLeads, sentLeads, tlLeads, metaToSentDropoff, sentToTlDropoff };
  }, [data]);

  const funnelSteps = [
    { name: 'Meta Leads', value: funnelData.metaLeads, color: 'hsl(var(--lead-meta))', label: 'Raw Interest' },
    { name: 'Sent Leads', value: funnelData.sentLeads, color: 'hsl(var(--lead-sent))', label: 'Qualified' },
    { name: 'TL Leads', value: funnelData.tlLeads, color: 'hsl(var(--lead-tl))', label: 'Confirmed Revenue' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Leads Analysis" subtitle="The Funnel of Truth - Data Integrity View">
        <div className="p-10 text-center text-muted-foreground">Loading Analysis...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leads Analysis" subtitle="The Funnel of Truth - Data Integrity View">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Visualization */}
        <Card className="border-2 border-foreground p-6">
          <h2 className="font-bold text-lg mb-6">
            Lead Conversion Funnel
            {product !== 'all' && <span className="ml-2 text-sm font-normal text-primary">({product})</span>}
          </h2>

          <div className="space-y-4">
            {funnelSteps.map((step, index) => {
              const widthPercent = funnelData.metaLeads > 0 ? (step.value / funnelData.metaLeads) * 100 : 100;
              const dropoff = index === 0 ? null :
                index === 1 ? funnelData.metaToSentDropoff : funnelData.sentToTlDropoff;

              const dropoffLabel = index === 1 ? 'Screening Process' : 'Customer Unreachable';

              return (
                <div key={step.name}>
                  {dropoff !== null && (
                    <div className="flex flex-col items-center gap-1 py-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-4 h-4" />
                        <span className="text-sm font-mono">-{formatPercent(dropoff)} drop-off</span>
                      </div>
                      <span className="text-xs text-muted-foreground/70 italic">{dropoffLabel}</span>
                    </div>
                  )}
                  <div className="relative">
                    <div
                      className="h-16 flex items-center justify-between px-4 transition-all"
                      style={{
                        width: `${Math.max(widthPercent, 10)}%`,
                        backgroundColor: step.color,
                        marginLeft: `${(100 - Math.max(widthPercent, 10)) / 2}%`,
                      }}
                    >
                      <div className="text-xs font-bold uppercase" style={{ color: 'white' }}>
                        {step.name}
                      </div>
                      <div className="text-2xl font-bold" style={{ color: 'white' }}>
                        {formatNumber(step.value)}
                      </div>
                    </div>
                    <div className="text-center mt-1 text-xs text-muted-foreground">
                      {step.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Funnel Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Meta → Sent Rate</p>
              <p className="text-2xl font-bold text-lead-sent">
                {formatPercent(100 - funnelData.metaToSentDropoff)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Sent → TL Rate</p>
              <p className="text-2xl font-bold text-lead-tl">
                {formatPercent(100 - funnelData.sentToTlDropoff)}
              </p>
            </div>
          </div>
        </Card>

        {/* Drop-off by Product */}
        <Card className="border-2 border-foreground p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">Drop-off Rate by Product</h2>
            <div className="flex items-center gap-1 text-status-risk">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-bold">Screening Loss</span>
            </div>
          </div>

          {data.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data for selected filter
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 'auto']} tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="product"
                  tick={{ fontSize: 11 }}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Screening Rate']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '2px solid hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="screeningRate" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.screeningRate >= 75 ? 'hsl(var(--status-scale))' :
                        entry.screeningRate >= 65 ? 'hsl(var(--status-hold))' :
                          'hsl(var(--status-risk))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="mt-4 flex justify-center gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-status-scale"></span>
              ≥75% Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-status-hold"></span>
              65-75% Watch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-status-risk"></span>
              &lt;65% Risk
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-2 border-foreground mt-6">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">Detailed Conversion Breakdown</h2>
          {product !== 'all' && <p className="text-sm text-primary">Filtered: {product}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="text-left p-3 font-bold">Product</th>
                <th className="text-right p-3 font-bold text-lead-meta">Meta Leads</th>
                <th className="text-right p-3 font-bold text-lead-sent">Sent Leads</th>
                <th className="text-right p-3 font-bold text-lead-tl">TL Leads</th>
                <th className="text-right p-3 font-bold">Screen Rate</th>
                <th className="text-right p-3 font-bold">TL Conv Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No data for selected filter
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.product} className="border-b border-border">
                    <td className="p-3 font-medium">{row.product}</td>
                    <td className="p-3 text-right font-mono">{formatNumber(row.metaLeads)}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatNumber(row.sentLeads)}</td>
                    <td className="p-3 text-right font-mono">{formatNumber(row.tlLeads)}</td>
                    <td className="p-3 text-right">
                      <span className={`font-mono font-bold ${row.screeningRate >= 75 ? 'text-status-scale' :
                        row.screeningRate >= 65 ? 'text-status-hold' : 'text-status-risk'
                        }`}>
                        {formatPercent(row.screeningRate)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-mono font-bold ${row.conversionRate >= 70 ? 'text-status-scale' :
                        row.conversionRate >= 60 ? 'text-status-hold' : 'text-status-risk'
                        }`}>
                        {formatPercent(row.conversionRate)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
