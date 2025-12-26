import { useMemo, useState } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, DollarSign, TrendingUp, Target, ArrowUpDown, Info } from 'lucide-react';
import { PerformanceRow } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/campaignParser';
import { useFilter } from '@/contexts/FilterContext';

// Mock data - Uses SENT Leads as primary metric
const allPerformanceData: PerformanceRow[] = [
  { product: 'LIFE-SENIOR-MORRADOK', category: 'Life', target: 2000, actual: 1650, percentAchieved: 82.5, runRateStatus: 'on-track' },
  { product: 'SAVING-RETIRE-GOLD', category: 'Saving', target: 1500, actual: 1420, percentAchieved: 94.7, runRateStatus: 'on-track' },
  { product: 'HEALTH-PLUS-PREMIUM', category: 'Health', target: 1800, actual: 1100, percentAchieved: 61.1, runRateStatus: 'at-risk' },
  { product: 'LIFE-PROTECT-FAMILY', category: 'Life', target: 1200, actual: 1180, percentAchieved: 98.3, runRateStatus: 'on-track' },
  { product: 'SAVING-EDU-FUTURE', category: 'Saving', target: 1000, actual: 520, percentAchieved: 52.0, runRateStatus: 'behind' },
  { product: 'HEALTH-CRITICAL-CARE', category: 'Health', target: 500, actual: 370, percentAchieved: 74.0, runRateStatus: 'at-risk' },
];

type SortKey = 'product' | 'target' | 'actual' | 'percentAchieved' | 'runRateStatus';
type SortOrder = 'asc' | 'desc';

export default function OverviewPage() {
  const { product } = useFilter();
  const [sortKey, setSortKey] = useState<SortKey>('runRateStatus');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filter data based on selected product
  const filteredData = useMemo(() => {
    if (product === 'all') return allPerformanceData;
    return allPerformanceData.filter(row => row.product === product);
  }, [product]);

  // Sort data
  const performanceData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'runRateStatus') {
        const statusOrder = { 'behind': 0, 'at-risk': 1, 'on-track': 2 };
        comparison = statusOrder[a.runRateStatus] - statusOrder[b.runRateStatus];
      } else if (sortKey === 'product') {
        comparison = a.product.localeCompare(b.product);
      } else {
        comparison = a[sortKey] - b[sortKey];
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Calculate KPIs based on filtered data
  const kpiData = useMemo(() => {
    const sentLeads = performanceData.reduce((sum, row) => sum + row.actual, 0);
    const sentLeadsTarget = performanceData.reduce((sum, row) => sum + row.target, 0);
    const totalSpend = performanceData.length * 200000; // Mock calculation
    const avgCplSent = sentLeads > 0 ? Math.round(totalSpend / sentLeads) : 0;
    const projectedSentLeads = Math.round(sentLeads * 1.25); // Mock projection

    return { sentLeads, sentLeadsTarget, avgCplSent, totalSpend, projectedSentLeads };
  }, [performanceData]);

  const progressPercent = kpiData.sentLeadsTarget > 0 
    ? (kpiData.sentLeads / kpiData.sentLeadsTarget) * 100 
    : 0;

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
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Projection</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">Calculated by: Current Sent Leads × (Days Remaining / Days Elapsed) + Current Sent Leads</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatNumber(kpiData.projectedSentLeads)}</p>
            </div>
            <div className="p-2 bg-status-scale text-status-scale-foreground">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Forecasted Sent Leads (EOM)</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">Based on current run rate</p>
        </Card>
      </div>

      {/* Performance vs Target Table */}
      <Card className="border-2 border-foreground">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">Performance vs Target</h2>
          <p className="text-sm text-muted-foreground">
            Sent Leads by Product (MTD) 
            {product !== 'all' && <span className="ml-2 text-primary">• Filtered: {product}</span>}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary hover:bg-secondary">
              <TableHead 
                className="font-bold cursor-pointer hover:text-primary"
                onClick={() => handleSort('product')}
              >
                <div className="flex items-center gap-1">
                  Product Name
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="font-bold text-right cursor-pointer hover:text-primary"
                onClick={() => handleSort('target')}
              >
                <div className="flex items-center justify-end gap-1">
                  Target
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="font-bold text-right cursor-pointer hover:text-primary"
                onClick={() => handleSort('actual')}
              >
                <div className="flex items-center justify-end gap-1">
                  Actual (Sent)
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="font-bold text-right cursor-pointer hover:text-primary"
                onClick={() => handleSort('percentAchieved')}
              >
                <div className="flex items-center justify-end gap-1">
                  % Achieved
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead 
                className="font-bold text-center cursor-pointer hover:text-primary"
                onClick={() => handleSort('runRateStatus')}
              >
                <div className="flex items-center justify-center gap-1">
                  Run Rate
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performanceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No data found for selected filter
                </TableCell>
              </TableRow>
            ) : (
              performanceData.map((row) => (
                <TableRow key={row.product}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{row.product}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
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
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase rounded ${
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
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </DashboardLayout>
  );
}
