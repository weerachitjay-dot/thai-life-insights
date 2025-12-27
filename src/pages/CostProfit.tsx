
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/campaignParser';
import { supabase } from '@/integrations/supabase/client';
import { ProductSetting } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';
import { format } from 'date-fns';

interface FinancialMetrics {
  product: string;
  spend: number;
  confirmedLeads: number;
  revenue: number;
  profit: number;
  roi: number;
  projection: number;
}

interface ProductCycle {
  id: string;
  product_code: string;
  delivery_start: string;
  delivery_end: string;
  target_leads: number;
}

// Effective Operational Days projection algorithm (from Overview.tsx)
const calculateProjection = (confirmedLeads: number, deliveryStart: string, deliveryEnd: string): number => {
  const today = new Date();
  const start = new Date(deliveryStart);
  const end = new Date(deliveryEnd);

  // Case A: Before Delivery Starts (Warm-up period)
  if (today < start) return 0;

  // Case B: Cycle Ended
  if (today > end) return confirmedLeads;

  // Case C: Active Delivery Period
  const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysElapsed <= 0) return 0;

  const runRate = confirmedLeads / daysElapsed;
  const forecast = confirmedLeads + (runRate * daysRemaining);

  return Math.floor(forecast);
};

export default function CostProfitPage() {
  const { dateRange, product: selectedProduct, account: selectedAccount } = useFilter();
  const [metrics, setMetrics] = useState<FinancialMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ spend: 0, revenue: 0, profit: 0 });

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange, selectedProduct, selectedAccount]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Convert date filter to format expected by logic or DB
      // Supabase supports ISO strings mostly.
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      // 0. Fetch Product Cycles for Projection
      const { data: cycles } = await supabase
        .from('product_cycles')
        .select('product_code, delivery_start, delivery_end, target_leads')
        .eq('is_active', true);

      // 1. Fetch Product Settings (Price)
      // Logic: If 'selectedProduct' is NOT 'all', we could filter here, 
      // but usually settings are small so fetching all is fine.
      let settingsQuery = supabase.from('product_settings').select('*');
      const { data: products } = await settingsQuery;

      // 2. Fetch Ad Performance (Spend) filtered by Date and Account
      let adQuery = supabase
        .from('ad_performance_daily')
        .select('product_code, spend')
        .gte('date', fromDate)
        .lte('date', toDate);

      // Filter by Account if selected (using ad_account_id from meta_ads_daily_stats or account_id)
      // Note: ad_performance_daily doesn't have account info, so we'll skip account filtering here for now
      // If account filtering is needed, the schema needs to be updated to include account_id

      const { data: adPerformance } = await adQuery;

      // 3. Fetch Leads Sent (Confirmed Leads) filtered by Date
      // Assuming leads_sent_daily has a 'date' column
      let leadsQuery = supabase
        .from('leads_sent_daily')
        .select('product_code, confirmed_amount')
        .gte('report_date', fromDate)
        .lte('report_date', toDate);

      const { data: leadsData } = await leadsQuery;

      if (!products || !adPerformance || !leadsData) {
        console.error('Failed to fetch data or empty tables');
        // Don't return early with error view, just render 0s if empty
      }

      // 4. Aggregation Logic
      // Create a map to hold aggregated data by product
      const productMap = new Map<string, { spend: number; confirmedLeads: number; sellPrice: number }>();

      // Initialize map with ALL products from settings first
      // This ensures we show rows even if spend/leads are 0
      products?.forEach((p: ProductSetting) => {
        // Apply Product Filter Here
        if (selectedProduct === 'all' || selectedProduct === p.product_code) {
          productMap.set(p.product_code, {
            spend: 0,
            confirmedLeads: 0,
            sellPrice: p.sell_price
          });
        }
      });

      // Aggregate Spend
      adPerformance?.forEach((row: any) => {
        // If we have selected a specific product, only process matches
        if (selectedProduct !== 'all' && row.product_code !== selectedProduct) return;

        // Try to find exact match
        let entry = productMap.get(row.product_code);

        if (entry) {
          entry.spend += (row.spend || 0);
        } else {
          // Product in Ads but NOT in Settings?
          // Optionally add it if user wants to see 'Unconfigured Products'
          // For now, adhere to Strict Product Settings List
        }
      });

      // Aggregate Confirmed Leads
      leadsData?.forEach((row: any) => {
        if (selectedProduct !== 'all' && row.product_code !== selectedProduct) return;
        let entry = productMap.get(row.product_code);
        if (entry) {
          entry.confirmedLeads += (row.confirmed_amount || 0);
        }
      });


      // Calculate Revenue, Profit, ROI
      const calculatedMetrics: FinancialMetrics[] = [];
      let totalSpend = 0;
      let totalRevenue = 0;
      let totalProfit = 0;

      productMap.forEach((val, key) => {
        const revenue = val.confirmedLeads * val.sellPrice;
        const profit = revenue - val.spend;
        const roi = val.spend > 0 ? (profit / val.spend) * 100 : 0;

        // Calculate Projection
        const cycle = cycles?.find(c => c.product_code === key);
        let projection = val.confirmedLeads; // Default to current confirmed leads
        if (cycle) {
          projection = calculateProjection(
            val.confirmedLeads,
            cycle.delivery_start,
            cycle.delivery_end
          );
        }

        calculatedMetrics.push({
          product: key,
          spend: val.spend,
          confirmedLeads: val.confirmedLeads,
          revenue,
          profit,
          roi,
          projection
        });

        totalSpend += val.spend;
        totalRevenue += revenue;
        totalProfit += profit;
      });

      setMetrics(calculatedMetrics.sort((a, b) => b.revenue - a.revenue));
      setTotals({ spend: totalSpend, revenue: totalRevenue, profit: totalProfit });

    } catch (error) {
      console.error('Error calculating financials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Cost & Profit" subtitle="ROI & Revenue Analysis - TL Leads Focus">
        <div className="p-8 text-center text-muted-foreground">Loading Financial Data...</div>
      </DashboardLayout>
    );
  }

  const overallRoi = totals.spend > 0 ? (totals.profit / totals.spend) * 100 : 0;

  return (
    <DashboardLayout title="Cost & Profit" subtitle="ROI & Revenue Analysis - TL Leads Focus">

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">{formatCurrency(totals.revenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded">
              <DollarSign className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <p className="text-xl font-bold">{formatCurrency(totals.spend)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(totals.profit)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-foreground">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded ${overallRoi >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {overallRoi >= 0 ?
                <ArrowUpRight className="w-6 h-6 text-green-500" /> :
                <ArrowDownRight className="w-6 h-6 text-red-500" />
              }
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall ROI</p>
              <p className={`text-xl font-bold ${overallRoi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {overallRoi.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-2 border-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Confirmed Leads</TableHead>
              <TableHead className="text-right">Projection</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Net Profit</TableHead>
              <TableHead className="text-right">ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No data found for the selected period.
                  <br /><span className="text-xs">Ensure data exists in `ad_performance_daily` and `leads_sent_daily`.</span>
                </TableCell>
              </TableRow>
            ) : (
              metrics.map((item) => (
                <TableRow key={item.product}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.confirmedLeads)}</TableCell>
                  <TableCell className="text-right text-status-scale font-mono">{formatNumber(item.projection)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.spend)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                  <TableCell className={`text-right font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(item.profit)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${item.roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {item.roi.toFixed(0)}%
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
