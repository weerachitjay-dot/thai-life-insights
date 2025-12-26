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
import { formatCurrency, formatNumber, formatPercent } from '@/lib/campaignParser';
import { useFilter } from '@/contexts/FilterContext';

// Mock data - Uses SENT Leads as primary metric, Partner Leads as shadow metric
// Logic: targetSent = businessTarget / expectedConvRate
const allPerformanceData: PerformanceRow[] = [
  { 
    product: 'LIFE-SENIOR-MORRADOK', 
    category: 'Life',
    businessTarget: 1400, // Partner/TL target
    expectedConvRate: 0.70, // 70% expected conv
    targetSent: 2000, // 1400 / 0.70
    actualSent: 1650,
    percentAchieved: 82.5,
    partnerLeads: 1200, // TL Leads
    convRate: 72.7, // (1200 / 1650) * 100
    runRateStatus: 'on-track'
  },
  { 
    product: 'SAVING-RETIRE-GOLD', 
    category: 'Saving',
    businessTarget: 1050,
    expectedConvRate: 0.70,
    targetSent: 1500,
    actualSent: 1420,
    percentAchieved: 94.7,
    partnerLeads: 980,
    convRate: 69.0,
    runRateStatus: 'on-track'
  },
  { 
    product: 'HEALTH-PLUS-PREMIUM', 
    category: 'Health',
    businessTarget: 1260,
    expectedConvRate: 0.70,
    targetSent: 1800,
    actualSent: 1100,
    percentAchieved: 61.1,
    partnerLeads: 650,
    convRate: 59.1,
    runRateStatus: 'at-risk'
  },
  { 
    product: 'LIFE-PROTECT-FAMILY', 
    category: 'Life',
    businessTarget: 840,
    expectedConvRate: 0.70,
    targetSent: 1200,
    actualSent: 1180,
    percentAchieved: 98.3,
    partnerLeads: 920,
    convRate: 78.0,
    runRateStatus: 'on-track'
  },
  { 
    product: 'SAVING-EDU-FUTURE', 
    category: 'Saving',
    businessTarget: 700,
    expectedConvRate: 0.70,
    targetSent: 1000,
    actualSent: 520,
    percentAchieved: 52.0,
    partnerLeads: 340,
    convRate: 65.4,
    runRateStatus: 'behind'
  },
  { 
    product: 'HEALTH-CRITICAL-CARE', 
    category: 'Health',
    businessTarget: 350,
    expectedConvRate: 0.70,
    targetSent: 500,
    actualSent: 370,
    percentAchieved: 74.0,
    partnerLeads: 220,
    convRate: 59.5,
    runRateStatus: 'at-risk'
  },
];

type SortKey = 'product' | 'targetSent' | 'actualSent' | 'percentAchieved' | 'partnerLeads' | 'convRate' | 'runRateStatus';
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
        comparison = (a[sortKey] as number) - (b[sortKey] as number);
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
    const sentLeads = performanceData.reduce((sum, row) => sum + row.actualSent, 0);
    const sentLeadsTarget = performanceData.reduce((sum, row) => sum + row.targetSent, 0);
    const partnerLeads = performanceData.reduce((sum, row) => sum + row.partnerLeads, 0);
    const totalSpend = performanceData.length * 200000; // Mock calculation
    const avgCplSent = sentLeads > 0 ? Math.round(totalSpend / sentLeads) : 0;
    const projectedSentLeads = Math.round(sentLeads * 1.25); // Mock projection

    return { sentLeads, sentLeadsTarget, partnerLeads, avgCplSent, totalSpend, projectedSentLeads };
  }, [performanceData]);

  const progressPercent = kpiData.sentLeadsTarget > 0 
    ? (kpiData.sentLeads / kpiData.sentLeadsTarget) * 100 
    : 0;

  return (
    <DashboardLayout title="Overview" subtitle="Control Tower - Executive View">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Sent Leads (Primary Hero Metric) */}
        <Card className="p-4 border-2 border-foreground bg-lead-sent/10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold uppercase text-muted-foreground">Sent Leads (Qualified)</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">Screened leads that passed quality checks and were sent to partners for processing.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
            <Progress value={Math.min(progressPercent, 100)} className="h-2" />
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
            Marketing (Sent) vs Business Reality (Partner)
            {product !== 'all' && <span className="ml-2 text-primary">• Filtered: {product}</span>}
          </p>
        </div>
        <div className="overflow-x-auto">
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
                  onClick={() => handleSort('targetSent')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Target (Sent)
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Partner Target ÷ Expected Conv Rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-right cursor-pointer hover:text-primary bg-lead-sent/10"
                  onClick={() => handleSort('actualSent')}
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
                  className="font-bold text-right cursor-pointer hover:text-primary text-muted-foreground"
                  onClick={() => handleSort('partnerLeads')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Partner (TL)
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-bold text-right cursor-pointer hover:text-primary"
                  onClick={() => handleSort('convRate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    % Conv
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(row.targetSent)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg bg-lead-sent/5">
                      {formatNumber(row.actualSent)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={Math.min(row.percentAchieved, 100)} className="w-16 h-2" />
                        <span className="font-mono text-sm w-14 text-right">{row.percentAchieved.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatNumber(row.partnerLeads)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm font-bold ${
                        row.convRate >= 70 ? 'text-status-scale' :
                        row.convRate >= 50 ? 'text-status-hold' :
                        'text-status-risk'
                      }`}>
                        {formatPercent(row.convRate)}
                      </span>
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
        </div>
      </Card>

      {/* Legend */}
      <div className="mt-4 p-3 bg-secondary/50 border border-border rounded text-xs text-muted-foreground">
        <span className="font-bold">Legend:</span>
        <span className="ml-3">Target (Sent) = Business Target ÷ Expected Conv Rate (70%)</span>
        <span className="mx-2">|</span>
        <span>% Conv colors: <span className="text-status-scale font-bold">≥70% Good</span>, <span className="text-status-hold font-bold">50-70% Watch</span>, <span className="text-status-risk font-bold">&lt;50% Risk</span></span>
      </div>
    </DashboardLayout>
  );
}
