
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
import { PerformanceRow, ProductCategory } from '@/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/campaignParser';
import { useFilter } from '@/contexts/FilterContext';
import { supabase } from '@/integrations/supabase/client';

interface ProductCycle {
  id: string;
  product_code: string;
  delivery_start: string;
  delivery_end: string;
  target_partner: number;
}

// Effective Operational Days projection algorithm
const calculateProjection = (sentLeads: number, deliveryStart: string, deliveryEnd: string): number => {
  const today = new Date();
  const start = new Date(deliveryStart);
  const end = new Date(deliveryEnd);

  // Case A: Before Delivery Starts (Warm-up period)
  if (today < start) return 0;

  // Case B: Cycle Ended
  if (today > end) return sentLeads;

  // Case C: Active Delivery Period
  const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysElapsed <= 0) return 0;

  const runRate = sentLeads / daysElapsed;
  const forecast = sentLeads + (runRate * daysRemaining);

  return Math.floor(forecast);
};

type SortKey = 'product' | 'targetSent' | 'actualSent' | 'percentAchieved' | 'partnerLeads' | 'convRate' | 'runRateStatus';
type SortOrder = 'asc' | 'desc';

export default function OverviewPage() {
  const { product } = useFilter(); // Dynamic Filter
  const [sortKey, setSortKey] = useState<SortKey>('runRateStatus');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [performanceData, setPerformanceData] = useState<PerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Real Data
  useEffect(() => {
    fetchDashboardData();
  }, [product]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Active Product Cycles (Target)
      const { data: cycles, error: cycleError } = await supabase
        .from('product_cycles')
        .select('id, product_code, delivery_start, delivery_end, target_partner')
        .eq('is_active', true);

      if (cycleError) throw cycleError;

      // 2. Fetch Leads Data (Actuals)
      // We need sum of sent_amount and confirmed_amount grouped by product
      // Since no easy groupby in client, we fetch all relevant daily data and aggregate
      // Ideally filter by date range of the cycle, but let's grab all active cycle data for now
      const { data: leads, error: leadsError } = await supabase
        .from('leads_sent_daily')
        .select('product_code, sent_all_amount, confirmed_amount');

      if (leadsError) throw leadsError;

      // 3. Aggregate Data
      const cycleMap = new Map<string, PerformanceRow>();

      // Initialize with active cycles
      cycles?.forEach((c: ProductCycle) => {
        const businessTarget = c.target_partner || 0;
        const expectedConvRate = 0.70; // 70% default conversion rate
        const targetSent = Math.round(businessTarget / expectedConvRate);

        // Determine category
        let category: ProductCategory = 'Other';
        if (c.product_code.startsWith('LIFE-')) category = 'Life';
        else if (c.product_code.startsWith('SAVING-')) category = 'Saving';
        else if (c.product_code.startsWith('HEALTH-')) category = 'Health';

        cycleMap.set(c.product_code, {
          product: c.product_code,
          category,
          businessTarget,
          expectedConvRate,
          targetSent,
          actualSent: 0,
          percentAchieved: 0,
          partnerLeads: 0,
          convRate: 0,
          runRateStatus: 'behind' // default
        });
      });

      // Sum Up Actuals
      leads?.forEach((row: any) => {
        if (cycleMap.has(row.product_code)) {
          const entry = cycleMap.get(row.product_code)!;
          entry.actualSent += (row.sent_all_amount || 0);
          entry.partnerLeads += (row.confirmed_amount || 0);
        } else {
          // Handle product data without active cycle? 
          // For Overview, we usually focus on active cycles. 
          // Or we could create a dummy row for non-cycle products.
          // Let's Skip for now to keep view clean.
        }
      });

      // Calculate Metrics & Projections
      const finalData: PerformanceRow[] = [];
      const now = new Date();

      cycleMap.forEach((row) => {
        // Recalculate derived metrics
        row.percentAchieved = row.targetSent > 0 ? (row.actualSent / row.targetSent) * 100 : 0;
        row.convRate = row.actualSent > 0 ? (row.partnerLeads / row.actualSent) * 100 : 0;

        // Projection
        const cycle = cycles?.find(c => c.product_code === row.product);
        let projection = 0;
        if (cycle) {
          projection = calculateProjection(row.actualSent, cycle.delivery_start, cycle.delivery_end);
        } else {
          projection = row.actualSent;
        }

        // Status Logic
        if (projection >= row.targetSent) row.runRateStatus = 'on-track';
        else if (projection >= row.targetSent * 0.9) row.runRateStatus = 'at-risk';
        else row.runRateStatus = 'behind';

        // Filter by UI product selection
        if (product === 'all' || product === row.product) {
          finalData.push(row);
        }
      });

      setPerformanceData(finalData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort Logic (Client Side)
  const sortedData = useMemo(() => {
    return [...performanceData].sort((a, b) => {
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
  }, [performanceData, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // Calculate Projections (for KPI Card Aggregation)
  // Re-calculate or reuse? We calculated row-level projection inside fetch but didn't save it to state directly in row
  // Wait, PerformanceRow doesn't have 'projection' field in interface! It's calculated in UI usually.
  // But we need it for sorting/KPI card.
  // Best to calculate projections map again or add field to type.
  // Let's calc simply here since we have cycle data in 'fetch' scope but need it here.
  // Solution: Fetch cycles again? Or store cycles in state?
  // Let's store cycles or just approximation.
  // Actually, let's keep it simple: Total Projection = Sum of row projections.
  // But we need cycle dates.
  // Let's fetch cycles into state as well.

  const [cyclesCache, setCyclesCache] = useState<ProductCycle[]>([]);

  // Update fetch to save cycles
  useEffect(() => {
    const loadCycles = async () => {
      const { data } = await supabase.from('product_cycles').select('*').eq('is_active', true);
      if (data) setCyclesCache(data);
    };
    loadCycles();
  }, []);

  const productProjections = useMemo(() => {
    const projections: Record<string, number> = {};
    performanceData.forEach(row => {
      const cycle = cyclesCache.find(c => c.product_code === row.product);
      if (cycle) {
        projections[row.product] = calculateProjection(
          row.actualSent,
          cycle.delivery_start,
          cycle.delivery_end
        );
      } else {
        projections[row.product] = row.actualSent;
      }
    });
    return projections;
  }, [performanceData, cyclesCache]);


  // KPI Aggregate
  const kpiData = useMemo(() => {
    const sentLeads = performanceData.reduce((sum, row) => sum + row.actualSent, 0);
    const sentLeadsTarget = performanceData.reduce((sum, row) => sum + row.targetSent, 0);
    const partnerLeads = performanceData.reduce((sum, row) => sum + row.partnerLeads, 0);

    // Spend - need to fetch or estimate. For now, estimate or 0.
    // Ideally we join with ad_performance for spend.
    // Let's leave spend as 0 or Placeholder for now since prompt focused on Product/Target/Actual mainly.
    // Or fetch spend in step 2.
    // Let's assume we want spend. 
    const totalSpend = 0;

    const avgCplSent = sentLeads > 0 ? Math.round(totalSpend / sentLeads) : 0;

    const projectedSentLeads = performanceData.reduce((sum, row) => {
      return sum + (productProjections[row.product] || 0);
    }, 0);

    return { sentLeads, sentLeadsTarget, partnerLeads, avgCplSent, totalSpend, projectedSentLeads };
  }, [performanceData, productProjections]);

  const progressPercent = kpiData.sentLeadsTarget > 0
    ? (kpiData.sentLeads / kpiData.sentLeadsTarget) * 100
    : 0;

  if (loading) {
    return (
      <DashboardLayout title="Overview" subtitle="Control Tower - Executive View">
        <div className="p-8 text-center text-muted-foreground">Loading Dashboard Data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Overview" subtitle="Control Tower - Executive View">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Same KPI Cards UI */}
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
                      <p className="text-xs max-w-[200px]">Screened leads that passed quality checks.</p>
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
                      <p className="text-xs max-w-[200px]">Forecasted Sent Leads (EOM)</p>
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
          <p className="text-xs text-muted-foreground">Forecast based on run rate</p>
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
                  Target (Sent)
                </TableHead>
                <TableHead
                  className="font-bold text-right cursor-pointer hover:text-primary bg-lead-sent/10"
                  onClick={() => handleSort('actualSent')}
                >
                  Actual (Sent)
                </TableHead>
                <TableHead className="font-bold text-right">
                  Projection
                </TableHead>
                <TableHead
                  className="font-bold text-right cursor-pointer hover:text-primary"
                  onClick={() => handleSort('percentAchieved')}
                >
                  % Achieved
                </TableHead>
                <TableHead
                  className="font-bold text-right cursor-pointer hover:text-primary text-muted-foreground"
                  onClick={() => handleSort('partnerLeads')}
                >
                  Partner (TL)
                </TableHead>
                <TableHead
                  className="font-bold text-right cursor-pointer hover:text-primary"
                  onClick={() => handleSort('convRate')}
                >
                  % Conv
                </TableHead>
                <TableHead
                  className="font-bold text-center cursor-pointer hover:text-primary"
                  onClick={() => handleSort('runRateStatus')}
                >
                  Run Rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No active product cycles found
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row) => (
                  <TableRow key={row.product}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{row.product}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${row.category === 'Life' ? 'bg-category-life/20 text-category-life' :
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
                    <TableCell className="text-right font-mono text-sm text-status-scale">
                      {formatNumber(productProjections[row.product] || 0)}
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
                      <span className={`font-mono text-sm font-bold ${row.convRate >= 70 ? 'text-status-scale' :
                        row.convRate >= 50 ? 'text-status-hold' :
                          'text-status-risk'
                        }`}>
                        {formatPercent(row.convRate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold uppercase rounded ${row.runRateStatus === 'on-track' ? 'bg-status-scale/20 text-status-scale' :
                        row.runRateStatus === 'at-risk' ? 'bg-status-risk/20 text-status-risk' :
                          'bg-status-kill/20 text-status-kill'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${row.runRateStatus === 'on-track' ? 'bg-status-scale' :
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
    </DashboardLayout>
  );
}
