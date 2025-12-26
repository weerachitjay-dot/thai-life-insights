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
import { ProductMasterRow } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/campaignParser';

// Mock data - 3-Layer Matrix
const productMasterData: ProductMasterRow[] = [
  { 
    product: 'LIFE-SENIOR-MORRADOK', category: 'Life',
    metaSpend: 350000, metaLeads: 2450, metaCpl: 143,
    sentLeads: 1650, screeningRate: 67.3, sentCpl: 212,
    tlLeads: 1200, revenue: 2400000, roi: 6.86
  },
  { 
    product: 'SAVING-RETIRE-GOLD', category: 'Saving',
    metaSpend: 280000, metaLeads: 1820, metaCpl: 154,
    sentLeads: 1420, screeningRate: 78.0, sentCpl: 197,
    tlLeads: 980, revenue: 1960000, roi: 7.00
  },
  { 
    product: 'HEALTH-PLUS-PREMIUM', category: 'Health',
    metaSpend: 320000, metaLeads: 1600, metaCpl: 200,
    sentLeads: 1100, screeningRate: 68.8, sentCpl: 291,
    tlLeads: 650, revenue: 975000, roi: 3.05
  },
  { 
    product: 'LIFE-PROTECT-FAMILY', category: 'Life',
    metaSpend: 180000, metaLeads: 1450, metaCpl: 124,
    sentLeads: 1180, screeningRate: 81.4, sentCpl: 153,
    tlLeads: 920, revenue: 1840000, roi: 10.22
  },
  { 
    product: 'SAVING-EDU-FUTURE', category: 'Saving',
    metaSpend: 120000, metaLeads: 680, metaCpl: 176,
    sentLeads: 520, screeningRate: 76.5, sentCpl: 231,
    tlLeads: 340, revenue: 510000, roi: 4.25
  },
];

export default function ProductMasterPage() {
  const totals = productMasterData.reduce(
    (acc, row) => ({
      metaSpend: acc.metaSpend + row.metaSpend,
      metaLeads: acc.metaLeads + row.metaLeads,
      sentLeads: acc.sentLeads + row.sentLeads,
      tlLeads: acc.tlLeads + row.tlLeads,
      revenue: acc.revenue + row.revenue,
    }),
    { metaSpend: 0, metaLeads: 0, sentLeads: 0, tlLeads: 0, revenue: 0 }
  );

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
              {productMasterData.map((row) => (
                <TableRow key={row.product}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{row.product}</span>
                      <span className={`text-xs w-fit px-1.5 py-0.5 ${
                        row.category === 'Life' ? 'bg-category-life/20 text-category-life' :
                        row.category === 'Saving' ? 'bg-category-saving/20 text-category-saving' :
                        'bg-category-health/20 text-category-health'
                      }`}>
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
                    <span className={row.roi >= 5 ? 'text-status-scale' : row.roi >= 3 ? 'text-status-hold' : 'text-status-risk'}>
                      {row.roi.toFixed(2)}x
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="bg-secondary font-bold border-t-2 border-foreground">
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell className="text-center font-mono border-l-2 border-border">
                  {formatCurrency(totals.metaSpend)}
                </TableCell>
                <TableCell className="text-center font-mono">{formatNumber(totals.metaLeads)}</TableCell>
                <TableCell className="text-center font-mono">
                  {formatCurrency(Math.round(totals.metaSpend / totals.metaLeads))}
                </TableCell>
                <TableCell className="text-center font-mono border-l-2 border-border">
                  {formatNumber(totals.sentLeads)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatPercent((totals.sentLeads / totals.metaLeads) * 100)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {formatCurrency(Math.round(totals.metaSpend / totals.sentLeads))}
                </TableCell>
                <TableCell className="text-center font-mono border-l-2 border-border">
                  {formatNumber(totals.tlLeads)}
                </TableCell>
                <TableCell className="text-center font-mono">{formatCurrency(totals.revenue)}</TableCell>
                <TableCell className="text-center font-mono">
                  {(totals.revenue / totals.metaSpend).toFixed(2)}x
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Legend */}
      <div className="mt-4 p-4 bg-secondary border-2 border-foreground">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-lead-meta/30 border border-lead-meta"></span>
            <span><strong>Meta Layer:</strong> Raw data from Meta Ads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-lead-sent/30 border border-lead-sent"></span>
            <span><strong>Quality Layer:</strong> Screened & Qualified Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-lead-tl/30 border border-lead-tl"></span>
            <span><strong>Business Layer:</strong> Confirmed Revenue (TL)</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
