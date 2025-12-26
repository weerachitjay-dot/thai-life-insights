import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import { OverviewKpiData, PerformanceRow } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/campaignParser';

// Mock data - Uses SENT Leads as primary metric
const kpiData: OverviewKpiData = {
  sentLeads: 6240,
  sentLeadsTarget: 8000,
  avgCplSent: 200,
  totalSpend: 1250000,
  projectedSentLeads: 7800,
};

const performanceData: PerformanceRow[] = [
  { product: 'LIFE-SENIOR-MORRADOK', category: 'Life', target: 2000, actual: 1650, percentAchieved: 82.5, runRateStatus: 'on-track' },
  { product: 'SAVING-RETIRE-GOLD', category: 'Saving', target: 1500, actual: 1420, percentAchieved: 94.7, runRateStatus: 'on-track' },
  { product: 'HEALTH-PLUS-PREMIUM', category: 'Health', target: 1800, actual: 1100, percentAchieved: 61.1, runRateStatus: 'at-risk' },
  { product: 'LIFE-PROTECT-FAMILY', category: 'Life', target: 1200, actual: 1180, percentAchieved: 98.3, runRateStatus: 'on-track' },
  { product: 'SAVING-EDU-FUTURE', category: 'Saving', target: 1000, actual: 520, percentAchieved: 52.0, runRateStatus: 'behind' },
  { product: 'HEALTH-CRITICAL-CARE', category: 'Health', target: 500, actual: 370, percentAchieved: 74.0, runRateStatus: 'at-risk' },
];

export default function OverviewPage() {
  const progressPercent = (kpiData.sentLeads / kpiData.sentLeadsTarget) * 100;

  return (
    <DashboardLayout title="Overview" subtitle="Control Tower - Executive View">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Sent Leads (Primary) */}
        <Card className="p-4 border-2 border-foreground bg-lead-sent/10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Sent Leads (Qualified)</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(kpiData.sentLeads)}</p>
            </div>
            <div className="p-2 bg-lead-sent text-lead-sent-foreground">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Target: {formatNumber(kpiData.sentLeadsTarget)}</span>
              <span className="font-bold">{progressPercent.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </Card>

        {/* Avg CPL (Sent) */}
        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Avg. CPL (Sent)</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(kpiData.avgCplSent)}</p>
            </div>
            <div className="p-2 bg-secondary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Cost per Qualified Lead</p>
        </Card>

        {/* Total Spend */}
        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Total Spend</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(kpiData.totalSpend)}</p>
            </div>
            <div className="p-2 bg-secondary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">MTD Spend</p>
        </Card>

        {/* Projection */}
        <Card className="p-4 border-2 border-foreground bg-status-scale/10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Projection</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(kpiData.projectedSentLeads)}</p>
            </div>
            <div className="p-2 bg-status-scale text-status-scale-foreground">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Forecasted Sent Leads (EOM)</p>
        </Card>
      </div>

      {/* Performance vs Target Table */}
      <Card className="border-2 border-foreground">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">Performance vs Target</h2>
          <p className="text-sm text-muted-foreground">Sent Leads by Product (MTD)</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead className="font-bold">Product Name</TableHead>
              <TableHead className="font-bold text-right">Target</TableHead>
              <TableHead className="font-bold text-right">Actual (Sent)</TableHead>
              <TableHead className="font-bold text-right">% Achieved</TableHead>
              <TableHead className="font-bold text-center">Run Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performanceData.map((row) => (
              <TableRow key={row.product}>
                <TableCell>
                  <div>
                    <span className="font-medium">{row.product}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 ${
                      row.category === 'Life' ? 'bg-category-life/20 text-category-life' :
                      row.category === 'Saving' ? 'bg-category-saving/20 text-category-saving' :
                      'bg-category-health/20 text-category-health'
                    }`}>
                      {row.category}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{formatNumber(row.target)}</TableCell>
                <TableCell className="text-right font-mono font-bold">{formatNumber(row.actual)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Progress value={row.percentAchieved} className="w-20 h-2" />
                    <span className="font-mono text-sm w-14 text-right">{row.percentAchieved.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase ${
                    row.runRateStatus === 'on-track' ? 'bg-status-scale/20 text-status-scale' :
                    row.runRateStatus === 'at-risk' ? 'bg-status-risk/20 text-status-risk' :
                    'bg-status-kill/20 text-status-kill'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      row.runRateStatus === 'on-track' ? 'bg-status-scale' :
                      row.runRateStatus === 'at-risk' ? 'bg-status-risk' :
                      'bg-status-kill'
                    }`}></span>
                    {row.runRateStatus === 'on-track' ? 'On Track' : 
                     row.runRateStatus === 'at-risk' ? 'At Risk' : 'Behind'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </DashboardLayout>
  );
}
