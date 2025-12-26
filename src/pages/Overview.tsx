import { useMemo, useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface ProductCycle {
  id: string;
  product_name: string;
  delivery_start: string;
  delivery_end: string;
  target_partner: number;
}

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

// Effective Operational Days projection algorithm
// Returns: { projection, elapsedDays, remainingDays, runRate, status }
interface ProjectionResult {
  projection: number;
  elapsedDays: number;
  remainingDays: number;
  runRate: number;
  status: 'pending' | 'active' | 'ended';
}

const calculateProjection = (sentLeads: number, deliveryStart: string, deliveryEnd: string): ProjectionResult => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  const start = new Date(deliveryStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(deliveryEnd);
  end.setHours(0, 0, 0, 0);

  // Case A: Before Delivery Starts (Warm-up period)
  if (today < start) {
    return {
      projection: 0,
      elapsedDays: 0,
      remainingDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      runRate: 0,
      status: 'pending'
    };
  }

  // Case B: Cycle Ended
  if (today > end) {
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      projection: sentLeads,
      elapsedDays: totalDays,
      remainingDays: 0,
      runRate: totalDays > 0 ? sentLeads / totalDays : 0,
      status: 'ended'
    };
  }

  // Case C: Active Delivery Period
  // Calculate elapsed days starting from deliveryStart (inclusive of today)
  const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate remaining days until deliveryEnd (inclusive)
  const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Protect against division by zero
  if (elapsedDays <= 0) {
    return {
      projection: 0,
      elapsedDays: 0,
      remainingDays,
      runRate: 0,
      status: 'active'
    };
  }
  
  const runRate = sentLeads / elapsedDays;
  const forecast = sentLeads + (runRate * remainingDays);

  return {
    projection: Math.floor(forecast),
    elapsedDays,
    remainingDays,
    runRate: Math.round(runRate * 10) / 10,
    status: 'active'
  };
};

type SortKey = 'product' | 'targetSent' | 'actualSent' | 'percentAchieved' | 'partnerLeads' | 'convRate' | 'runRateStatus';
type SortOrder = 'asc' | 'desc';

export default function OverviewPage() {
  const { product } = useFilter();
  const [sortKey, setSortKey] = useState<SortKey>('runRateStatus');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [productCycles, setProductCycles] = useState<ProductCycle[]>([]);

  // Fetch product cycles from Supabase
  useEffect(() => {
    const fetchCycles = async () => {
      const { data, error } = await supabase
        .from('product_cycles')
        .select('id, product_name, delivery_start, delivery_end, target_partner')
        .eq('is_active', true);

      if (!error && data) {
        setProductCycles(data);
      }
    };
    fetchCycles();
  }, []);

  // Merge mock data with target_partner from Supabase
  const performanceDataWithTargets = useMemo(() => {
    return allPerformanceData.map(row => {
      const cycle = productCycles.find(c => c.product_name === row.product);
      if (cycle) {
        // Use target_partner from Supabase instead of hardcoded businessTarget
        const newBusinessTarget = cycle.target_partner;
        const expectedConvRate = row.expectedConvRate || 0.70;
        const newTargetSent = Math.round(newBusinessTarget / expectedConvRate);
        const newPercentAchieved = newTargetSent > 0 
          ? (row.actualSent / newTargetSent) * 100 
          : 0;
        
        return {
          ...row,
          businessTarget: newBusinessTarget,
          targetSent: newTargetSent,
          percentAchieved: newPercentAchieved
        };
      }
      return row;
    });
  }, [productCycles]);

  // Filter data based on selected product
  const filteredData = useMemo(() => {
    if (product === 'all') return performanceDataWithTargets;
    return performanceDataWithTargets.filter(row => row.product === product);
  }, [product, performanceDataWithTargets]);

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

  // Calculate projections using the Effective Operational Days algorithm
  const productProjections = useMemo(() => {
    const projections: Record<string, ProjectionResult> = {};
    
    performanceData.forEach(row => {
      const cycle = productCycles.find(c => c.product_name === row.product);
      if (cycle) {
        projections[row.product] = calculateProjection(
          row.actualSent,
          cycle.delivery_start,
          cycle.delivery_end
        );
      } else {
        // Fallback: use a simple 1.25x multiplier if no cycle configured
        projections[row.product] = {
          projection: Math.round(row.actualSent * 1.25),
          elapsedDays: 0,
          remainingDays: 0,
          runRate: 0,
          status: 'pending' as const
        };
      }
    });
    
    return projections;
  }, [performanceData, productCycles]);

  // Calculate KPIs based on filtered data
  const kpiData = useMemo(() => {
    const sentLeads = performanceData.reduce((sum, row) => sum + row.actualSent, 0);
    const sentLeadsTarget = performanceData.reduce((sum, row) => sum + row.targetSent, 0);
    const partnerLeads = performanceData.reduce((sum, row) => sum + row.partnerLeads, 0);
    const totalSpend = performanceData.length * 200000; // Mock calculation
    const avgCplSent = sentLeads > 0 ? Math.round(totalSpend / sentLeads) : 0;
    
    // Sum all individual product projections
    const projectedSentLeads = performanceData.reduce((sum, row) => {
      return sum + (productProjections[row.product]?.projection || 0);
    }, 0);

    return { sentLeads, sentLeadsTarget, partnerLeads, avgCplSent, totalSpend, projectedSentLeads };
  }, [performanceData, productProjections]);

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
                      <p className="text-xs max-w-[200px]">Effective Operational Days: Current + (Run Rate × Days Remaining). Based on delivery window configured in Data Management.</p>
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
          <p className="text-[10px] text-muted-foreground/70 mt-1">Based on delivery window run rate</p>
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
                <TableHead className="font-bold text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          Projection
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Forecasted based on delivery window</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    <TableCell className="text-right font-mono text-sm">
                      {productProjections[row.product]?.status === 'pending' ? (
                        <span className="text-muted-foreground">Pending</span>
                      ) : (
                        <span className="text-status-scale">{formatNumber(productProjections[row.product]?.projection || 0)}</span>
                      )}
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
        <span>Projection = Effective Operational Days Algorithm</span>
        <span className="mx-2">|</span>
        <span>% Conv colors: <span className="text-status-scale font-bold">≥70% Good</span>, <span className="text-status-hold font-bold">50-70% Watch</span>, <span className="text-status-risk font-bold">&lt;50% Risk</span></span>
      </div>
    </DashboardLayout>
  );
}
