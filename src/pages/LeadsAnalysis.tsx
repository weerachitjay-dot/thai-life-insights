import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { FunnelData, ProductDropoffData } from '@/types';
import { formatNumber, formatPercent } from '@/lib/campaignParser';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowDown, TrendingDown } from 'lucide-react';

// Mock funnel data
const funnelData: FunnelData = {
  metaLeads: 8000,
  sentLeads: 5870,
  tlLeads: 4090,
  metaToSentDropoff: 26.6,
  sentToTlDropoff: 30.3,
};

const productDropoff: ProductDropoffData[] = [
  { product: 'LIFE-SENIOR-MORRADOK', metaLeads: 2450, sentLeads: 1650, tlLeads: 1200, screeningRate: 67.3, conversionRate: 72.7 },
  { product: 'SAVING-RETIRE-GOLD', metaLeads: 1820, sentLeads: 1420, tlLeads: 980, screeningRate: 78.0, conversionRate: 69.0 },
  { product: 'HEALTH-PLUS-PREMIUM', metaLeads: 1600, sentLeads: 1100, tlLeads: 650, screeningRate: 68.8, conversionRate: 59.1 },
  { product: 'LIFE-PROTECT-FAMILY', metaLeads: 1450, sentLeads: 1180, tlLeads: 920, screeningRate: 81.4, conversionRate: 78.0 },
  { product: 'SAVING-EDU-FUTURE', metaLeads: 680, sentLeads: 520, tlLeads: 340, screeningRate: 76.5, conversionRate: 65.4 },
];

const funnelSteps = [
  { name: 'Meta Leads', value: funnelData.metaLeads, color: 'hsl(var(--lead-meta))', label: 'Raw Interest' },
  { name: 'Sent Leads', value: funnelData.sentLeads, color: 'hsl(var(--lead-sent))', label: 'Qualified' },
  { name: 'TL Leads', value: funnelData.tlLeads, color: 'hsl(var(--lead-tl))', label: 'Confirmed Revenue' },
];

export default function LeadsAnalysisPage() {
  return (
    <DashboardLayout title="Leads Analysis" subtitle="The Funnel of Truth - Data Integrity View">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Visualization */}
        <Card className="border-2 border-foreground p-6">
          <h2 className="font-bold text-lg mb-6">Lead Conversion Funnel</h2>
          
          <div className="space-y-4">
            {funnelSteps.map((step, index) => {
              const widthPercent = (step.value / funnelData.metaLeads) * 100;
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
                        width: `${widthPercent}%`,
                        backgroundColor: step.color,
                        marginLeft: `${(100 - widthPercent) / 2}%`,
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

          <div className="mt-4 flex justify-center gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-status-scale"></span>
              ≥75% Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-status-hold"></span>
              65-75% Watch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-status-risk"></span>
              &lt;65% Risk
            </span>
          </div>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-2 border-foreground mt-6">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">Detailed Conversion Breakdown</h2>
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
              {productDropoff.map((row) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
