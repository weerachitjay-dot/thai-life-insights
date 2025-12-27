import { useState, useEffect, useMemo } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FilterBar from '@/components/dashboard/FilterBar';
import KpiCards from '@/components/dashboard/KpiCards';
import ProductMatrix from '@/components/dashboard/ProductMatrix';
import LeadQualityChart from '@/components/dashboard/LeadQualityChart';
import CreativeAnalysis from '@/components/dashboard/CreativeAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiData, ProductMatrixRow, CampaignStatus, ProductCategory, ProductSetting } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useFilter } from '@/contexts/FilterContext';
import { format } from 'date-fns';

export default function Index() {
  const [activeTab, setActiveTab] = useState('matrix');
  const { dateRange, product: selectedProduct } = useFilter();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KpiData>({ totalSpend: 0, totalLeads: 0, avgCpl: 0, riskCampaigns: 0 });
  const [matrixData, setMatrixData] = useState<ProductMatrixRow[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedProduct]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      // 1. Fetch Settings for targets & product list
      const { data: settings } = await supabase.from('product_settings').select('*');

      // 2. Fetch Ad Performance (Meta Layer)
      const { data: ads } = await supabase
        .from('ad_performance_daily')
        .select('product_code, spend, meta_leads')
        .gte('date', fromDate)
        .lte('date', toDate);

      // 3. Fetch Leads (Quality Layer)
      const { data: leads } = await supabase
        .from('leads_sent_daily')
        .select('product_code, sent_all_amount')
        .gte('report_date', fromDate)
        .lte('report_date', toDate);

      // Build Product Aggregation Map
      const productMap = new Map<string, {
        spend: number;
        metaLeads: number;
        sentLeads: number;
        targetCpl: number;
        category: ProductCategory;
      }>();

      // Initialize from settings
      settings?.forEach((s: ProductSetting) => {
        let category: ProductCategory = 'Other';
        if (s.product_code.startsWith('LIFE')) category = 'Life';
        else if (s.product_code.startsWith('SAVING')) category = 'Saving';
        else if (s.product_code.startsWith('HEALTH')) category = 'Health';

        productMap.set(s.product_code, {
          spend: 0,
          metaLeads: 0,
          sentLeads: 0,
          targetCpl: s.target_cpl || 200,
          category
        });
      });

      // Aggregate Ads
      ads?.forEach((row: any) => {
        const item = productMap.get(row.product_code);
        if (item) {
          item.spend += (row.spend || 0);
          item.metaLeads += (row.meta_leads || 0);
        }
      });

      // Aggregate Leads
      leads?.forEach((row: any) => {
        const item = productMap.get(row.product_code);
        if (item) {
          item.sentLeads += (row.sent_all_amount || 0);
        }
      });

      // Filter if needed
      const filteredProducts = Array.from(productMap.entries()).filter(([code]) =>
        selectedProduct === 'all' || code === selectedProduct
      );

      // Calculate KPI Data
      let totalSpend = 0;
      let totalLeads = 0;
      let riskCount = 0;

      filteredProducts.forEach(([_, item]) => {
        totalSpend += item.spend;
        totalLeads += item.metaLeads;
        const cpl = item.metaLeads > 0 ? item.spend / item.metaLeads : 0;
        if (cpl > item.targetCpl * 1.5) riskCount++;
      });

      const avgCpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;

      setKpiData({ totalSpend, totalLeads, avgCpl, riskCampaigns: riskCount });

      // Calculate Product Matrix
      const matrix: ProductMatrixRow[] = filteredProducts.map(([code, item]) => {
        // Lead Gen CPL (Meta)
        const metaCpl = item.metaLeads > 0 ? Math.round(item.spend / item.metaLeads) : 0;
        const metaStatus = getCplStatus(metaCpl, item.targetCpl);

        // Conversion CPL (Sent)
        const sentCpl = item.sentLeads > 0 ? Math.round(item.spend / item.sentLeads) : 0;
        const sentStatus = getCplStatus(sentCpl, item.targetCpl * 2); // Sent typically 2x target

        // Action Logic
        let action = 'Monitor';
        if (metaStatus === 'SCALE' && sentStatus === 'SCALE') action = 'Boost All Channels';
        else if (metaStatus === 'SCALE') action = 'Boost Lead Gen';
        else if (sentStatus === 'SCALE') action = 'Boost Conversion';
        else if (metaStatus === 'KILL' || sentStatus === 'KILL') action = 'Stop Campaign';
        else if (metaStatus === 'RISK' || sentStatus === 'RISK') action = 'Review Performance';

        return {
          product: code,
          category: item.category,
          leadGen: item.metaLeads > 0 ? { cpl: metaCpl, status: metaStatus } : null,
          conversion: item.sentLeads > 0 ? { cpl: sentCpl, status: sentStatus } : null,
          messages: null, // Not implemented yet
          action
        };
      });

      setMatrixData(matrix);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to empty states
      setKpiData({ totalSpend: 0, totalLeads: 0, avgCpl: 0, riskCampaigns: 0 });
      setMatrixData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Determine CPL Status
  const getCplStatus = (actualCpl: number, targetCpl: number): CampaignStatus => {
    if (actualCpl === 0) return 'UNKNOWN';
    const ratio = actualCpl / targetCpl;
    if (ratio <= 0.8) return 'SCALE';
    if (ratio <= 1.2) return 'HOLD';
    if (ratio <= 1.5) return 'RISK';
    return 'KILL';
  };

  const lastUpdated = useMemo(() => format(new Date(), 'MMM dd, yyyy HH:mm'), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading Dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar />
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <KpiCards data={kpiData} />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-2 border-foreground bg-card p-0 h-auto">
            <TabsTrigger
              value="matrix"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 font-bold uppercase text-sm border-r-2 border-foreground rounded-none"
            >
              Product Matrix
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 font-bold uppercase text-sm border-r-2 border-foreground rounded-none"
            >
              Lead Quality
            </TabsTrigger>
            <TabsTrigger
              value="creative"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 font-bold uppercase text-sm rounded-none"
            >
              Creative Analysis
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="matrix" className="m-0">
              {matrixData.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground border-2 border-foreground">
                  No product data available for selected filters
                </div>
              ) : (
                <ProductMatrix data={matrixData} />
              )}
            </TabsContent>

            <TabsContent value="leads" className="m-0">
              <LeadQualityChart />
            </TabsContent>

            <TabsContent value="creative" className="m-0">
              <CreativeAnalysis />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Stats */}
        <div className="mt-8 p-4 bg-secondary border-2 border-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6">
              <span className="font-mono">
                <span className="text-muted-foreground">Last Updated:</span>{' '}
                <span className="font-bold">{lastUpdated}</span>
              </span>
              <span className="font-mono">
                <span className="text-muted-foreground">Data Source:</span>{' '}
                <span className="font-bold">Supabase</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-scale border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Scale</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-hold border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Hold</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-risk border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Risk</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-status-kill border border-foreground"></span>
                <span className="text-xs font-bold uppercase">Kill</span>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
