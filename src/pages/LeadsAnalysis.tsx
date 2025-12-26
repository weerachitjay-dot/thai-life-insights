import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { ProductDropoffData } from '@/types';
import { formatNumber, formatPercent } from '@/lib/campaignParser';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowDown, TrendingDown } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';

// Mock data
const allProductDropoff: ProductDropoffData[] = [
  { product: 'LIFE-SENIOR-MORRADOK', metaLeads: 2450, sentLeads: 1650, tlLeads: 1200, screeningRate: 67.3, conversionRate: 72.7 },
  { product: 'SAVING-RETIRE-GOLD', metaLeads: 1820, sentLeads: 1420, tlLeads: 980, screeningRate: 78.0, conversionRate: 69.0 },
  { product: 'HEALTH-PLUS-PREMIUM', metaLeads: 1600, sentLeads: 1100, tlLeads: 650, screeningRate: 68.8, conversionRate: 59.1 },
  { product: 'LIFE-PROTECT-FAMILY', metaLeads: 1450, sentLeads: 1180, tlLeads: 920, screeningRate: 81.4, conversionRate: 78.0 },
  { product: 'SAVING-EDU-FUTURE', metaLeads: 680, sentLeads: 520, tlLeads: 340, screeningRate: 76.5, conversionRate: 65.4 },
  { product: 'HEALTH-CRITICAL-CARE', metaLeads: 480, sentLeads: 370, tlLeads: 220, screeningRate: 77.1, conversionRate: 59.5 },
];

export default function LeadsAnalysisPage() {
  const { product } = useFilter();

  // Filter data based on selected product
  const productDropoff = useMemo(() => {
    if (product === 'all') return allProductDropoff;
    return allProductDropoff.filter(row => row.product === product);
  }, [product]);

  // Calculate funnel data from filtered products
  const funnelData = useMemo(() => {
    const metaLeads = productDropoff.reduce((sum, row) => sum + row.metaLeads, 0);
    const sentLeads = productDropoff.reduce((sum, row) => sum + row.sentLeads, 0);
    const tlLeads = productDropoff.reduce((sum, row) => sum + row.tlLeads, 0);
    const metaToSentDropoff = metaLeads > 0 ? ((metaLeads - sentLeads) / metaLeads) * 100 : 0;
    const sentToTlDropoff = sentLeads > 0 ? ((sentLeads - tlLeads) / sentLeads) * 100 : 0;

    return { metaLeads, sentLeads, tlLeads, metaToSentDropoff, sentToTlDropoff };
  }, [productDropoff]);

  const funnelSteps = [
    { name: 'Meta Leads', value: funnelData.metaLeads, color: 'hsl(var(--lead-meta))', label: 'Raw Interest' },
    { name: 'Sent Leads', value: funnelData.sentLeads, color: 'hsl(var(--lead-sent))', label: 'Qualified' },
    { name: 'TL Leads', value: funnelData.tlLeads, color: 'hsl(var(--lead-tl))', label: 'Confirmed Revenue' },
  ];

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
              const widthPercent = funnelData.metaLeads > 0 ? (step.value / funnelData.metaLeads) * 100 : 0;
              const dropoff = index === 0 ? null : 
                index === 1 ? funnelData.metaToSentDropoff : funnelData.sentToTlDropoff;

              return (
                <div key={step.name}>
                  {dropoff !== null && (
                    <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-sm font-mono">-{formatPercent(dropoff)} drop-off</span>
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

          {productDropoff.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data for selected filter
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={productDropoff}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
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
                  {productDropoff.map((entry, index) => (
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
              {productDropoff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No data for selected filter
                  </td>
                </tr>
              ) : (
                productDropoff.map((row) => (
                  <tr key={row.product} className="border-b border-border">
                    <td className="p-3 font-medium">{row.product}</td>
                    <td className="p-3 text-right font-mono">{formatNumber(row.metaLeads)}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatNumber(row.sentLeads)}</td>
                    <td className="p-3 text-right font-mono">{formatNumber(row.tlLeads)}</td>
                    <td className="p-3 text-right">
                      <span className={`font-mono font-bold ${
                        row.screeningRate >= 75 ? 'text-status-scale' :
                        row.screeningRate >= 65 ? 'text-status-hold' : 'text-status-risk'
                      }`}>
                        {formatPercent(row.screeningRate)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-mono font-bold ${
                        row.conversionRate >= 70 ? 'text-status-scale' :
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
